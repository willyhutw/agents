import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getFilterLogs } from "../funcs/firewall.js";
import * as T from "../types.js";

const server = new Server(
  {
    name: "mcp-demo-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const tools = [
  {
    name: "get_firewall_logs",
    description: "Return the firewall blocked logs in a specific time range.",
    inputSchema: T.getFilterLogsInSchema,
    handler: async (args: any) => {
      const input = T.getFilterLogsInSchema.parse(args);
      return await getFilterLogs(input);
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  if (!tool) throw new Error(`Tool not found: ${request.params.name}`);
  try {
    const result = await tool.handler(request.params.arguments);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    console.error(`Error processing ${tool.name}:`, error);
    throw new Error(`Error processing ${tool.name}: ${error}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);