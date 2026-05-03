import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'node:events';
import {
  Agent,
  Alert,
  CallOptions,
  HttpMethod,
  Policy,
  UsageResponse,
  UsageSummaryResponse,
  VeliKeyConfig,
} from './types';
import { createErrorFromResponse } from './errors';
import { AgentsResource } from './resources/agents';
import { PoliciesResource } from './resources/policies';
import { MonitoringResource } from './resources/monitoring';
import { ComplianceResource } from './resources/compliance';
import { DiagnosticsResource } from './resources/diagnostics';
import { RolloutsResource } from './resources/rollouts';
import { TelemetryResource } from './resources/telemetry';
import { GatewaysResource } from './resources/gateways';
import { generateUUID, sleep } from './utils';

const DEFAULT_BASE_URL = 'https://axis.velikey.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_MIN_DELAY_MS = 250;
const DEFAULT_RETRY_MAX_DELAY_MS = 2_000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const SDK_USER_AGENT = 'velikey-js-sdk/0.2.0';

type HeaderRecord = Record<string, string>;

export class VeliKeySDK extends EventEmitter {
  private client: AxiosInstance;
  private readonly authToken?: string;
  private readonly sessionCookie?: string;
  private readonly sessionToken?: string;
  private readonly useSecureSessionCookie: boolean;
  private readonly maxRetries: number;
  private readonly retryMinDelayMs: number;
  private readonly retryMaxDelayMs: number;

  public readonly agents: AgentsResource;
  public readonly policies: PoliciesResource;
  public readonly monitoring: MonitoringResource;
  public readonly compliance: ComplianceResource;
  public readonly diagnostics: DiagnosticsResource;
  public readonly rollouts: RolloutsResource;
  public readonly telemetry: TelemetryResource;
  public readonly gateways: GatewaysResource;

