import { Agent, CallOptions } from '../types';
type RequestClient = {
    request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};
export declare class AgentsResource {
    private client;
    constructor(client: RequestClient);
    list(options?: {
        agentId?: string;
    } & CallOptions): Promise<Agent[]>;
    get(agentId: string, options?: CallOptions): Promise<Agent>;
}
export {};
//# sourceMappingURL=agents.d.ts.map