import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchAllPages, type CollibraRestConfig } from "../lib/collibraRest.js";

type AssetType = {
  id: string;
  name: string;
  publicId?: string;
  description?: string;
  system?: boolean;
  resourceType?: string;
  parent?: { id: string; name?: string; resourceType?: string };
  product?: string;
};

const InputSchema = z.object({
  baseUrl: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),

  name: z.string().optional(),
  nameMatchMode: z.enum(["ANYWHERE", "START", "END", "EXACT"]).optional(),
  topLevel: z.boolean().optional(),

  excludeMeta: z.boolean().optional(),
  excludeFinal: z.boolean().optional(),
  excludeUnlicensedProducts: z.boolean().optional(),

  pageSize: z.number().int().min(1).max(1000).optional(),
  maxResults: z.number().int().min(1).optional()
});

export function registerAssetTypesTool(server: McpServer, defaults: CollibraRestConfig) {
  server.tool(
    "collibra_asset_types_list",
    "List Collibra asset types via REST (/rest/2.0/assetTypes) with automatic pagination.",
    InputSchema,
    async (input) => {
      const cfg: CollibraRestConfig = {
        baseUrl: input.baseUrl ?? defaults.baseUrl,
        username: input.username ?? defaults.username,
        password: input.password ?? defaults.password
      };

      const nameMatchMode = input.nameMatchMode ?? "ANYWHERE";
      const topLevel = input.topLevel ?? false;

      const excludeMeta = input.excludeMeta ?? true;
      const excludeFinal = input.excludeFinal ?? false;
      const excludeUnlicensedProducts = input.excludeUnlicensedProducts ?? false;

      const makePath = (offset: number, limit: number) => {
        const qs = new URLSearchParams();
        qs.set("offset", String(offset));
        qs.set("limit", String(limit));
        qs.set("countLimit", "-1");
        qs.set("nameMatchMode", nameMatchMode);
        qs.set("excludeMeta", String(excludeMeta));
        qs.set("excludeFinal", String(excludeFinal));
        qs.set("excludeUnlicensedProducts", String(excludeUnlicensedProducts));
        qs.set("topLevel", String(topLevel));
        if (input.name) qs.set("name", input.name);

        return `/rest/2.0/assetTypes?${qs.toString()}`;
      };

      const { total, results } = await fetchAllPages<AssetType>(cfg, makePath, {
        pageSize: input.pageSize,
        maxResults: input.maxResults
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total,
                returned: results.length,
                results
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
