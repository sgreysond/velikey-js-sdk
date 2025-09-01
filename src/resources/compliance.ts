import { ComplianceReport, CallOptions } from '../types';

export class ComplianceResource {
  constructor(private client: any) {}

  async getReport(framework: string, options?: CallOptions): Promise<ComplianceReport> {
    const response = await this.client.request('GET', `/compliance/reports/${framework}`, undefined, options);
    return response.data;
  }

  async listFrameworks(options?: CallOptions): Promise<string[]> {
    const response = await this.client.request('GET', '/compliance/frameworks', undefined, options);
    return response.data?.frameworks || [];
  }

  async runAssessment(
    framework: string, 
    scope?: { tenant?: string; region?: string }, 
    options?: CallOptions
  ): Promise<ComplianceReport> {
    const response = await this.client.request('POST', `/compliance/assess/${framework}`, scope, options);
    return response.data;
  }
}
