export { VeliKeySDK } from './client';
export * from './types';
export * from './resources';
export { NotifierClient } from './resources/notifier';
export * from './utils';
export * from './errors';

// Re-export commonly used types for convenience
export type {
  Agent,
  Alert,
  AgentPoliciesResponse,
  AlertsStatsResponse,
  Policy,
  UsageResponse,
  UsageSummaryResponse,
  PlanRolloutRequest,
  ApplyRolloutRequest,
  TriggerRollbackRequest,
  TelemetryIngestRequest,
  TelemetryIngestResponse,
  VeliKeyConfig,
} from './types';

// Convenience factory functions
export { createClient, createPolicyBuilder, createAgentConfig } from './factories';
