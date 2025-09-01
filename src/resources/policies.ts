import { Policy, CreatePolicyRequest, CallOptions } from '../types';

export class PoliciesResource {
  constructor(private client: any) {}

  async list(options?: { tenant?: string; region?: string; status?: string } & CallOptions): Promise<Policy[]> {
    const params = new URLSearchParams();
    if (options?.tenant) params.set('tenant', options.tenant);
    if (options?.region) params.set('region', options.region);
    if (options?.status) params.set('status', options.status);

    const response = await this.client.request('GET', `/policies?${params}`, undefined, options);
    return response.data?.policies || [];
  }

  async get(policyId: string, options?: CallOptions): Promise<Policy> {
    const response = await this.client.request('GET', `/policies/${policyId}`, undefined, options);
    return response.data;
  }

  async create(policy: CreatePolicyRequest, options?: CallOptions): Promise<Policy> {
    const response = await this.client.request('POST', '/ai/policies', policy, options);
    return response.data;
  }

  async update(
    policyId: string, 
    updates: Partial<CreatePolicyRequest>, 
    options?: CallOptions
  ): Promise<Policy> {
    const response = await this.client.request('PUT', `/policies/${policyId}`, updates, options);
    return response.data;
  }

  async delete(policyId: string, options?: CallOptions): Promise<{ status: string }> {
    const response = await this.client.request('DELETE', `/policies/${policyId}`, undefined, options);
    return response.data;
  }

  async getPrecedence(options?: CallOptions): Promise<{ rules: any[] }> {
    const response = await this.client.request('GET', '/policies/precedence', undefined, { 
      ...options, 
      explain: true 
    });
    return response.data;
  }
}
