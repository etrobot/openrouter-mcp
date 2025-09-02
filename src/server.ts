#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";
import dotenv from "dotenv";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, extname } from "path";

// Load environment variables
dotenv.config();

// Content schemas for multimodal support
const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ImageUrlContentSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string().describe("Image URL or data URI (data:image/jpeg;base64,...)"),
    detail: z.enum(["low", "high", "auto"]).optional().describe("Image detail level"),
  }),
});

const ContentSchema = z.union([TextContentSchema, ImageUrlContentSchema]);

const MessageContentSchema = z.union([
  z.string().describe("Simple text message"),
  z.array(ContentSchema).describe("Array of content objects for multimodal messages"),
]);

// Validation schemas
const ChatRequestSchema = z.object({
  model: z.string().describe("OpenRouter model ID (e.g., 'openai/gpt-4')"),
  message: MessageContentSchema.describe("Message content (text or multimodal array)"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  system_prompt: z.string().optional().describe("System prompt for the conversation"),
  save_directory: z.string().optional().describe("Directory to save generated images (will be created if doesn't exist)"),
});

const ImageGenerationSchema = z.object({
  model: z.string().describe("OpenRouter image model ID (e.g., 'google/gemini-2.5-flash-image-preview:free')"),
  prompt: z.string().describe("Text prompt for image generation"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  save_directory: z.string().optional().describe("Directory to save generated images (will be created if doesn't exist)"),
});

const CompareModelsSchema = z.object({
  models: z.array(z.string()).describe("Array of model IDs to compare"),
  message: MessageContentSchema.describe("Message content (text or multimodal array)"),
  max_tokens: z.number().optional().default(500).describe("Maximum tokens per response"),
});

// OpenRouter API configuration
const OPENROUTER_CONFIG = {
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_NAME || "OpenRouter MCP Server",
    "Content-Type": "application/json",
  },
};

// Check if API key is available
if (!OPENROUTER_CONFIG.apiKey) {
  console.error("WARNING: OPENROUTER_API_KEY environment variable is not set!");
  console.error("Please set OPENROUTER_API_KEY to use the OpenRouter MCP server.");
}

// Utility functions for image handling
function saveBase64Image(base64Data: string, directory: string, filename?: string): string {
  // Ensure directory exists
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  // Extract image format from base64 data
  const matches = base64Data.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image data format");
  }

  const imageType = matches[1]; // e.g., 'png', 'jpeg', 'jpg'
  const actualBase64Data = matches[2];

  // Generate filename if not provided
  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filename = `image_${timestamp}.${imageType}`;
  } else if (!extname(filename)) {
    filename = `${filename}.${imageType}`;
  }

  const filepath = join(directory, filename);

  // Convert base64 to buffer and save
  const imageBuffer = Buffer.from(actualBase64Data, 'base64');
  writeFileSync(filepath, imageBuffer);

  return filepath;
}

function saveResponseImages(images: any[], saveDirectory?: string): Array<{ url: string; savedPath?: string }> {
  if (!saveDirectory || !images?.length) {
    return images?.map(img => ({ url: img.image_url?.url || "" })) || [];
  }

  return images.map((img, index) => {
    const imageUrl = img.image_url?.url || "";
    let savedPath: string | undefined;

    try {
      if (imageUrl.startsWith('data:image/')) {
        savedPath = saveBase64Image(imageUrl, saveDirectory, `generated_image_${index + 1}`);
      }
    } catch (error) {
      console.error(`Failed to save image ${index + 1}:`, error);
    }

    return { url: imageUrl, savedPath };
  });
}

class OpenRouterMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "openrouter-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupErrorHandling();
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "openrouter://models",
            name: "Available Models",
            description: "List of all available OpenRouter models with pricing",
            mimeType: "application/json",
          },
          {
            uri: "openrouter://pricing",
            name: "Model Pricing",
            description: "Current pricing information for all models",
            mimeType: "application/json",
          },
          {
            uri: "openrouter://usage",
            name: "Usage Statistics",
            description: "Your OpenRouter usage statistics",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case "openrouter://models":
            return await this.getModelsResource();
          case "openrouter://pricing":
            return await this.getPricingResource();
          case "openrouter://usage":
            return await this.getUsageResource();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error}`);
      }
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_models",
            description: "Get list of available OpenRouter models",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "chat_with_model",
            description: "Send a message to a specific OpenRouter model (supports text and images)",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "OpenRouter model ID (e.g., 'openai/gpt-4')",
                },
                message: {
                  oneOf: [
                    {
                      type: "string",
                      description: "Simple text message",
                    },
                    {
                      type: "array",
                      description: "Multimodal message with text and/or images",
                      items: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              type: { type: "string", enum: ["text"] },
                              text: { type: "string" },
                            },
                            required: ["type", "text"],
                          },
                          {
                            type: "object",
                            properties: {
                              type: { type: "string", enum: ["image_url"] },
                              image_url: {
                                type: "object",
                                properties: {
                                  url: { 
                                    type: "string",
                                    description: "Image URL or data URI (data:image/jpeg;base64,...)",
                                  },
                                  detail: {
                                    type: "string",
                                    enum: ["low", "high", "auto"],
                                    description: "Image detail level",
                                  },
                                },
                                required: ["url"],
                              },
                            },
                            required: ["type", "image_url"],
                          },
                        ],
                      },
                    },
                  ],
                },
                max_tokens: {
                  type: "number",
                  description: "Maximum tokens in response",
                  default: 1000,
                },
                temperature: {
                  type: "number",
                  description: "Temperature for response randomness",
                  default: 0.7,
                },
                system_prompt: {
                  type: "string",
                  description: "System prompt for the conversation",
                },
                save_directory: {
                  type: "string",
                  description: "Directory to save generated images (will be created if doesn't exist)",
                },
              },
              required: ["model", "message"],
            },
          },
          {
            name: "compare_models",
            description: "Compare responses from multiple models (supports text and images)",
            inputSchema: {
              type: "object",
              properties: {
                models: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Array of model IDs to compare",
                },
                message: {
                  oneOf: [
                    {
                      type: "string",
                      description: "Simple text message",
                    },
                    {
                      type: "array",
                      description: "Multimodal message with text and/or images",
                      items: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              type: { type: "string", enum: ["text"] },
                              text: { type: "string" },
                            },
                            required: ["type", "text"],
                          },
                          {
                            type: "object",
                            properties: {
                              type: { type: "string", enum: ["image_url"] },
                              image_url: {
                                type: "object",
                                properties: {
                                  url: { 
                                    type: "string",
                                    description: "Image URL or data URI (data:image/jpeg;base64,...)",
                                  },
                                  detail: {
                                    type: "string",
                                    enum: ["low", "high", "auto"],
                                    description: "Image detail level",
                                  },
                                },
                                required: ["url"],
                              },
                            },
                            required: ["type", "image_url"],
                          },
                        ],
                      },
                    },
                  ],
                },
                max_tokens: {
                  type: "number",
                  description: "Maximum tokens per response",
                  default: 500,
                },
              },
              required: ["models", "message"],
            },
          },
          {
            name: "generate_image",
            description: "Generate images using OpenRouter image models",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "OpenRouter image model ID (e.g., 'google/gemini-2.5-flash-image-preview:free')",
                },
                prompt: {
                  type: "string",
                  description: "Text prompt for image generation",
                },
                max_tokens: {
                  type: "number",
                  description: "Maximum tokens in response",
                  default: 1000,
                },
                temperature: {
                  type: "number",
                  description: "Temperature for response randomness",
                  default: 0.7,
                },
                save_directory: {
                  type: "string",
                  description: "Directory to save generated images (will be created if doesn't exist)",
                },
              },
              required: ["model", "prompt"],
            },
          },
          {
            name: "get_model_info",
            description: "Get detailed information about a specific model",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "Model ID to get information about",
                },
              },
              required: ["model"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_models":
            return await this.listModels();
          case "chat_with_model":
            return await this.chatWithModel(ChatRequestSchema.parse(args));
          case "compare_models":
            return await this.compareModels(CompareModelsSchema.parse(args));
          case "generate_image":
            return await this.generateImage(ImageGenerationSchema.parse(args));
          case "get_model_info":
            return await this.getModelInfo(args as { model: string });
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Tool ${name} error:`, error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  // Resource handlers
  private async getModelsResource() {
    const response = await axios.get(`${OPENROUTER_CONFIG.baseURL}/models`, {
      headers: OPENROUTER_CONFIG.headers,
    });

    return {
      contents: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getPricingResource() {
    const response = await axios.get(`${OPENROUTER_CONFIG.baseURL}/models`, {
      headers: OPENROUTER_CONFIG.headers,
    });

    const pricing = response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      pricing: model.pricing,
    }));

    return {
      contents: [
        {
          type: "text" as const,
          text: JSON.stringify(pricing, null, 2),
        },
      ],
    };
  }

  private async getUsageResource() {
    // OpenRouter doesn't have a direct usage endpoint, so we'll return a placeholder
    const usage = {
      message: "Usage statistics would be available here",
      note: "OpenRouter doesn't provide a direct usage API endpoint",
    };

    return {
      contents: [
        {
          type: "text" as const,
          text: JSON.stringify(usage, null, 2),
        },
      ],
    };
  }

  // Tool handlers
  private async listModels() {
    const response = await axios.get(`${OPENROUTER_CONFIG.baseURL}/models`, {
      headers: OPENROUTER_CONFIG.headers,
    });

    const models = response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
      pricing: model.pricing,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${models.length} available models:\n\n${JSON.stringify(models, null, 2)}`,
        },
      ],
    };
  }

  private async chatWithModel(params: z.infer<typeof ChatRequestSchema>) {
    const { model, message, max_tokens, temperature, system_prompt, save_directory } = params;

    const messages = [];
    if (system_prompt) {
      messages.push({ role: "system", content: system_prompt });
    }
    messages.push({ role: "user", content: message });

    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseURL}/chat/completions`,
      {
        model,
        messages,
        max_tokens,
        temperature,
      },
      { headers: OPENROUTER_CONFIG.headers }
    );

    const result = response.data.choices[0].message.content;
    const usage = response.data.usage;

    // Check if the response contains generated images
    const responseImages = response.data.choices[0].message.images || [];
    
    // Save images if directory is specified
    const savedImages = saveResponseImages(responseImages, save_directory);
    
    let responseText = `**Model:** ${model}\n**Response:** ${result}`;
    
    if (responseImages.length > 0) {
      responseText += `\n\n**Generated Images:** ${responseImages.length} image(s)`;
      savedImages.forEach((imgInfo, index) => {
        responseText += `\n- Image ${index + 1}: ${imgInfo.url.substring(0, 50)}...`;
        if (imgInfo.savedPath) {
          responseText += `\n  Saved to: ${imgInfo.savedPath}`;
        }
      });
    }

    responseText += `\n\n**Usage:**\n- Prompt tokens: ${usage.prompt_tokens}\n- Completion tokens: ${usage.completion_tokens}\n- Total tokens: ${usage.total_tokens}`;

    return {
      content: [
        {
          type: "text" as const,
          text: responseText,
        },
        // Note: Images are saved to disk, not returned inline to avoid Base64 parsing issues
      ],
    };
  }

  private async compareModels(params: z.infer<typeof CompareModelsSchema>) {
    const { models, message, max_tokens } = params;

    const promises = models.map(async (model) => {
      try {
        const response = await axios.post(
          `${OPENROUTER_CONFIG.baseURL}/chat/completions`,
          {
            model,
            messages: [{ role: "user", content: message }],
            max_tokens,
          },
          { headers: OPENROUTER_CONFIG.headers }
        );

        const responseImages = response.data.choices[0].message.images || [];

        return {
          model,
          response: response.data.choices[0].message.content,
          images: responseImages,
          usage: response.data.usage,
          success: true,
        };
      } catch (error) {
        return {
          model,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        };
      }
    });

    const results = await Promise.all(promises);

    const formattedResults = results
      .map((result) => {
        if (result.success) {
          let modelResult = `**${result.model}:**\n${result.response}`;
          if (result.images && result.images.length > 0) {
            modelResult += `\n*Generated ${result.images.length} image(s)*`;
          }
          modelResult += `\n*Tokens: ${result.usage.total_tokens}*`;
          return modelResult;
        } else {
          return `**${result.model}:** ❌ Error - ${result.error}`;
        }
      })
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Comparison of ${models.length} models:\n\n${formattedResults}`,
        },
      ],
    };
  }

  private async generateImage(params: z.infer<typeof ImageGenerationSchema>) {
    const { model, prompt, max_tokens, temperature, save_directory } = params;

    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseURL}/chat/completions`,
      {
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens,
        temperature,
      },
      { headers: OPENROUTER_CONFIG.headers }
    );

    const result = response.data.choices[0].message.content;
    const usage = response.data.usage;
    // OpenRouter returns images in the message.images array
    const responseImages = response.data.choices[0].message.images || [];
    

    // Save images if directory is specified
    const savedImages = saveResponseImages(responseImages, save_directory);

    let responseText = `**Model:** ${model}\n**Prompt:** ${prompt}\n**Response:** ${result}`;
    
    if (responseImages.length > 0) {
      responseText += `\n\n**Generated Images:** ${responseImages.length} image(s)`;
      savedImages.forEach((imgInfo, index) => {
        responseText += `\n- Image ${index + 1}: ${imgInfo.url.substring(0, 50)}...`;
        if (imgInfo.savedPath) {
          responseText += `\n  Saved to: ${imgInfo.savedPath}`;
        }
      });
    }

    responseText += `\n\n**Usage:**\n- Prompt tokens: ${usage.prompt_tokens}\n- Completion tokens: ${usage.completion_tokens}\n- Total tokens: ${usage.total_tokens}`;

    return {
      content: [
        {
          type: "text" as const,
          text: responseText,
        },
        // Note: Images are saved to disk, not returned inline to avoid Base64 parsing issues
      ],
    };
  }

  private async getModelInfo(params: { model: string }) {
    const response = await axios.get(`${OPENROUTER_CONFIG.baseURL}/models`, {
      headers: OPENROUTER_CONFIG.headers,
    });

    const model = response.data.data.find((m: any) => m.id === params.model);

    if (!model) {
      throw new Error(`Model ${params.model} not found`);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(model, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenRouter MCP Server running on stdio");
  }
}

// Start the server
const server = new OpenRouterMCPServer();
server.run().catch(console.error);