import { Alert, AlertsStatsResponse, CallOptions } from '../types';
type RequestClient = {
    request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};
export declare class MonitoringResource {
    private client;
    constructor(client: RequestClient);
    getActiveAlerts(options?: {
        severity?: string;
        category?: string;
        limit?: number;
    } & CallOptions): Promise<Alert[]>;
    getAlertStats(options?: CallOptions): Promise<AlertsStatsResponse>;
    getDashboardStats(): Promise<never>;
    getMetrics(): Promise<never>;
    getAgentHealth(): Promise<never>;
}
export {};
//# sourceMappingURL=monitoring.d.ts.map