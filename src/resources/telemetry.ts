import {
  CallOptions,
  TelemetryIngestRequest,
  TelemetryIngestResponse,
  UsageResponse,
  UsageSummaryResponse,
} from '../types';

type RequestClient = {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};

export class TelemetryResource {
  constructor(private client: RequestClient) {}

  async ingest(data: TelemetryIngestRequest, options?: CallOptions): Promise<TelemetryIngestResponse> {
    if (!data?.event?.trim()) {
      throw new Error('event is required');
    }
    return this.client.request<TelemetryIngestResponse>('POST', '/api/telemetry/ingest', data, options);
  }

  async submit(data: TelemetryIngestRequest, options?: CallOptions): Promise<TelemetryIngestResponse> {
    return this.ingest(data, options);
  }

  async getUsage(period: 'current' | '3months' | '6months' | 'year' = 'current', options?: CallOptions): Promise<UsageResponse> {
    return this.client.request<UsageResponse>('GET', '/api/usage', undefined, {
      ...options,
      params: {
        ...(options?.params || {}),
        period,
      },
    });
  }

  async getUsageSummary(options?: CallOptions): Promise<UsageSummaryResponse> {
    return this.client.request<UsageSummaryResponse>('GET', '/api/usage/summary', undefined, options);
  }
}
