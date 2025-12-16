import { Buffer } from "buffer";

export type CollibraRestConfig = {
  baseUrl: string; // like https://fedworld.collibra.com
  username: string;
  password: string;
};

export type CollibraPagedResponse<T> = {
  total: number;
  offset: number;
  limit: number;
  results: T[];
};

function toBasicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

export async function collibraGet<T>(
  cfg: CollibraRestConfig,
  pathWithQuery: string
): Promise<T> {
  const url = new URL(pathWithQuery, cfg.baseUrl).toString();

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: toBasicAuthHeader(cfg.username, cfg.password)
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Collibra GET failed: ${res.status} ${res.statusText}. URL=${url}. Body=${body}`
    );
  }

  return (await res.json()) as T;
}

export async function fetchAllPages<T>(
  cfg: CollibraRestConfig,
  makePath: (offset: number, limit: number) => string,
  opts?: { pageSize?: number; maxResults?: number }
): Promise<{ total: number; results: T[] }> {
  const pageSize = Math.min(opts?.pageSize ?? 1000, 1000);
  const maxResults = opts?.maxResults ?? Number.POSITIVE_INFINITY;

  let offset = 0;
  let total = 0;
  const all: T[] = [];

  while (all.length < maxResults) {
    const page = await collibraGet<CollibraPagedResponse<T>>(
      cfg,
      makePath(offset, pageSize)
    );

    total = page.total ?? total;
    all.push(...page.results);

    if (page.results.length < pageSize) break;

    offset += pageSize;
  }

  return { total, results: all.slice(0, maxResults) };
}
