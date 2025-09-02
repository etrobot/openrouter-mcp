import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { OPENROUTER_CONFIG } from "../config.js";
import { saveResponseImages } from "../utils/image.js";
import {
  ChatRequestSchema,
  CompareModelsSchema,
  ImageGenerationSchema,
  ImageEditingSchema,
  type ChatRequest,
  type CompareModelsRequest,
  type ImageGenerationRequest,
  type ImageEditingRequest,
} from "../types.js";

export function setupToolHandlers(server: Server): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                description: "OpenRouter image model ID (google/gemini-2.5-flash-image-preview:free or google/gemini-2.5-flash-image-preview)",
                default: "google/gemini-2.5-flash-image-preview:free",
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
            required: ["prompt"],
          },
        },
        {
          name: "edit_image",
          description: "Edit images using OpenRouter image models (supports multiple images)",
          inputSchema: {
            type: "object",
            properties: {
              model: {
                type: "string",
                description: "OpenRouter image model ID (google/gemini-2.5-flash-image-preview:free or google/gemini-2.5-flash-image-preview)",
                default: "google/gemini-2.5-flash-image-preview:free",
              },
              instruction: {
                type: "string",
                description: "Text instruction for image editing (e.g., 'change this image', 'make it brighter', 'add a sunset')",
              },
              images: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Array of image URLs or data URIs (data:image/jpeg;base64,...) to edit",
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
                description: "Directory to save edited images (will be created if doesn't exist)",
              },
            },
            required: ["instruction", "images"],
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
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "list_models":
          return await listModels();
        case "chat_with_model":
          return await chatWithModel(ChatRequestSchema.parse(args));
        case "compare_models":
          return await compareModels(CompareModelsSchema.parse(args));
        case "generate_image":
          return await generateImage(ImageGenerationSchema.parse(args));
        case "edit_image":
          return await editImage(ImageEditingSchema.parse(args));
        case "get_model_info":
          return await getModelInfo(args as { model: string });
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

async function listModels() {
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

async function chatWithModel(params: ChatRequest) {
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
    ],
  };
}

async function compareModels(params: CompareModelsRequest) {
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

async function generateImage(params: ImageGenerationRequest) {
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
    ],
  };
}

async function editImage(params: ImageEditingRequest) {
  const { model, instruction, images, max_tokens, temperature, save_directory } = params;

  // Build the content array with text instruction and image URLs
  const content = [
    {
      type: "text",
      text: instruction,
    },
    ...images.map(imageUrl => ({
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    })),
  ];

  const response = await axios.post(
    `${OPENROUTER_CONFIG.baseURL}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "user",
          content,
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

  let responseText = `**Model:** ${model}\n**Instruction:** ${instruction}\n**Input Images:** ${images.length} image(s)\n**Response:** ${result}`;
  
  if (responseImages.length > 0) {
    responseText += `\n\n**Edited Images:** ${responseImages.length} image(s)`;
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
    ],
  };
}

async function getModelInfo(params: { model: string }) {
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