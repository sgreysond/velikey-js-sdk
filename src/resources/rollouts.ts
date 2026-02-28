import {
  ApplyRolloutRequest,
  CallOptions,
  PlanRolloutRequest,
  RolloutOperationResponse,
  TriggerRollbackRequest,
} from '../types';

type RequestClient = {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};

export class RolloutsResource {
  constructor(private client: RequestClient) {}

  async plan(request: PlanRolloutRequest, options?: CallOptions): Promise<RolloutOperationResponse> {
    if (!request?.policyId?.trim()) {
      throw new Error('policyId is required');
    }
    return this.client.request<RolloutOperationResponse>('POST', '/api/rollouts/plan', request, options);
  }

  async apply(request: ApplyRolloutRequest, options?: CallOptions): Promise<RolloutOperationResponse> {
    if (!request?.planId?.trim()) {
      throw new Error('planId is required');
    }

    const payload: ApplyRolloutRequest = {
      ...request,
      dryRun: request.dryRun !== false,
    };
    if (payload.dryRun === false) {
      payload.confirm = true;
      payload.confirmation = 'APPLY';
    }

    return this.client.request<RolloutOperationResponse>('POST', '/api/rollouts/apply', payload, {
      ...options,
      idempotencyKey: request.idempotencyKey || options?.idempotencyKey,
    });
  }

  async rollback(request: TriggerRollbackRequest, options?: CallOptions): Promise<RolloutOperationResponse> {
    if (!request?.rollbackToken?.trim()) {
      throw new Error('rollbackToken is required');
    }

    const payload: TriggerRollbackRequest = {
      ...request,
      confirm: true,
      confirmation: 'ROLLBACK',
    };
    return this.client.request<RolloutOperationResponse>('POST', '/api/rollouts/rollback', payload, options);
  }
}
