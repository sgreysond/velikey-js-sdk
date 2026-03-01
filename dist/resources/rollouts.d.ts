import { ApplyRolloutRequest, CallOptions, PlanRolloutRequest, RolloutOperationResponse, TriggerRollbackRequest } from '../types';
type RequestClient = {
    request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};
export declare class RolloutsResource {
    private client;
    constructor(client: RequestClient);
    plan(request: PlanRolloutRequest, options?: CallOptions): Promise<RolloutOperationResponse>;
    apply(request: ApplyRolloutRequest, options?: CallOptions): Promise<RolloutOperationResponse>;
    rollback(request: TriggerRollbackRequest, options?: CallOptions): Promise<RolloutOperationResponse>;
}
export {};
//# sourceMappingURL=rollouts.d.ts.map