# Collibra MCP starter (REST + GraphQL)

## Setup
1. Copy `.env.example` to `.env` and fill in credentials.
2. Install dependencies:
   ```bash
   npm i
   ```
3. Run:
   ```bash
   npm run dev
   ```

## Tools
### REST
- `collibra_asset_types_list`: `GET /rest/2.0/assetTypes` (auto-pagination; max 1000/page)
- `collibra_communities_list`: `GET /rest/2.0/communities` (auto-pagination; max 1000/page)

### GraphQL
- `collibra_graphql_assets_by_type`: Fetch assets of a given type name (e.g., `Data Set`, `Business Term`) using limit/offset paging (`limit<=100`).
