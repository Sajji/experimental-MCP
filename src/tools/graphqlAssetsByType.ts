import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { collibraGraphql, type CollibraGraphqlConfig } from "../lib/collibraGraphql.js";

type Asset = {
  displayName: string;
  stringAttributes: { type: { name: string }; stringValue?: string | null }[];
  booleanAttributes: { type: { name: string }; booleanValue?: boolean | null }[];
  numericAttributes: { type: { name: string }; numericValue?: number | null }[];
  dateAttributes: { type: { name: string }; dateValue?: string | null }[];
  multiValueAttributes: { type: { name: string }; stringValues?: string[] | null }[];
  responsibilities: { role: { name: string }; user?: { fullName?: string | null } | null }[];
  type?: { name?: string | null } | null;
  status?: { name?: string | null } | null;
  tags: { name: string }[];
};

const InputSchema = z.object({
  endpoint: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),

  // Replace hard-coded "Data Set" with a user-supplied type name
  assetTypeName: z.string().min(1),

  // Safety: keep limit <= 100
  limit: z.number().int().min(1).max(100).optional().default(100),
  maxResults: z.number().int().min(1).optional()
});

const QUERY = /* GraphQL */ `
query AssetsByType($limit: Int!, $offset: Int!, $typeName: String!) {
  assets(limit: $limit, offset: $offset, where: { type: { name: { eq: $typeName } } }) {
    displayName
    stringAttributes { type { name } stringValue }
    booleanAttributes { type { name } booleanValue }
    numericAttributes { type { name } numericValue }
    dateAttributes { type { name } dateValue }
    multiValueAttributes { type { name } stringValues }
    responsibilities { role { name } user { fullName } }
    type { name }
    status { name }
    tags { name }
  }
}
`;

export function registerGraphqlAssetsByTypeTool(
  server: McpServer,
  defaults: CollibraGraphqlConfig
) {
  server.tool(
    "collibra_graphql_assets_by_type",
    "Fetch Collibra assets by asset type name via GraphQL with limit/offset paging (limit<=100).",
    InputSchema,
    async (input) => {
      const cfg: CollibraGraphqlConfig = {
        endpoint: input.endpoint ?? defaults.endpoint,
        username: input.username ?? defaults.username,
        password: input.password ?? defaults.password
      };

      const limit = input.limit ?? 100;
      const maxResults = input.maxResults ?? Number.POSITIVE_INFINITY;

      const all: Asset[] = [];
      let offset = 0;

      while (all.length < maxResults) {
        const data = await collibraGraphql<{ assets: Asset[] }>(cfg, QUERY, {
          limit,
          offset,
          typeName: input.assetTypeName
        });

        const page = data.assets ?? [];
        all.push(...page);

        if (page.length < limit) break;

        offset += limit;
      }

      const trimmed = all.slice(0, maxResults);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                assetTypeName: input.assetTypeName,
                returned: trimmed.length,
                limit,
                results: trimmed
              },
              null,
              2
            )
          }
        ]
      };
    }
  );
}
