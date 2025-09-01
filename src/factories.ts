/**
 * Factory functions for VeliKey SDK
 */

import { VeliKeySDK } from './client';
import { VeliKeyConfig, CreatePolicyRequest, AgentConfig } from './types';

/**
 * Create a VeliKey client instance
 */
export function createClient(config: VeliKeyConfig): VeliKeySDK {
  return new VeliKeySDK(config);
}

/**
 * Create a policy builder for easier policy creation
 */
export function createPolicyBuilder(name: string): PolicyBuilder {
  return new PolicyBuilder(name);
}

/**
 * Create an agent configuration template
 */
export function createAgentConfig(controlPlaneUrl: string, authToken: string): AgentConfig {
  return {
    controlPlaneUrl,
    authToken,
    enableTelemetry: true,
    logLevel: 'info',
    plugins: []
  };
}

/**
 * Policy builder class for fluent policy creation
 */
export class PolicyBuilder {
  private policy: Partial<CreatePolicyRequest>;

  constructor(name: string) {
    this.policy = {
      name,
      preferences: [],
      fallback: { allowed: true },
      rollout: { canaryPercent: 10 },
      scope: {}
    };
  }

  scope(scope: { tenant?: string; region?: string; service?: string; partner?: string }): PolicyBuilder {
    this.policy.scope = { ...this.policy.scope, ...scope };
    return this;
  }

  preferences(prefs: string[]): PolicyBuilder {
    this.policy.preferences = prefs;
    return this;
  }

  fallback(config: { allowed: boolean; denyIfNoPQ?: boolean; maxSteps?: number }): PolicyBuilder {
    this.policy.fallback = config;
    return this;
  }

  rollout(config: { canaryPercent: number; stabilizationWindowS?: number }): PolicyBuilder {
    this.policy.rollout = config;
    return this;
  }

  description(desc: string): PolicyBuilder {
    this.policy.description = desc;
    return this;
  }

  quantumOnly(): PolicyBuilder {
    this.policy.preferences = ['pq_only'];
    return this;
  }

  hybrid(): PolicyBuilder {
    this.policy.preferences = ['hybrid', 'pq_only', 'classical'];
    return this;
  }

  classicalFallback(): PolicyBuilder {
    this.policy.preferences = ['classical'];
    this.policy.fallback = { allowed: true, maxSteps: 2 };
    return this;
  }

  build(): CreatePolicyRequest {
    if (!this.policy.name) {
      throw new Error('Policy name is required');
    }
    if (!this.policy.preferences || this.policy.preferences.length === 0) {
      throw new Error('At least one preference is required');
    }
    if (!this.policy.scope) {
      throw new Error('Policy scope is required');
    }

    return this.policy as CreatePolicyRequest;
  }
}
