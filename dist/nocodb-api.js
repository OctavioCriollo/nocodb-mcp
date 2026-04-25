"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NocoDBClient = exports.NocoDBError = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class NocoDBError extends Error {
    statusCode;
    details;
    constructor(message, statusCode, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = "NocoDBError";
    }
}
exports.NocoDBError = NocoDBError;
class NocoDBClient {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            headers: {
                "Content-Type": "application/json",
                ...(config.apiToken && { "xc-token": config.apiToken }),
                ...(config.authToken && { "xc-auth": config.authToken }),
            },
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            const data = error.response?.data;
            const message = data?.msg || data?.message || error.message;
            throw new NocoDBError(message, error.response?.status, error.response?.data);
        });
    }
    // Base/Project operations
    async listBases() {
        // Strategy:
        // 1. Try /api/v2/meta/bases (works if token has org-level permissions)
        // 2. Fall back to /api/v1/workspaces/{workspaceId}/bases using the default
        //    workspaceId from /api/v1/meta/nocodb/info (no auth required, generic)
        // 3. Last resort: if defaultBase configured, return that single base
        try {
            const response = await this.client.get("/api/v2/meta/bases");
            return response.data.list;
        }
        catch (e) {
            if (e.statusCode !== 403)
                throw e;
        }
        try {
            const info = await this.client.get("/api/v1/meta/nocodb/info");
            const workspaceId = info.data?.defaultWorkspaceId;
            if (workspaceId) {
                const response = await this.client.get(`/api/v1/workspaces/${workspaceId}/bases`);
                return response.data.list;
            }
        }
        catch (e) {
            if (e.statusCode !== 403)
                throw e;
        }
        if (this.config.defaultBase) {
            const base = await this.getBase(this.config.defaultBase);
            return [base];
        }
        throw new NocoDBError('Cannot list bases: insufficient permissions and no defaultBase configured');
    }
    async getBase(baseId) {
        const response = await this.client.get(`/api/v2/meta/bases/${baseId}`);
        return response.data;
    }
    // Table operations
    async listTables(baseId) {
        const response = await this.client.get(`/api/v2/meta/bases/${baseId}/tables`);
        return response.data.list;
    }
    async getTable(tableId) {
        const response = await this.client.get(`/api/v2/meta/tables/${tableId}`);
        return response.data;
    }
    async createTable(baseId, tableName, columns) {
        const response = await this.client.post(`/api/v2/meta/bases/${baseId}/tables`, {
            table_name: tableName,
            title: tableName,
            columns: columns,
        });
        return response.data;
    }
    async deleteTable(tableId) {
        await this.client.delete(`/api/v2/meta/tables/${tableId}`);
    }
    // Column operations
    async listColumns(tableId) {
        // Get columns from table info since dedicated columns endpoint doesn't exist
        const response = await this.client.get(`/api/v2/meta/tables/${tableId}`);
        return response.data.columns || [];
    }
    async addColumn(tableId, columnDefinition) {
        const response = await this.client.post(`/api/v2/meta/tables/${tableId}/columns`, columnDefinition);
        // The API returns the whole table object with columns,
        // so we need to find the newly added column
        const tableData = response.data;
        if (tableData.columns) {
            // Find the column that matches our title or column_name
            const newColumn = tableData.columns.find((col) => col.title === columnDefinition.title ||
                col.column_name === columnDefinition.column_name);
            if (newColumn) {
                return newColumn;
            }
        }
        // Fallback to returning the whole response if we can't find the column
        return response.data;
    }
    async deleteColumn(columnId) {
        await this.client.delete(`/api/v2/meta/columns/${columnId}`);
    }
    // Record operations
    async createRecord(baseId, tableName, data) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        const response = await this.client.post(`/api/v2/tables/${table.id}/records`, data);
        return response.data;
    }
    async bulkInsert(baseId, tableName, options) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        const response = await this.client.post(`/api/v2/tables/${table.id}/records`, options.records);
        return response.data;
    }
    async getRecord(baseId, tableName, recordId) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        const response = await this.client.get(`/api/v2/tables/${table.id}/records/${recordId}`);
        return response.data;
    }
    async listRecords(baseId, tableName, options) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        const params = new URLSearchParams();
        if (options?.where)
            params.append("where", options.where);
        if (options?.sort) {
            const sortStr = Array.isArray(options.sort)
                ? options.sort.join(",")
                : options.sort;
            params.append("sort", sortStr);
        }
        if (options?.fields) {
            const fieldsStr = Array.isArray(options.fields)
                ? options.fields.join(",")
                : options.fields;
            params.append("fields", fieldsStr);
        }
        if (options?.limit)
            params.append("limit", options.limit.toString());
        if (options?.offset)
            params.append("offset", options.offset.toString());
        if (options?.viewId)
            params.append("viewId", options.viewId);
        const response = await this.client.get(`/api/v2/tables/${table.id}/records?${params.toString()}`);
        return response.data;
    }
    async updateRecord(baseId, tableName, recordId, data) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        // Get the primary key field name (usually ID but can vary)
        const columns = await this.listColumns(table.id);
        const pkColumn = columns.find((col) => col.pk) ||
            columns.find((col) => col.title === "ID");
        const pkField = pkColumn?.title || "ID";
        const response = await this.client.patch(`/api/v2/tables/${table.id}/records`, {
            [pkField]: recordId,
            ...data,
        });
        return response.data;
    }
    async deleteRecord(baseId, tableName, recordId) {
        // First get table ID from table name
        const tables = await this.listTables(baseId);
        const table = tables.find((t) => t.table_name === tableName || t.title === tableName);
        if (!table) {
            throw new NocoDBError(`Table ${tableName} not found`);
        }
        // Get the primary key field name (usually ID but can vary)
        const columns = await this.listColumns(table.id);
        const pkColumn = columns.find((col) => col.pk) ||
            columns.find((col) => col.title === "ID");
        const pkField = pkColumn?.title || "ID";
        await this.client.delete(`/api/v2/tables/${table.id}/records`, {
            data: { [pkField]: recordId },
        });
    }
    // View operations
    async listViews(tableId) {
        const response = await this.client.get(`/api/v2/meta/tables/${tableId}/views`);
        return response.data.list || [];
    }
    async createView(tableId, title, type = 1) {
        const response = await this.client.post(`/api/v2/meta/tables/${tableId}/views`, {
            title,
            type,
        });
        return response.data;
    }
    // Search operation
    async searchRecords(baseId, tableName, query, options) {
        // For now, use regular list with client-side filtering
        // since NocoDB search syntax is complex
        const records = await this.listRecords(baseId, tableName, options);
        const filtered = records.list.filter((record) => {
            return Object.values(record).some((value) => String(value).toLowerCase().includes(query.toLowerCase()));
        });
        return { list: filtered, pageInfo: records.pageInfo };
    }
    // Aggregate operations
    async aggregate(baseId, tableName, options) {
        // For now, implement client-side aggregation
        // as the aggregate endpoint might not be available in all versions
        const records = await this.listRecords(baseId, tableName, {
            where: options.where,
        });
        const values = records.list.map((r) => Number(r[options.column_name]) || 0);
        switch (options.func) {
            case "count":
                return records.list.length;
            case "sum":
                return values.reduce((a, b) => a + b, 0);
            case "avg":
                return values.length > 0
                    ? values.reduce((a, b) => a + b, 0) / values.length
                    : 0;
            case "min":
                return Math.min(...values);
            case "max":
                return Math.max(...values);
            default:
                throw new NocoDBError(`Unknown aggregate function: ${options.func}`);
        }
    }
    // Group by operation
    async groupBy(baseId, tableName, columnName, options) {
        // Implement client-side grouping
        const records = await this.listRecords(baseId, tableName, options);
        const groups = new Map();
        records.list.forEach((record) => {
            const value = record[columnName];
            groups.set(value, (groups.get(value) || 0) + 1);
        });
        const result = Array.from(groups.entries()).map(([value, count]) => ({
            [columnName]: value,
            count,
        }));
        // Apply sorting if specified
        if (options?.sort) {
            const sortField = Array.isArray(options.sort)
                ? options.sort[0]
                : options.sort;
            const desc = sortField.startsWith("-");
            result.sort((a, b) => {
                const aVal = a[columnName];
                const bVal = b[columnName];
                return desc ? (bVal > aVal ? 1 : -1) : aVal > bVal ? 1 : -1;
            });
        }
        // Apply limit and offset
        const start = options?.offset || 0;
        const end = options?.limit ? start + options.limit : undefined;
        return result.slice(start, end);
    }
    // File upload operations
    async uploadFile(filePath, storagePath) {
        const formData = new form_data_1.default();
        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);
        formData.append("file", fileStream, fileName);
        if (storagePath) {
            formData.append("path", storagePath);
        }
        const response = await this.client.post("/api/v2/storage/upload", formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        return response.data;
    }
    async uploadByUrl(urls, storagePath) {
        const urlData = urls.map((url) => ({ url }));
        const data = storagePath ? { urls: urlData, path: storagePath } : urlData;
        const response = await this.client.post("/api/v2/storage/upload-by-url", data);
        return response.data;
    }
}
exports.NocoDBClient = NocoDBClient;
//# sourceMappingURL=nocodb-api.js.map