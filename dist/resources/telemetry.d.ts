import { CallOptions, TelemetryIngestRequest, TelemetryIngestResponse, UsageResponse, UsageSummaryResponse } from '../types';
type RequestClient = {
    request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};
export declare class TelemetryResource {
    private client;
    constructor(client: RequestClient);
    ingest(data: TelemetryIngestRequest, options?: CallOptions): Promise<TelemetryIngestResponse>;
    submit(data: TelemetryIngestRequest, options?: CallOptions): Promise<TelemetryIngestResponse>;
    getUsage(period?: 'current' | '3months' | '6months' | 'year', options?: CallOptions): Promise<UsageResponse>;
    getUsageSummary(options?: CallOptions): Promise<UsageSummaryResponse>;
}
export {};
//# sourceMappingURL=telemetry.d.ts.map