  constructor(config: VeliKeyConfig) {
    super();

    const authToken = config.bearerToken || config.apiKey;
    const hasAuth = Boolean(authToken || config.sessionCookie || config.sessionToken);
    if (!hasAuth) {
      throw new Error(
        'Provide at least one credential: apiKey, bearerToken, sessionCookie, or sessionToken.'
      );
    }

    this.authToken = authToken;
    this.sessionCookie = config.sessionCookie?.trim() || undefined;
    this.sessionToken = config.sessionToken?.trim() || undefined;
    this.useSecureSessionCookie = Boolean(config.useSecureSessionCookie);
    this.maxRetries = Math.max(0, config.maxRetries ?? DEFAULT_MAX_RETRIES);
    this.retryMinDelayMs = Math.max(1, config.retryMinDelayMs ?? DEFAULT_RETRY_MIN_DELAY_MS);
    this.retryMaxDelayMs = Math.max(this.retryMinDelayMs, config.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS);

    this.client = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': SDK_USER_AGENT,
      },
    });

    this.agents = new AgentsResource(this);
    this.policies = new PoliciesResource(this);
    this.monitoring = new MonitoringResource(this);
    this.compliance = new ComplianceResource();
    this.diagnostics = new DiagnosticsResource();
    this.rollouts = new RolloutsResource(this);
    this.telemetry = new TelemetryResource(this);
    this.gateways = new GatewaysResource(this);
  }

  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    data?: unknown,
    options?: CallOptions
  ): Promise<T> {
    const methodUpper = method.toUpperCase() as HttpMethod;
    const headers: HeaderRecord = {
      ...(options?.headers || {}),
    };
    this.applyAuth(headers);

    if (methodUpper !== 'GET' && methodUpper !== 'DELETE') {
      headers['Idempotency-Key'] = options?.idempotencyKey || generateUUID();
    }

    const requestConfig: AxiosRequestConfig = {
      method: methodUpper,
      url: path,
      data,
      params: options?.params,
      headers,
      timeout: options?.timeout,
    };

    return this.executeWithRetry<T>(requestConfig, options?.retryable !== false);
  }

  async testConnection(): Promise<{
    connected: boolean;
    latencyMs: number;
    status: string;
    version: string;
  }> {
    const start = Date.now();
    try {
      const payload = await this.request<Record<string, unknown>>('GET', '/api/healthz', undefined, {
        retryable: false,
      });
      return {
        connected: true,
        latencyMs: Date.now() - start,
        status: String(payload.status || 'ok'),
        version: String(payload.version || 'unknown'),
      };
    } catch {
      return {
        connected: false,
        latencyMs: Date.now() - start,
        status: 'unreachable',
        version: 'unknown',
      };
    }
  }

  async getHealth(): Promise<Record<string, unknown>> {
    try {
      return await this.request<Record<string, unknown>>('GET', '/api/health', undefined, {
        retryable: false,
      });
    } catch {
      return this.request<Record<string, unknown>>('GET', '/api/healthz', undefined, {
        retryable: false,
      });
    }
  }

  async getUsage(period: 'current' | '3months' | '6months' | 'year' = 'current'): Promise<UsageResponse> {
    return this.request<UsageResponse>('GET', '/api/usage', undefined, {
      params: { period },
    });
  }

  async getUsageSummary(): Promise<UsageSummaryResponse> {
    return this.request<UsageSummaryResponse>('GET', '/api/usage/summary');
  }

  async getSecurityStatus(): Promise<{
    agentsOnline: string;
    policiesActive: number;
    criticalAlerts: number;
    healthScore: number;
    generatedAt: string;
  }> {
    const [agents, policies, alerts] = await Promise.all([
      this.agents.list(),
      this.policies.list({ isActive: true }),
      this.monitoring.getActiveAlerts(),
    ]);
    const totalAgents = agents.length;
    const onlineAgents = agents.filter((agent: Agent) => {
      const status = String(agent.status || '').toLowerCase();
      return status === 'active' || status === 'online';
    }).length;
    const activePolicies = policies.filter((policy: Policy) => policy.isActive !== false).length;
    const criticalAlerts = alerts.filter((alert: Alert) => String(alert.severity).toLowerCase() === 'critical').length;

    return {
      agentsOnline: `${onlineAgents}/${totalAgents}`,
      policiesActive: activePolicies,
      criticalAlerts,
      healthScore: totalAgents === 0 ? 0 : Math.max(0, Math.min(100, Math.round((onlineAgents / totalAgents) * 100))),
      generatedAt: new Date().toISOString(),
    };
  }

  destroy(): void {
    this.removeAllListeners();
  }

  private applyAuth(headers: HeaderRecord): void {
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const cookieHeader = this.resolveCookieHeader();
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }
  }

  private resolveCookieHeader(): string | undefined {
    if (this.sessionCookie) {
      return this.sessionCookie;
    }
    if (!this.sessionToken) {
      return undefined;
    }
    const cookieName = this.useSecureSessionCookie
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    return `${cookieName}=${this.sessionToken}`;
  }

  private async executeWithRetry<T>(
    requestConfig: AxiosRequestConfig,
    retryable: boolean
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await this.client.request<T>(requestConfig);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const shouldRetry =
          retryable &&
          attempt < this.maxRetries &&
          (status === undefined || RETRYABLE_STATUS_CODES.has(status));

        if (!shouldRetry) {
          throw createErrorFromResponse(axiosError.response?.data || axiosError.message, status);
        }

        const delayMs = this.computeRetryDelayMs(attempt, axiosError);
        await sleep(delayMs);
        attempt += 1;
      }
    }

    throw createErrorFromResponse('Request failed after retry budget exhausted');
  }

  private computeRetryDelayMs(attempt: number, error: AxiosError): number {
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const retryAfterMs = this.parseRetryAfterMs(Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader);
    if (retryAfterMs !== undefined) {
      return retryAfterMs;
    }
    const exponential = this.retryMinDelayMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 100);
    return Math.min(this.retryMaxDelayMs, exponential + jitter);
  }

  private parseRetryAfterMs(retryAfter: string | number | null | undefined): number | undefined {
    if (retryAfter === undefined || retryAfter === null) {
      return undefined;
    }
    if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
      return Math.max(0, Math.round(retryAfter * 1000));
    }
    const raw = String(retryAfter).trim();
    if (!raw) {
      return undefined;
    }
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) {
      return Math.max(0, Math.round(seconds * 1000));
    }
    const date = Date.parse(raw);
    if (Number.isNaN(date)) {
      return undefined;
    }
    return Math.max(0, date - Date.now());
  }
}

export { VeliKeySDK as VeliKeyClient };
export const Client = VeliKeySDK;
export default VeliKeySDK;
