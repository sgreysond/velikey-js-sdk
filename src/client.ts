/**
 * Main VeliKey SDK client
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'eventemitter3';
import {
  VeliKeyConfig,
  APIResponse,
  CallOptions,
} from './types';
import { createErrorFromResponse } from './errors';
import { AgentsResource } from './resources/agents';
import { PoliciesResource } from './resources/policies';
import { MonitoringResource } from './resources/monitoring';
import { ComplianceResource } from './resources/compliance';
import { DiagnosticsResource } from './resources/diagnostics';
import { RolloutsResource } from './resources/rollouts';
import { TelemetryResource } from './resources/telemetry';
import { generateUUID } from './utils';

export class VeliKeySDK extends EventEmitter {
  private client: AxiosInstance;
  
  // Resource managers
  public readonly agents: AgentsResource;
  public readonly policies: PoliciesResource;
  public readonly monitoring: MonitoringResource;
  public readonly compliance: ComplianceResource;
  public readonly diagnostics: DiagnosticsResource;
  public readonly rollouts: RolloutsResource;
  public readonly telemetry: TelemetryResource;

  constructor(config: VeliKeyConfig) {
    super();
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.velikey.com',
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': `velikey-js-sdk/0.1.0`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const veliKeyError = createErrorFromResponse(
          error.response?.data || error.message,
          error.response?.status
        );
        throw veliKeyError;
      }
    );

    // Initialize resource managers
    this.agents = new AgentsResource(this);
    this.policies = new PoliciesResource(this);
    this.monitoring = new MonitoringResource(this);
    this.compliance = new ComplianceResource(this);
    this.diagnostics = new DiagnosticsResource(this);
    this.rollouts = new RolloutsResource(this);
    this.telemetry = new TelemetryResource(this);
  }

  /**
   * Internal request method used by resource managers
   */
  async request(
    method: string,
    path: string,
    data?: any,
    options?: CallOptions
  ): Promise<APIResponse> {
    const config: AxiosRequestConfig = {
      method: method as any,
      url: path,
      data,
      params: {},
      headers: {},
    };

    // Add query parameters for AI-friendly operations
    if (options?.dryRun) config.params.dry_run = 'true';
    if (options?.explain) config.params.explain = 'true';

    // Add idempotency key for mutating operations
    if (options?.idempotencyKey && method !== 'GET') {
      config.headers!['Idempotency-Key'] = options.idempotencyKey;
    } else if (method !== 'GET' && method !== 'DELETE') {
      config.headers!['Idempotency-Key'] = generateUUID();
    }

    // Add timeout if specified
    if (options?.timeout) {
      config.timeout = options.timeout;
    }

    const response = await this.client.request(config);
    return response.data;
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<{
    connected: boolean;
    latency: number;
    version: string;
  }> {
    const start = Date.now();
    try {
      const response = await this.request('GET', '/healthz');
      const latency = Date.now() - start;
      
      return {
        connected: true,
        latency,
        version: response.data?.version || 'unknown'
      };
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - start,
        version: 'unknown'
      };
    }
  }

  /**
   * Get API information
   */
  async getInfo(): Promise<{
    name: string;
    version: string;
    capabilities: string[];
  }> {
    const response = await this.request('GET', '/info');
    return response.data;
  }

  /**
   * Close any open connections
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

// Export for backward compatibility
export { VeliKeySDK as VeliKeyClient };

// Default export
export default VeliKeySDK;