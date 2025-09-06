# Gemini Native Tools

本文档介绍如何使用直接调用 Google Gemini API 的工具，这些工具绕过 OpenRouter，直接与 Gemini API 通信。

## 🚀 新增工具

### 1. `gemini_native_generate` - 原生图像生成

直接使用 Google Gemini API 生成图像，无需输入图像。

**参数：**
- `text_prompt` (必需): 图像生成的文本提示
- `output_path` (可选): 输出图像路径，默认为 `gemini-native-image.png`
- `api_key` (可选): Gemini API 密钥，如未提供则使用环境变量 `GEMINI_API_KEY`
- `proxy_url` (可选): HTTP 代理 URL，如 `http://127.0.0.1:7890`

**示例：**
```json
{
  "text_prompt": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme",
  "output_path": "my-generated-image.png",
  "proxy_url": "http://127.0.0.1:7890"
}
```

### 2. `gemini_direct_edit` - 直接图像编辑

使用 Google Gemini API 编辑现有图像。

**参数：**
- `text_prompt` (必需): 图像编辑的文本提示
- `image_path` (必需): 输入图像文件路径
- `output_path` (可选): 输出图像路径，默认为 `gemini-edited-image.png`
- `api_key` (可选): Gemini API 密钥，如未提供则使用环境变量 `GEMINI_API_KEY`
- `proxy_url` (可选): HTTP 代理 URL

**示例：**
```json
{
  "text_prompt": "a cute cat",
  "image_path": "/path/to/input/image.jpg",
  "output_path": "edited-cat-image.png",
  "proxy_url": "http://127.0.0.1:7890"
}
```

## 🔧 配置

### 环境变量

在 `claude-config.json` 中设置以下环境变量：

```json
{
  "mcpServers": {
    "openrouter": {
      "command": "node",
      "args": ["/path/to/openrouter-mcp/dist/server.js"],
      "env": {
        "OPENROUTER_API_KEY": "your_openrouter_api_key_here",
        "GEMINI_API_KEY": "your_gemini_api_key_here",
        "HTTP_PROXY": "http://127.0.0.1:7890",
        "HTTPS_PROXY": "http://127.0.0.1:7890"
      }
    }
  }
}
```

### 代理支持

两个工具都支持多种代理配置方式：

1. **通过参数传入**（优先级最高）：
   ```json
   {
     "proxy_url": "http://127.0.0.1:7890"
   }
   ```

2. **通过环境变量**：
   - `HTTP_PROXY`
   - `HTTPS_PROXY`

## 🆚 与现有工具的区别

| 功能 | `generate_image` | `gemini_native_generate` |
|------|------------------|--------------------------|
| API | OpenRouter | 直接 Gemini API |
| 模型选择 | 支持多种模型 | 固定 Gemini 2.5 Flash |
| 代理支持 | ❌ | ✅ |
| 响应速度 | 中等 | 更快（直连） |

| 功能 | `edit_image` | `gemini_direct_edit` |
|------|--------------|----------------------|
| API | OpenRouter | 直接 Gemini API |
| 模型选择 | 支持多种模型 | 固定 Gemini 2.5 Flash |
| 代理支持 | ❌ | ✅ |
| 文件处理 | URL/Base64 | 本地文件路径 |

## 🛠️ 技术实现

### 核心特性

1. **直接 API 调用**：绕过 OpenRouter，直接调用 Gemini API
2. **代理支持**：使用 `https-proxy-agent` 支持 HTTP/HTTPS 代理
3. **自动 Base64 编码**：自动处理图像文件的 Base64 编码
4. **跨平台兼容**：自动检测 FreeBSD vs 其他系统的 base64 命令参数
5. **错误处理**：完善的错误处理和状态反馈

### API 端点

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent
```

### 请求格式

**图像生成：**
```json
{
  "contents": [{
    "parts": [
      {"text": "Create a picture of..."}
    ]
  }]
}
```

**图像编辑：**
```json
{
  "contents": [{
    "parts": [
      {"text": "a cute cat"},
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_image_data"
        }
      }
    ]
  }]
}
```

## 📝 使用建议

1. **选择合适的工具**：
   - 需要多模型支持 → 使用 OpenRouter 工具
   - 需要代理支持 → 使用 Gemini 原生工具
   - 需要最快响应 → 使用 Gemini 原生工具

2. **代理配置**：
   - 在中国大陆建议配置代理
   - 推荐使用环境变量配置代理，避免在参数中暴露代理信息

3. **API 密钥管理**：
   - 建议使用环境变量存储 API 密钥
   - 不要在代码中硬编码 API 密钥