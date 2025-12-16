import { Buffer } from "buffer";

export type CollibraGraphqlConfig = {
  endpoint: string; // e.g. https://fedworld.collibra.com/graphql/knowledgeGraph/v1
  username: string;
  password: string;
};

function toBasicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function collibraGraphql<TData>(
  cfg: CollibraGraphqlConfig,
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: toBasicAuthHeader(cfg.username, cfg.password)
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `Collibra GraphQL failed: ${res.status} ${res.statusText}. Body=${text}`
    );
  }

  const json = JSON.parse(text) as GraphqlResponse<TData>;
  if (json.errors?.length) {
    throw new Error(
      `Collibra GraphQL errors: ${json.errors.map((e) => e.message).join(" | ")}`
    );
  }
  if (!json.data) {
    throw new Error("Collibra GraphQL: response missing 'data'.");
  }
  return json.data;
}
