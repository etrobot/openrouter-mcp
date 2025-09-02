#!/usr/bin/env node

import { OpenRouterMCPServer } from "./server-class.js";

// Start the server
const server = new OpenRouterMCPServer();
server.run().catch(console.error);