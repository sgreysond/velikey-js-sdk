import { VeliKeySDK } from './client';
import { VeliKeyConfig } from './types';

export interface AgentConfigTemplate {
  controlPlaneUrl: string;
  authToken: string;
  enableTelemetry: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  plugins: Array<{ name: string; config?: Record<string, unknown> }>;
}

export interface PolicyDraft {
  name: string;
  description?: string;
  scope: Record<string, string>;
  rules: Record<string, unknown>;
}

export function createClient(config: VeliKeyConfig): VeliKeySDK {
  return new VeliKeySDK(config);
}

export function createPolicyBuilder(name: string): PolicyBuilder {
  return new PolicyBuilder(name);
}

export function createAgentConfig(controlPlaneUrl: string, authToken: string): AgentConfigTemplate {
  return {
    controlPlaneUrl,
    authToken,
    enableTelemetry: true,
    logLevel: 'info',
    plugins: [],
  };
}

export class PolicyBuilder {
  private policy: PolicyDraft;

  constructor(name: string) {
    this.policy = {
      name,
      scope: {},
      rules: {},
    };
  }

  scope(scope: Record<string, string>): PolicyBuilder {
    this.policy.scope = { ...this.policy.scope, ...scope };
    return this;
  }

  rules(rules: Record<string, unknown>): PolicyBuilder {
    this.policy.rules = { ...this.policy.rules, ...rules };
    return this;
  }

  description(description: string): PolicyBuilder {
    this.policy.description = description;
    return this;
  }

  build(): PolicyDraft {
    if (!this.policy.name.trim()) {
      throw new Error('policy name is required');
    }
    return { ...this.policy };
  }
}
