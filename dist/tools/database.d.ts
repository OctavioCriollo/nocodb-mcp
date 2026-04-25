import { NocoDBClient } from "../nocodb-api.js";
export interface Tool {
    name: string;
    description: string;
    inputSchema: any;
    handler: (client: NocoDBClient, args: any) => Promise<any>;
}
export declare const databaseTools: Tool[];
//# sourceMappingURL=database.d.ts.map