import { RolloutPlan, RolloutResult, PlanRolloutRequest, ApplyRolloutRequest, TriggerRollbackRequest, CallOptions } from '../types';

export class RolloutsResource {
  constructor(private client: any) {}

  async plan(request: PlanRolloutRequest, options?: CallOptions): Promise<RolloutPlan> {
    const response = await this.client.request('POST', '/ai/rollouts/plan', request, {
      ...options,
      dryRun: true // Always dry run for planning
    });
    return response.data;
  }

  async apply(request: ApplyRolloutRequest, options?: CallOptions): Promise<RolloutResult> {
    const response = await this.client.request('POST', '/ai/rollouts/apply', request, options);
    return response.data;
  }

  async rollback(request: TriggerRollbackRequest, options?: CallOptions): Promise<{ status: string }> {
    const response = await this.client.request('POST', '/ai/rollouts/rollback', request, options);
    return response.data;
  }

  async list(options?: { status?: string; policyId?: string } & CallOptions): Promise<RolloutResult[]> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.policyId) params.set('policy_id', options.policyId);

    const response = await this.client.request('GET', `/rollouts?${params}`, undefined, options);
    return response.data?.rollouts || [];
  }

  async get(rolloutId: string, options?: CallOptions): Promise<RolloutResult> {
    const response = await this.client.request('GET', `/rollouts/${rolloutId}`, undefined, options);
    return response.data;
  }
}
