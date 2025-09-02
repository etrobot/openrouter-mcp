import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupResourceHandlers } from "./handlers/resources.js";
import { setupToolHandlers } from "./handlers/tools.js";

export class OpenRouterMCPServer {
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
    this.setupHandlers();
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

  private setupHandlers(): void {
    setupResourceHandlers(this.server);
    setupToolHandlers(this.server);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenRouter MCP Server running on stdio");
  }
}