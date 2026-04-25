# NocoDB MCP Server — v2 API Fix

> **Fork of [andrewlwn77/nocodb-mcp](https://github.com/andrewlwn77/nocodb-mcp)**  
> Corregido para NocoDB 2026+ (v0.301.1+) que usa exclusivamente API v2.

## ¿Qué se corrigió?

El paquete original usaba **API v1** para los endpoints de metadata, que retornan **403 Forbidden** con NocoDB v0.301.1+ al usar Personal Access Tokens (PAT).

### Correcciones aplicadas

**1. Migración v1 → v2 en `src/nocodb-api.ts` (7 endpoints):**

| Original (v1) | Corregido (v2) |
|---|---|
| `GET /api/v1/db/meta/projects` | `GET /api/v2/meta/bases` |
| `GET /api/v1/db/meta/projects/{id}` | `GET /api/v2/meta/bases/{id}` |
| `GET /api/v1/db/meta/projects/{id}/tables` | `GET /api/v2/meta/bases/{id}/tables` |
| `POST /api/v1/db/meta/projects/{id}/tables` | `POST /api/v2/meta/bases/{id}/tables` |
| `GET /api/v1/db/meta/tables/{id}` | `GET /api/v2/meta/tables/{id}` |
| `DELETE /api/v1/db/meta/tables/{id}` | `DELETE /api/v2/meta/tables/{id}` |
| `GET /api/v1/db/meta/tables/{id}` (listColumns) | `GET /api/v2/meta/tables/{id}` |

**2. `listBases()` con auto-descubrimiento de workspace:**

NocoDB PAT tokens no pueden listar todas las bases con `GET /api/v2/meta/bases` (403). El fork implementa un fallback automático de 3 pasos sin necesidad de configurar `NOCODB_BASE_ID`:

```
1. GET /api/v2/meta/bases                              → intento directo
2. GET /api/v2/meta/nocodb/info                        → obtiene defaultWorkspaceId
   GET /api/v2/meta/workspaces/{workspaceId}/bases     → lista bases por workspace
3. GET /api/v2/meta/bases/{defaultBase}                → último recurso (si NOCODB_BASE_ID configurado)
```

**3. Aliases de variables de entorno para compatibilidad:**
- `NOCODB_URL` → alias de `NOCODB_BASE_URL`
- `NOCODB_BASE_ID` → alias de `NOCODB_DEFAULT_BASE`

**4. `dist/` compilado incluido** para compatibilidad con `npx github:`.

## Herramientas disponibles (25 total)

| Categoría | Herramientas |
|---|---|
| **Database** | `list_bases`, `get_base_info` |
| **Tables** | `list_tables`, `get_table_info`, `create_table`, `delete_table`, `add_column`, `delete_column` |
| **Records** | `insert_record`, `bulk_insert`, `get_record`, `list_records`, `update_record`, `delete_record`, `search_records` |
| **Views** | `list_views`, `create_view`, `get_view_data` |
| **Queries** | `query`, `aggregate`, `group_by` |
| **Attachments** | `upload_attachment`, `upload_attachment_by_url`, `attach_file_to_record`, `get_attachment_info` |

## Configuración en Claude Desktop / Claude Code

```json
{
  "nocodb": {
    "command": "npx",
    "args": ["-y", "github:OctavioCriollo/nocodb-mcp"],
    "env": {
      "NOCODB_URL": "https://tu-nocodb.dominio.com",
      "NOCODB_API_TOKEN": "nc_pat_tu_token_aqui"
    }
  }
}
```

### Variables de entorno

| Variable | Alias | Requerida | Descripción |
|---|---|---|---|
| `NOCODB_BASE_URL` | `NOCODB_URL` | ✅ Sí | URL del servidor NocoDB |
| `NOCODB_API_TOKEN` | — | ✅ Sí | Personal Access Token (`nc_pat_...`) |
| `NOCODB_DEFAULT_BASE` | `NOCODB_BASE_ID` | ❌ No | ID de base específica (fallback opcional) |

> **Nota:** Solo necesitas `NOCODB_URL` y `NOCODB_API_TOKEN`. El workspace y las bases se descubren automáticamente.

## Commits de corrección

| Commit | Descripción |
|---|---|
| `55cfcfb` | Migración de 7 endpoints v1 → v2 |
| `4a428d4` | Dist compilado para compatibilidad con npx |
| `dec7521` | Fallback a `defaultBase` cuando PAT no puede listar bases |
| `04dc03d` | Auto-descubrimiento de `workspaceId` sin `NOCODB_BASE_ID` |
| `aedc6f0` | Reemplazo de endpoints v1 residuales por v2 en fallback |

## Licencia

MIT — Trabajo original de [andrewlwn77](https://github.com/andrewlwn77)
