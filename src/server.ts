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

// Load environment variables
dotenv.config();

// Validation schemas
const ChatRequestSchema = z.object({
  model: z.string().describe("OpenRouter model ID (e.g., 'openai/gpt-4')"),
  message: z.string().describe("Message to send to the model"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  system_prompt: z.string().optional().describe("System prompt for the conversation"),
});

const CompareModelsSchema = z.object({
  models: z.array(z.string()).describe("Array of model IDs to compare"),
  message: z.string().describe("Message to send to all models"),
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
            description: "Send a message to a specific OpenRouter model",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "OpenRouter model ID (e.g., 'openai/gpt-4')",
                },
                message: {
                  type: "string",
                  description: "Message to send to the model",
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
              },
              required: ["model", "message"],
            },
          },
          {
            name: "compare_models",
            description: "Compare responses from multiple models",
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
                  type: "string",
                  description: "Message to send to all models",
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
    const { model, message, max_tokens, temperature, system_prompt } = params;

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

    return {
      content: [
        {
          type: "text" as const,
          text: `**Model:** ${model}\n**Response:** ${result}\n\n**Usage:**\n- Prompt tokens: ${usage.prompt_tokens}\n- Completion tokens: ${usage.completion_tokens}\n- Total tokens: ${usage.total_tokens}`,
        },
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

        return {
          model,
          response: response.data.choices[0].message.content,
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
          return `**${result.model}:**\n${result.response}\n*Tokens: ${result.usage.total_tokens}*`;
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