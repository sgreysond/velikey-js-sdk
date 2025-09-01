import { TelemetryData, CallOptions } from '../types';

export class MonitoringResource {
  constructor(private client: any) {}

  async getDashboardStats(options?: CallOptions): Promise<{
    totalAgents: number;
    activePolicies: number;
    totalConnections: number;
    postQuantumConnections: number;
  }> {
    const response = await this.client.request('GET', '/monitoring/dashboard', undefined, options);
    return response.data;
  }

  async getMetrics(options?: { 
    timeRange?: string; 
    agentId?: string; 
    tenant?: string 
  } & CallOptions): Promise<TelemetryData[]> {
    const params = new URLSearchParams();
    if (options?.timeRange) params.set('time_range', options.timeRange);
    if (options?.agentId) params.set('agent_id', options.agentId);
    if (options?.tenant) params.set('tenant', options.tenant);

    const response = await this.client.request('GET', `/telemetry/metrics?${params}`, undefined, options);
    return response.data?.metrics || [];
  }

  async getAgentHealth(agentId?: string, options?: CallOptions): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Record<string, boolean>;
  }> {
    const path = agentId ? `/monitoring/health/${agentId}` : '/monitoring/health';
    const response = await this.client.request('GET', path, undefined, options);
    return response.data;
  }
}
