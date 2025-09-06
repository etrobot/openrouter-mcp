import { z } from "zod";

// Content schemas for multimodal support
export const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const ImageUrlContentSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string().describe("Image URL or data URI (data:image/jpeg;base64,...)"),
    detail: z.enum(["low", "high", "auto"]).optional().describe("Image detail level"),
  }),
});

export const ContentSchema = z.union([TextContentSchema, ImageUrlContentSchema]);

export const MessageContentSchema = z.union([
  z.string().describe("Simple text message"),
  z.array(ContentSchema).describe("Array of content objects for multimodal messages"),
]);

// Validation schemas
export const ChatRequestSchema = z.object({
  model: z.string().describe("OpenRouter model ID (e.g., 'openai/gpt-4')"),
  message: MessageContentSchema.describe("Message content (text or multimodal array)"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  system_prompt: z.string().optional().describe("System prompt for the conversation"),
  save_directory: z.string().optional().describe("Directory to save generated images (will be created if doesn't exist)"),
});

export const ImageGenerationSchema = z.object({
  model: z.string().optional().default("google/gemini-2.5-flash-image-preview:free").describe("OpenRouter image model ID (google/gemini-2.5-flash-image-preview:free or google/gemini-2.5-flash-image-preview)"),
  prompt: z.string().describe("Text prompt for image generation"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  save_directory: z.string().optional().describe("Directory to save generated images (will be created if doesn't exist)"),
});

export const ImageEditingSchema = z.object({
  model: z.string().optional().default("google/gemini-2.5-flash-image-preview:free").describe("OpenRouter image model ID (google/gemini-2.5-flash-image-preview:free or google/gemini-2.5-flash-image-preview)"),
  instruction: z.string().describe("Text instruction for image editing (e.g., 'change this image', 'make it brighter', 'add a sunset')"),
  images: z.array(z.string()).describe("Array of image URLs or data URIs (data:image/jpeg;base64,...) to edit"),
  max_tokens: z.number().optional().default(1000).describe("Maximum tokens in response"),
  temperature: z.number().optional().default(0.7).describe("Temperature for response randomness"),
  save_directory: z.string().optional().describe("Directory to save edited images (will be created if doesn't exist)"),
});

export const CompareModelsSchema = z.object({
  models: z.array(z.string()).describe("Array of model IDs to compare"),
  message: MessageContentSchema.describe("Message content (text or multimodal array)"),
  max_tokens: z.number().optional().default(500).describe("Maximum tokens per response"),
});

export const GeminiDirectEditSchema = z.object({
  text_prompt: z.string().describe("Text prompt for image editing (e.g., 'a cute cat')"),
  image_path: z.string().describe("Path to the input image file"),
  output_path: z.string().optional().default("gemini-edited-image.png").describe("Output path for the edited image"),
  api_key: z.string().optional().describe("Gemini API key (if not provided, will use GEMINI_API_KEY environment variable)"),
  proxy_url: z.string().optional().describe("HTTP proxy URL (e.g., 'http://127.0.0.1:7890')"),
});

export const GeminiNativeGenerateSchema = z.object({
  text_prompt: z.string().describe("Text prompt for image generation (e.g., 'Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme')"),
  output_path: z.string().optional().default("gemini-native-image.png").describe("Output path for the generated image"),
  api_key: z.string().optional().describe("Gemini API key (if not provided, will use GEMINI_API_KEY environment variable)"),
  proxy_url: z.string().optional().describe("HTTP proxy URL (e.g., 'http://127.0.0.1:7890')"),
});

// Type exports for convenience
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ImageGenerationRequest = z.infer<typeof ImageGenerationSchema>;
export type ImageEditingRequest = z.infer<typeof ImageEditingSchema>;
export type CompareModelsRequest = z.infer<typeof CompareModelsSchema>;
export type GeminiDirectEditRequest = z.infer<typeof GeminiDirectEditSchema>;
export type GeminiNativeGenerateRequest = z.infer<typeof GeminiNativeGenerateSchema>;