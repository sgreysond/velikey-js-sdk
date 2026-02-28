import { Alert, AlertsStatsResponse, CallOptions } from '../types';
import { UnsupportedOperationError } from '../errors';

type RequestClient = {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};

export class MonitoringResource {
  constructor(private client: RequestClient) {}

  async getActiveAlerts(options?: { severity?: string; category?: string; limit?: number } & CallOptions): Promise<Alert[]> {
    const response = await this.client.request<{ alerts?: Alert[] }>('GET', '/api/alerts', undefined, {
      ...options,
      params: {
        ...(options?.params || {}),
        resolved: false,
        ...(options?.severity ? { severity: options.severity } : {}),
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.limit ? { limit: options.limit } : {}),
      },
    });
    return Array.isArray(response?.alerts) ? response.alerts : [];
  }

  async getAlertStats(options?: CallOptions): Promise<AlertsStatsResponse> {
    return this.client.request<AlertsStatsResponse>('GET', '/api/alerts/stats', undefined, options);
  }

  async getDashboardStats(): Promise<never> {
    throw new UnsupportedOperationError('monitoring.getDashboardStats', 'GET /api/alerts/stats');
  }

  async getMetrics(): Promise<never> {
    throw new UnsupportedOperationError('monitoring.getMetrics', 'GET /api/usage');
  }

  async getAgentHealth(): Promise<never> {
    throw new UnsupportedOperationError('monitoring.getAgentHealth', 'GET /api/health');
  }
}
