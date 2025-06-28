# OpenRouter MCP Server API Documentation

## Overview

This MCP server provides tools and resources for interacting with OpenRouter's unified AI model API, giving you access to 400+ AI models through a single interface.

## Resources

### Available Models (`openrouter://models`)
Returns a comprehensive list of all available models with their specifications.

**Response Format:**
```json
{
  "data": [
    {
      "id": "openai/gpt-4",
      "name": "GPT-4",
      "description": "OpenAI's most capable model",
      "context_length": 8192,
      "pricing": {
        "prompt": "0.00003",
        "completion": "0.00006"
      }
    }
  ]
}
```

### Model Pricing (`openrouter://pricing`)
Returns simplified pricing information for all models.

### Usage Statistics (`openrouter://usage`)
Returns your usage statistics (placeholder - OpenRouter doesn't provide direct usage API).

## Tools

### `list_models`
Get a formatted list of available OpenRouter models.

**Parameters:** None

**Returns:** Formatted text with model information including ID, name, description, context length, and pricing.

### `chat_with_model`
Send a message to a specific OpenRouter model.

**Parameters:**
- `model` (string, required): OpenRouter model ID (e.g., "openai/gpt-4")
- `message` (string, required): Message to send to the model
- `max_tokens` (number, optional): Maximum tokens in response (default: 1000)
- `temperature` (number, optional): Temperature for response randomness (default: 0.7)
- `system_prompt` (string, optional): System prompt for the conversation

**Returns:** Model response with usage statistics.

### `compare_models`
Compare responses from multiple models using the same prompt.

**Parameters:**
- `models` (array of strings, required): Array of model IDs to compare
- `message` (string, required): Message to send to all models
- `max_tokens` (number, optional): Maximum tokens per response (default: 500)

**Returns:** Formatted comparison showing each model's response.

### `get_model_info`
Get detailed information about a specific model.

**Parameters:**
- `model` (string, required): Model ID to get information about

**Returns:** Complete model specification including capabilities, pricing, and limits.

## Error Handling

All tools and resources include comprehensive error handling:
- API key validation
- Rate limit handling
- Model availability checks
- Network error recovery

## Usage Examples

### Chat with GPT-4
```json
{
  "name": "chat_with_model",
  "arguments": {
    "model": "openai/gpt-4",
    "message": "Explain quantum computing in simple terms",
    "max_tokens": 500
  }
}
```

### Compare Multiple Models
```json
{
  "name": "compare_models",
  "arguments": {
    "models": ["openai/gpt-4", "anthropic/claude-3-sonnet", "google/gemini-pro"],
    "message": "What is the meaning of life?",
    "max_tokens": 300
  }
}
```

## Configuration

Required environment variables:
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_BASE_URL`: OpenRouter API base URL (default: https://openrouter.ai/api/v1)
- `OPENROUTER_SITE_URL`: Your site URL for OpenRouter attribution
- `OPENROUTER_APP_NAME`: Your app name for OpenRouter attribution