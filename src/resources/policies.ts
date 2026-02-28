import { AgentPoliciesResponse, CallOptions, Policy } from '../types';
import { UnsupportedOperationError } from '../errors';

type RequestClient = {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};

export class PoliciesResource {
  constructor(private client: RequestClient) {}

  async list(options?: { scope?: string; isActive?: boolean } & CallOptions): Promise<Policy[]> {
    const response = await this.client.request<{ policies?: Policy[] }>('GET', '/api/policies', undefined, {
      ...options,
      params: {
        ...(options?.params || {}),
        ...(options?.scope ? { scope: options.scope } : {}),
        ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
      },
    });
    return Array.isArray(response?.policies) ? response.policies : [];
  }

  async listForAgent(agentId: string, options?: CallOptions): Promise<AgentPoliciesResponse> {
    const trimmed = agentId.trim();
    if (!trimmed) {
      throw new Error('agentId is required');
    }
    return this.client.request<AgentPoliciesResponse>('GET', `/api/agents/${trimmed}/policies`, undefined, options);
  }

  async create(): Promise<never> {
    throw new UnsupportedOperationError('policies.create', 'GET /api/policies');
  }

  async update(): Promise<never> {
    throw new UnsupportedOperationError('policies.update', 'GET /api/policies');
  }

  async delete(): Promise<never> {
    throw new UnsupportedOperationError('policies.delete', 'GET /api/policies');
  }
}
