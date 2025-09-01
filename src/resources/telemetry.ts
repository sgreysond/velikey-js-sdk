import { TelemetryData, CallOptions } from '../types';

export class TelemetryResource {
  constructor(private client: any) {}

  async submit(data: TelemetryData, options?: CallOptions): Promise<{ status: string }> {
    const response = await this.client.request('POST', '/telemetry', data, options);
    return response.data;
  }

  async stream(
    agentId?: string,
    callback?: (data: TelemetryData) => void
  ): Promise<() => void> {
    // In a real implementation, this would establish a WebSocket connection
    // For now, we'll simulate with polling
    
    const params = new URLSearchParams();
    if (agentId) params.set('agent_id', agentId);
    
    let isStreaming = true;
    
    const poll = async () => {
      while (isStreaming) {
        try {
          const response = await this.client.request('GET', `/telemetry/stream?${params}`);
          if (callback && response.data) {
            callback(response.data);
          }
        } catch (error) {
          console.warn('Telemetry stream error:', error);
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    };
    
    poll(); // Start polling
    
    // Return cleanup function
    return () => {
      isStreaming = false;
    };
  }

  async getMetrics(
    options?: { 
      timeRange?: string; 
      agentId?: string; 
      metrics?: string[] 
    } & CallOptions
  ): Promise<TelemetryData[]> {
    const params = new URLSearchParams();
    if (options?.timeRange) params.set('time_range', options.timeRange);
    if (options?.agentId) params.set('agent_id', options.agentId);
    if (options?.metrics) params.set('metrics', options.metrics.join(','));

    const response = await this.client.request('GET', `/telemetry/metrics?${params}`, undefined, options);
    return response.data?.metrics || [];
  }
}
