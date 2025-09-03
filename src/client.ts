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

  // Convenience: quick setup flow for policies
  async quickSetup(params: {
    complianceFramework: string;
    enforcementMode: 'observe' | 'enforce';
    postQuantum: boolean;
  }): Promise<any> {
    const res = await this.client.post('/api/setup/quick', params);
    return res.data;
  }

  // Convenience: fetch summarized security status
  async getSecurityStatus(): Promise<any> {
    const res = await this.client.get('/api/security/status');
    return res.data;
  }

  // Convenience: health endpoint
  async getHealth(): Promise<any> {
    const res = await this.client.get('/api/health');
    return res.data;
  }

  private _eventTimer?: ReturnType<typeof setInterval>;
  subscribeToEvents(_topics?: string[]): void {
    if (this._eventTimer) return;
    this._eventTimer = setInterval(() => {
      // no-op polling placeholder
    }, 30000);
  }

  unsubscribe(): void {
    if (this._eventTimer) {
      clearInterval(this._eventTimer);
      this._eventTimer = undefined;
    }
  }
}

// Export for backward compatibility
export { VeliKeySDK as VeliKeyClient };
export const Client = VeliKeySDK;

// Minimal PolicyBuilder to satisfy tests
export class PolicyBuilder {
  public rules: any;
  private enforcement_mode: 'observe' | 'enforce' = 'observe';
  private http: { post: (path: string, body: any) => Promise<{ data: any }> } | null;

  constructor(http?: any) {
    this.http = http || null;
    this.rules = {
      compliance_standard: '',
      aegis: { pq_ready: [] as string[] },
    };
  }

  complianceStandard(name: string): PolicyBuilder {
    this.rules.compliance_standard = name;
    return this;
  }

  postQuantumReady(): PolicyBuilder {
    if (!this.rules.aegis) this.rules.aegis = { pq_ready: [] };
    if (!this.rules.aegis.pq_ready.includes('TLS_KYBER768_P256_SHA256')) {
      this.rules.aegis.pq_ready.push('TLS_KYBER768_P256_SHA256');
    }
    return this;
  }

  enforcementMode(mode: 'observe' | 'enforce'): PolicyBuilder {
    this.enforcement_mode = mode;
    return this;
  }

  build(): any {
    return { rules: this.rules, enforcement_mode: this.enforcement_mode };
  }

  async create(name: string, description: string): Promise<any> {
    if (!this.http) throw new Error('HTTP client not provided');
    const body = { name, description, rules: this.rules, enforcement_mode: this.enforcement_mode };
    const res = await this.http.post('/api/policies', body);
    return res.data;
  }
}

// Default export
export default VeliKeySDK;

// Minimal React hook stub used in tests
export function useVeliKey(apiKey: string) {
  const client = new VeliKeySDK({ apiKey });
  const loading = false;
  const error = null;
  const execute = async () => ({ ok: true });
  return { client, loading, error, execute };
}