/**
 * Main VeliKey SDK client
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'eventemitter3';
import {
  Agent,
  Policy,
  HealthScore,
  SecurityStatus,
  SetupOptions,
  SetupResult,
  VeliKeyConfig,
  SecurityAlert,
  UsageMetrics,
  DiagnosticSuite,
  CustomerInfo,
} from './types';
import { VeliKeyError, AuthenticationError, ValidationError, RateLimitError } from './errors';
import { AgentsResource } from './resources/agents';
import { PoliciesResource } from './resources/policies';
import { MonitoringResource } from './resources/monitoring';
import { ComplianceResource } from './resources/compliance';
import { DiagnosticsResource } from './resources/diagnostics';

export class VeliKeySDK extends EventEmitter {
  private client: AxiosInstance;
  
  // Resource managers
  public readonly agents: AgentsResource;
  public readonly policies: PoliciesResource;
  public readonly monitoring: MonitoringResource;
  public readonly compliance: ComplianceResource;
  public readonly diagnostics: DiagnosticsResource;

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
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;
          
          switch (status) {
            case 401:
              throw new AuthenticationError('Invalid API key or expired token');
            case 400:
              throw new ValidationError(message);
            case 429:
              throw new RateLimitError('Rate limit exceeded');
            default:
              throw new VeliKeyError(`HTTP ${status}: ${message}`);
          }
        }
        throw new VeliKeyError(`Request failed: ${error.message}`);
      }
    );

    // Initialize resource managers
    this.agents = new AgentsResource(this.client);
    this.policies = new PoliciesResource(this.client);
    this.monitoring = new MonitoringResource(this.client);
    this.compliance = new ComplianceResource(this.client);
    this.diagnostics = new DiagnosticsResource(this.client);
  }

  /**
   * Quick setup for new customers
   */
  async quickSetup(options: SetupOptions): Promise<SetupResult> {
    const response = await this.client.post('/api/setup/quick', options);
    return response.data;
  }

  /**
   * Get comprehensive security status
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    const response = await this.client.get('/api/security/status');
    return response.data;
  }

  /**
   * Get customer account information
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    const response = await this.client.get('/api/customers/profile');
    return response.data;
  }

  /**
   * Get API health status
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Subscribe to real-time events
   */
  subscribeToEvents(eventTypes: string[] = ['*']): void {
    // In production, this would establish WebSocket connection
    // For now, simulate with polling
    const pollInterval = setInterval(async () => {
      try {
        const alerts = await this.monitoring.getActiveAlerts();
        const newAlerts = alerts.filter(alert => 
          Date.now() - new Date(alert.createdAt).getTime() < 60000 // Last minute
        );
        
        newAlerts.forEach(alert => {
          this.emit('alert', alert);
          this.emit(`alert:${alert.severity}`, alert);
        });
      } catch (error) {
        this.emit('error', error);
      }
    }, 30000); // Poll every 30 seconds

    // Store interval for cleanup
    (this as any)._pollInterval = pollInterval;
  }

  /**
   * Unsubscribe from events and cleanup
   */
  unsubscribe(): void {
    if ((this as any)._pollInterval) {
      clearInterval((this as any)._pollInterval);
      delete (this as any)._pollInterval;
    }
    this.removeAllListeners();
  }

  /**
   * Bulk operations for efficiency
   */
  async bulkPolicyUpdate(updates: Array<{ policyId: string; changes: any }>): Promise<{
    successful: number;
    failed: number;
    results: Policy[];
  }> {
    const response = await this.client.post('/api/policies/bulk-update', { updates });
    return response.data;
  }

  /**
   * Advanced policy builder
   */
  createPolicyBuilder(): PolicyBuilder {
    return new PolicyBuilder(this.client);
  }

  /**
   * Compliance automation helpers
   */
  async validateCompliance(framework: string): Promise<{
    compliant: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const response = await this.client.post('/api/compliance/validate', { framework });
    return response.data;
  }

  /**
   * Performance optimization suggestions
   */
  async getOptimizationSuggestions(): Promise<{
    performance: string[];
    security: string[];
    cost: string[];
  }> {
    const response = await this.client.get('/api/optimization/suggestions');
    return response.data;
  }
}

/**
 * Fluent policy builder
 */
export class PolicyBuilder {
  private rules: any = {
    compliance_standard: 'Custom',
    aegis: {},
    somnus: {},
    logos: {},
  };
  private enforcementMode: string = 'observe';

  constructor(private client: AxiosInstance) {}

  complianceStandard(standard: string): PolicyBuilder {
    this.rules.compliance_standard = standard;
    return this;
  }

  aegisConfig(config: any): PolicyBuilder {
    this.rules.aegis = { ...this.rules.aegis, ...config };
    return this;
  }

  somnusConfig(config: any): PolicyBuilder {
    this.rules.somnus = { ...this.rules.somnus, ...config };
    return this;
  }

  logosConfig(config: any): PolicyBuilder {
    this.rules.logos = { ...this.rules.logos, ...config };
    return this;
  }

  enforcementMode(mode: 'observe' | 'enforce' | 'canary'): PolicyBuilder {
    this.enforcementMode = mode;
    return this;
  }

  postQuantumReady(): PolicyBuilder {
    this.rules.aegis.pq_ready = ['TLS_KYBER768_P256_SHA256'];
    this.rules.somnus.pq_ready = ['Kyber-768 + AES-KWP'];
    this.rules.logos.pq_ready = ['Kyber-768 + AES-KWP (DEK/Field Key Wrap)'];
    return this;
  }

  async create(name: string, description?: string): Promise<Policy> {
    const response = await this.client.post('/api/policies', {
      name,
      description,
      rules: this.rules,
      enforcement_mode: this.enforcementMode,
    });
    return response.data;
  }

  build(): { rules: any; enforcement_mode: string } {
    return {
      rules: this.rules,
      enforcement_mode: this.enforcementMode,
    };
  }
}

/**
 * React hooks for VeliKey integration
 */
export function useVeliKey(apiKey: string, options?: Partial<VeliKeyConfig>) {
  const [client] = React.useState(() => new VeliKeySDK({ apiKey, ...options }));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    return () => {
      client.unsubscribe();
    };
  }, [client]);

  const execute = React.useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { client, loading, error, execute };
}

/**
 * Vue.js composable for VeliKey integration
 */
export function useVeliKeyComposable(apiKey: string, options?: Partial<VeliKeyConfig>) {
  const client = new VeliKeySDK({ apiKey, ...options });
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await operation();
      return result;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      loading.value = false;
    }
  };

  onUnmounted(() => {
    client.unsubscribe();
  });

  return { client, loading: readonly(loading), error: readonly(error), execute };
}
