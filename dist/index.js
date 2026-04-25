#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const nocodb_api_js_1 = require("./nocodb-api.js");
const database_js_1 = require("./tools/database.js");
const table_js_1 = require("./tools/table.js");
const record_js_1 = require("./tools/record.js");
const view_js_1 = require("./tools/view.js");
const query_js_1 = require("./tools/query.js");
const attachment_js_1 = require("./tools/attachment.js");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Initialize NocoDB client
// Accepts NOCODB_BASE_URL or NOCODB_URL (alias for compatibility)
// Accepts NOCODB_DEFAULT_BASE or NOCODB_BASE_ID (alias for compatibility)
const config = {
    baseUrl: process.env.NOCODB_BASE_URL || process.env.NOCODB_URL || "http://localhost:8080",
    apiToken: process.env.NOCODB_API_TOKEN,
    defaultBase: process.env.NOCODB_DEFAULT_BASE || process.env.NOCODB_BASE_ID,
};
if (!config.apiToken && !process.env.NOCODB_AUTH_TOKEN) {
    console.error("Error: NOCODB_API_TOKEN or NOCODB_AUTH_TOKEN must be set");
    process.exit(1);
}
if (process.env.NOCODB_AUTH_TOKEN) {
    config.authToken = process.env.NOCODB_AUTH_TOKEN;
}
const nocodb = new nocodb_api_js_1.NocoDBClient(config);
// Create MCP server
const server = new index_js_1.Server({
    name: "nocodb-mcp",
    version: "0.3.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Combine all tools
const allTools = [
    ...database_js_1.databaseTools,
    ...table_js_1.tableTools,
    ...record_js_1.recordTools,
    ...view_js_1.viewTools,
    ...query_js_1.queryTools,
    ...attachment_js_1.attachmentTools,
];
// Register handlers
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: allTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = allTools.find((t) => t.name === name);
    if (!tool) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }
    try {
        const result = await tool.handler(nocodb, args);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        if (error instanceof nocodb_api_js_1.NocoDBError) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `NocoDB error: ${error.message}`, error.details);
        }
        throw error;
    }
});
// Start server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("NocoDB MCP server started");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map