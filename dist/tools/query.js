"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryTools = void 0;
exports.queryTools = [
    {
        name: "query",
        description: "Execute an advanced query with filtering, sorting, and field selection",
        inputSchema: {
            type: "object",
            properties: {
                base_id: {
                    type: "string",
                    description: "The ID of the base/project",
                },
                table_name: {
                    type: "string",
                    description: "The name of the table",
                },
                where: {
                    type: "string",
                    description: 'Filter condition using NocoDB syntax (e.g., "(status,eq,active)~and(priority,gt,5)")',
                },
                sort: {
                    type: "array",
                    description: "Array of sort fields (prefix with - for descending)",
                    items: {
                        type: "string",
                    },
                },
                fields: {
                    type: "array",
                    description: "Array of fields to return",
                    items: {
                        type: "string",
                    },
                },
                limit: {
                    type: "number",
                    description: "Number of records to return",
                    default: 25,
                },
                offset: {
                    type: "number",
                    description: "Number of records to skip",
                    default: 0,
                },
            },
            required: ["base_id", "table_name"],
        },
        handler: async (client, args) => {
            const result = await client.listRecords(args.base_id, args.table_name, {
                where: args.where,
                sort: args.sort,
                fields: args.fields,
                limit: args.limit || 25,
                offset: args.offset || 0,
            });
            return {
                records: result.list,
                pageInfo: result.pageInfo,
                count: result.list.length,
                query: {
                    where: args.where,
                    sort: args.sort,
                    fields: args.fields,
                    limit: args.limit,
                    offset: args.offset,
                },
            };
        },
    },
    {
        name: "aggregate",
        description: "Perform aggregation operations on a column",
        inputSchema: {
            type: "object",
            properties: {
                base_id: {
                    type: "string",
                    description: "The ID of the base/project",
                },
                table_name: {
                    type: "string",
                    description: "The name of the table",
                },
                column_name: {
                    type: "string",
                    description: "The column to aggregate",
                },
                function: {
                    type: "string",
                    description: "Aggregation function",
                    enum: ["count", "sum", "avg", "min", "max"],
                },
                where: {
                    type: "string",
                    description: "Optional filter condition",
                },
            },
            required: ["base_id", "table_name", "column_name", "function"],
        },
        handler: async (client, args) => {
            const value = await client.aggregate(args.base_id, args.table_name, {
                column_name: args.column_name,
                func: args.function,
                where: args.where,
            });
            return {
                value,
                aggregation: {
                    column: args.column_name,
                    function: args.function,
                    where: args.where,
                },
            };
        },
    },
    {
        name: "group_by",
        description: "Group records by a column and get counts",
        inputSchema: {
            type: "object",
            properties: {
                base_id: {
                    type: "string",
                    description: "The ID of the base/project",
                },
                table_name: {
                    type: "string",
                    description: "The name of the table",
                },
                column_name: {
                    type: "string",
                    description: "The column to group by",
                },
                where: {
                    type: "string",
                    description: "Optional filter condition",
                },
                sort: {
                    type: "string",
                    description: "Sort order for groups",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of groups to return",
                },
                offset: {
                    type: "number",
                    description: "Number of groups to skip",
                },
            },
            required: ["base_id", "table_name", "column_name"],
        },
        handler: async (client, args) => {
            const groups = await client.groupBy(args.base_id, args.table_name, args.column_name, {
                where: args.where,
                sort: args.sort,
                limit: args.limit,
                offset: args.offset,
            });
            return {
                groups,
                count: groups.length,
                column: args.column_name,
            };
        },
    },
];
//# sourceMappingURL=query.js.map