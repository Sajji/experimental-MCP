import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchAllPages, type CollibraRestConfig } from "../lib/collibraRest.js";

type Community = {
  id: string;
  name: string;
  description?: string;
  createdOn?: number;
  lastModifiedOn?: number;
};

const InputSchema = z.object({
  baseUrl: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),

  name: z.string().optional(),
  nameMatchMode: z.enum(["ANYWHERE", "START", "END", "EXACT"]).optional(),
  excludeMeta: z.boolean().optional(),

  pageSize: z.number().int().min(1).max(1000).optional(),
  maxResults: z.number().int().min(1).optional()
});

export function registerCommunitiesTool(server: McpServer, defaults: CollibraRestConfig) {
  server.tool(
    "collibra_communities_list",
    "List Collibra communities via REST (/rest/2.0/communities) with automatic pagination.",
    InputSchema,
    async (input) => {
      const cfg: CollibraRestConfig = {
        baseUrl: input.baseUrl ?? defaults.baseUrl,
        username: input.username ?? defaults.username,
        password: input.password ?? defaults.password
      };

      const nameMatchMode = input.nameMatchMode ?? "ANYWHERE";
      const excludeMeta = input.excludeMeta ?? true;

      const makePath = (offset: number, limit: number) => {
        const qs = new URLSearchParams();
        qs.set("offset", String(offset));
        qs.set("limit", String(limit));
        qs.set("countLimit", "-1");
        qs.set("excludeMeta", String(excludeMeta));

        if (input.name) {
          qs.set("name", input.name);
          qs.set("nameMatchMode", nameMatchMode);
        }

        return `/rest/2.0/communities?${qs.toString()}`;
      };

      const { total, results } = await fetchAllPages<Community>(cfg, makePath, {
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
