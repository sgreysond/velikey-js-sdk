export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface VeliKeyConfig {
    apiKey?: string;
    bearerToken?: string;
    sessionCookie?: string;
    sessionToken?: string;
    useSecureSessionCookie?: boolean;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    retryMinDelayMs?: number;
    retryMaxDelayMs?: number;
}
export interface CallOptions {
    params?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    timeout?: number;
    idempotencyKey?: string;
    retryable?: boolean;
}
export interface Agent {
    id: string;
    tenantId?: string;
    agentId?: string;
    name?: string;
    status?: string;
    version?: string;
    capabilities?: string[];
    lastHeartbeat?: string;
    enrolledAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Policy {
    id: string;
    name: string;
    description?: string;
    scope?: string;
    scopeValue?: string;
    policyType?: string;
    rules?: Record<string, unknown>;
    priority?: number;
    isActive?: boolean;
    analysis?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}
export interface AgentPoliciesResponse {
    agentId: string;
    policies: Policy[];
    fetchedAt?: string;
}
export interface Alert {
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    resolved: boolean;
    source?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    createdAt?: string;
    resolvedAt?: string | null;
}
export interface AlertsStatsResponse {
    generatedAt: string;
    totals: {
        last24h: number;
        last7d: number;
    };
    bySeverity: Array<{
        severity: string;
        count: number;
    }>;
    byCategory: Array<{
        category: string;
        count: number;
    }>;
}
export interface UsagePoint {
    period: string;
    dayOfPeriod: number;
    daysInPeriod: number;
    encryptionGB: number;
    telemetryGB: number;
    environments: number;
    agents: number;
    estimatedCost: number;
}
export interface UsageResponse {
    current: UsagePoint;
    usage: UsagePoint;
    historical: UsagePoint[];
}
export interface UsageSummaryResponse {
    period: {
        start: string;
        end: string;
        daysElapsed: number;
    };
    usage: {
        encryptionDataGB: number;
        telemetryDataGB: number;
        telemetryDays: number;
        environments: number;
        agents: number;
    };
    rates: {
        encryptionDailyGB: number;
        telemetryDailyGB: number;
    };
    pricing: {
        basePlatformFee: number;
        tier1PerGB: number;
        tier2PerGB: number;
        tier3PerGB: number;
        tier4PerGB: number;
        telemetryPerGB: number;
        environmentFee: number;
    };
    costs: {
        platformFeeUsd: number;
        encryptionUsd: number;
        telemetryUsd: number;
        environmentsUsd: number;
        totalUsd: number;
    };
    current?: UsagePoint;
    summary?: UsagePoint;
}
export interface RolloutMaintenanceWindow {
    start: string;
    end: string;
}
export interface PlanRolloutRequest {
    policyId: string;
    canaryPercent?: number;
    stabilizationWindowS?: number;
    maintenanceWindows?: RolloutMaintenanceWindow[];
    explain?: boolean;
}
export interface ApplyRolloutRequest {
    planId: string;
    dryRun?: boolean;
    idempotencyKey?: string;
    confirm?: boolean;
    confirmation?: string;
    maintenanceWindows?: RolloutMaintenanceWindow[];
}
export interface TriggerRollbackRequest {
    rollbackToken: string;
    confirm?: boolean;
    confirmation?: string;
}
export interface RolloutOperationData {
    plan_id?: string;
    rollout_id?: string;
    rollback_id?: string;
    rollback_token?: string;
}
export interface RolloutOperationResponse {
    success?: boolean;
    error?: string;
    message?: string;
    data?: RolloutOperationData;
    rolloutReceipt?: {
        id: string;
    };
}
export interface TelemetryIngestRequest {
    event: string;
    properties?: Record<string, string | number | boolean | null | Array<string | number | boolean | null>>;
    timestamp?: string;
}
export interface TelemetryIngestResponse {
    success: boolean;
    accepted: boolean;
    queued: boolean;
    timestamp: string;
}
export interface APIError {
    code?: string;
    error?: string;
    message?: string;
    human?: string;
    hint?: string;
    nextCall?: string;
    next_call?: string;
}
//# sourceMappingURL=types.d.ts.map