import { AgentPoliciesResponse, CallOptions, Policy } from '../types';
type RequestClient = {
    request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};
export declare class PoliciesResource {
    private client;
    constructor(client: RequestClient);
    list(options?: {
        scope?: string;
        isActive?: boolean;
    } & CallOptions): Promise<Policy[]>;
    listForAgent(agentId: string, options?: CallOptions): Promise<AgentPoliciesResponse>;
    create(): Promise<never>;
    update(): Promise<never>;
    delete(): Promise<never>;
}
export {};
//# sourceMappingURL=policies.d.ts.map