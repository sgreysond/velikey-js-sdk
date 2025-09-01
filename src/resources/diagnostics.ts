import { DiagnosticsResult, CallOptions } from '../types';

export class DiagnosticsResource {
  constructor(private client: any) {}

  async runCheck(
    type: 'full' | 'connectivity' | 'performance' | 'security' = 'full',
    options?: CallOptions
  ): Promise<DiagnosticsResult> {
    const response = await this.client.request('GET', `/diagnostics/check?type=${type}`, undefined, options);
    return response.data;
  }

  async getSystemInfo(options?: CallOptions): Promise<{
    version: string;
    uptime: number;
    memory: any;
    config: any;
  }> {
    const response = await this.client.request('GET', '/diagnostics/system', undefined, options);
    return response.data;
  }

  async testConnectivity(
    target?: string,
    options?: CallOptions
  ): Promise<{
    reachable: boolean;
    latency: number;
    secure: boolean;
  }> {
    const body = target ? { target } : undefined;
    const response = await this.client.request('POST', '/diagnostics/connectivity', body, options);
    return response.data;
  }
}
