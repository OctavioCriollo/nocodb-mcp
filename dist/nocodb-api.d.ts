import { NocoDBConfig, NocoDBBase, NocoDBTable, NocoDBColumn, NocoDBRecord, NocoDBView, QueryOptions, AggregateOptions, BulkInsertOptions } from "./types.js";
export declare class NocoDBError extends Error {
    statusCode?: number | undefined;
    details?: any | undefined;
    constructor(message: string, statusCode?: number | undefined, details?: any | undefined);
}
export declare class NocoDBClient {
    private client;
    private config;
    constructor(config: NocoDBConfig);
    listBases(): Promise<NocoDBBase[]>;
    getBase(baseId: string): Promise<NocoDBBase>;
    listTables(baseId: string): Promise<NocoDBTable[]>;
    getTable(tableId: string): Promise<NocoDBTable>;
    createTable(baseId: string, tableName: string, columns: any[]): Promise<NocoDBTable>;
    deleteTable(tableId: string): Promise<void>;
    listColumns(tableId: string): Promise<NocoDBColumn[]>;
    addColumn(tableId: string, columnDefinition: any): Promise<NocoDBColumn>;
    deleteColumn(columnId: string): Promise<void>;
    createRecord(baseId: string, tableName: string, data: NocoDBRecord): Promise<NocoDBRecord>;
    bulkInsert(baseId: string, tableName: string, options: BulkInsertOptions): Promise<NocoDBRecord[]>;
    getRecord(baseId: string, tableName: string, recordId: string): Promise<NocoDBRecord>;
    listRecords(baseId: string, tableName: string, options?: QueryOptions): Promise<{
        list: NocoDBRecord[];
        pageInfo: any;
    }>;
    updateRecord(baseId: string, tableName: string, recordId: string, data: NocoDBRecord): Promise<NocoDBRecord>;
    deleteRecord(baseId: string, tableName: string, recordId: string): Promise<void>;
    listViews(tableId: string): Promise<NocoDBView[]>;
    createView(tableId: string, title: string, type?: number): Promise<NocoDBView>;
    searchRecords(baseId: string, tableName: string, query: string, options?: QueryOptions): Promise<{
        list: NocoDBRecord[];
        pageInfo: any;
    }>;
    aggregate(baseId: string, tableName: string, options: AggregateOptions): Promise<number>;
    groupBy(baseId: string, tableName: string, columnName: string, options?: QueryOptions): Promise<any[]>;
    uploadFile(filePath: string, storagePath?: string): Promise<any>;
    uploadByUrl(urls: string[], storagePath?: string): Promise<any>;
}
//# sourceMappingURL=nocodb-api.d.ts.map