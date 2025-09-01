import { Agent, AgentConfig, CallOptions } from '../types';

export class AgentsResource {
  constructor(private client: any) {}

  async list(options?: { tenant?: string; region?: string; status?: string } & CallOptions): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (options?.tenant) params.set('tenant', options.tenant);
    if (options?.region) params.set('region', options.region);
    if (options?.status) params.set('status', options.status);

    const response = await this.client.request('GET', `/agents?${params}`, undefined, options);
    return response.data?.agents || [];
  }

  async get(agentId: string, options?: CallOptions): Promise<Agent> {
    const response = await this.client.request('GET', `/agents/${agentId}`, undefined, options);
    return response.data;
  }

  async updateConfig(
    agentId: string, 
    config: Partial<AgentConfig>, 
    options?: CallOptions
  ): Promise<Agent> {
    const response = await this.client.request('PUT', `/agents/${agentId}/config`, config, options);
    return response.data;
  }

  async restart(agentId: string, options?: CallOptions): Promise<{ status: string }> {
    const response = await this.client.request('POST', `/agents/${agentId}/restart`, undefined, options);
    return response.data;
  }

  async getLogs(
    agentId: string, 
    options?: { lines?: number; since?: string } & CallOptions
  ): Promise<{ logs: string[] }> {
    const params = new URLSearchParams();
    if (options?.lines) params.set('lines', options.lines.toString());
    if (options?.since) params.set('since', options.since);

    const response = await this.client.request('GET', `/agents/${agentId}/logs?${params}`, undefined, options);
    return response.data;
  }
}
