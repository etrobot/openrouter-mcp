import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { OPENROUTER_CONFIG } from "../config.js";

export function setupResourceHandlers(server: Server): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
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
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      switch (uri) {
        case "openrouter://models":
          return await getModelsResource();
        case "openrouter://pricing":
          return await getPricingResource();
        case "openrouter://usage":
          return await getUsageResource();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to read resource ${uri}: ${error}`);
    }
  });
}

async function getModelsResource() {
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

async function getPricingResource() {
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

async function getUsageResource() {
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