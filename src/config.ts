import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// OpenRouter API configuration
export const OPENROUTER_CONFIG = {
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