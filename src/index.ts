import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAssetTypesTool } from "./tools/assetTypes.js";
import { registerCommunitiesTool } from "./tools/communities.js";
import { registerGraphqlAssetsByTypeTool } from "./tools/graphqlAssetsByType.js";

const baseUrl = process.env.COLLIBRA_REST_BASE_URL ?? "https://fedworld.collibra.com";
const graphqlEndpoint =
  process.env.COLLIBRA_GRAPHQL_ENDPOINT ??
  "https://fedworld.collibra.com/graphql/knowledgeGraph/v1";

const username = process.env.COLLIBRA_USERNAME ?? "";
const password = process.env.COLLIBRA_PASSWORD ?? "";

if (!username || !password) {
  throw new Error("Missing COLLIBRA_USERNAME or COLLIBRA_PASSWORD in environment.");
}

const server = new McpServer({
  name: "collibra-rest-graphql-mcp",
  version: "0.2.0"
});

registerAssetTypesTool(server, { baseUrl, username, password });
registerCommunitiesTool(server, { baseUrl, username, password });
registerGraphqlAssetsByTypeTool(server, { endpoint: graphqlEndpoint, username, password });

const transport = new StdioServerTransport();
await server.connect(transport);
