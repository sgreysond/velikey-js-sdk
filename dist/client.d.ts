/// <reference types="node" />
import { EventEmitter } from 'node:events';
import { CallOptions, HttpMethod, UsageResponse, UsageSummaryResponse, VeliKeyConfig } from './types';
import { AgentsResource } from './resources/agents';
import { PoliciesResource } from './resources/policies';
import { MonitoringResource } from './resources/monitoring';
import { ComplianceResource } from './resources/compliance';
import { DiagnosticsResource } from './resources/diagnostics';
import { RolloutsResource } from './resources/rollouts';
import { TelemetryResource } from './resources/telemetry';
export declare class VeliKeySDK extends EventEmitter {
    private client;
    private readonly authToken?;
    private readonly sessionCookie?;
    private readonly sessionToken?;
    private readonly useSecureSessionCookie;
    private readonly maxRetries;
    private readonly retryMinDelayMs;
    private readonly retryMaxDelayMs;
    readonly agents: AgentsResource;
    readonly policies: PoliciesResource;
    readonly monitoring: MonitoringResource;
    readonly compliance: ComplianceResource;
    readonly diagnostics: DiagnosticsResource;
    readonly rollouts: RolloutsResource;
    readonly telemetry: TelemetryResource;
    constructor(config: VeliKeyConfig);
    request<T = unknown>(method: HttpMethod, path: string, data?: unknown, options?: CallOptions): Promise<T>;
    testConnection(): Promise<{
        connected: boolean;
        latencyMs: number;
        status: string;
        version: string;
    }>;
    getHealth(): Promise<Record<string, unknown>>;
    getUsage(period?: 'current' | '3months' | '6months' | 'year'): Promise<UsageResponse>;
    getUsageSummary(): Promise<UsageSummaryResponse>;
    getSecurityStatus(): Promise<{
        agentsOnline: string;
        policiesActive: number;
        criticalAlerts: number;
        healthScore: number;
        generatedAt: string;
    }>;
    destroy(): void;
    private applyAuth;
    private resolveCookieHeader;
    private executeWithRetry;
    private computeRetryDelayMs;
    private parseRetryAfterMs;
}
export { VeliKeySDK as VeliKeyClient };
export declare const Client: typeof VeliKeySDK;
export default VeliKeySDK;
//# sourceMappingURL=client.d.ts.map