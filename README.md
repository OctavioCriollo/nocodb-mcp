# NocoDB MCP Server (v2 API Fix)

> **Fork of [andrewlwn77/nocodb-mcp](https://github.com/andrewlwn77/nocodb-mcp)**  
> Fixed for NocoDB 2026+ (v0.301.1+) which uses API v2 exclusively.

## What was fixed

The original package used NocoDB **API v1** for base/table metadata endpoints, which returns **403 Forbidden** with NocoDB v0.301.1+ when using Personal Access Tokens (PAT).

This fork migrates all 6 affected endpoints from v1 to v2:

| Original (v1) | Fixed (v2) |
|---|---|
| `GET /api/v1/db/meta/projects` | `GET /api/v2/meta/bases` |
| `GET /api/v1/db/meta/projects/{id}` | `GET /api/v2/meta/bases/{id}` |
| `GET /api/v1/db/meta/projects/{id}/tables` | `GET /api/v2/meta/bases/{id}/tables` |
| `POST /api/v1/db/meta/projects/{id}/tables` | `POST /api/v2/meta/bases/{id}/tables` |
| `GET /api/v1/db/meta/tables/{id}` | `GET /api/v2/meta/tables/{id}` |
| `DELETE /api/v1/db/meta/tables/{id}` | `DELETE /api/v2/meta/tables/{id}` |

## Features (25 tools)

All 25 tools from the original package are preserved:

**Database**: `list_bases`, `get_base_info`  
**Tables**: `list_tables`, `get_table_info`, `create_table`, `delete_table`, `add_column`, `delete_column`  
**Records**: `insert_record`, `bulk_insert`, `get_record`, `list_records`, `update_record`, `delete_record`, `search_records`  
**Views**: `list_views`, `create_view`, `get_view_data`  
**Queries**: `query`, `aggregate`, `group_by`  
**Attachments**: `upload_attachment`, `upload_attachment_by_url`, `attach_file_to_record`, `get_attachment_info`

## Usage with Claude Desktop / Claude Code

```json
{
  "nocodb": {
    "command": "npx",
    "args": ["-y", "github:OctavioCriollo/nocodb-mcp"],
    "env": {
      "NOCODB_URL": "https://your-nocodb-instance.com",
      "NOCODB_API_TOKEN": "nc_pat_your_token_here",
      "NOCODB_BASE_ID": "your_base_id_here"
    }
  }
}
```

### Environment Variables

| Variable | Alias | Description |
|---|---|---|
| `NOCODB_BASE_URL` | `NOCODB_URL` | NocoDB instance URL |
| `NOCODB_API_TOKEN` | — | Personal Access Token (`nc_pat_...`) |
| `NOCODB_DEFAULT_BASE` | `NOCODB_BASE_ID` | Default base/project ID |

## License

MIT — Original work by [andrewlwn77](https://github.com/andrewlwn77)
