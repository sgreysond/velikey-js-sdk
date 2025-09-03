/**
 * VeliKey Aegis JavaScript/TypeScript SDK
 * 
 * Quantum-safe crypto policy management for modern applications
 * 
 * @example
 * ```typescript
 * import { VeliKeySDK } from '@velikey/sdk';
 * 
 * const client = new VeliKeySDK({
 *   apiKey: process.env.VELIKEY_API_KEY!,
 * });
 * 
 * // Quick setup
 * const setup = await client.quickSetup({
 *   complianceFramework: 'soc2',
 *   enforcementMode: 'observe',
 *   postQuantum: true,
 * });
 * 
 * // Monitor security status
 * const status = await client.getSecurityStatus();
 * console.log(`Health Score: ${status.healthScore}/100`);
 * ```
 */

export { VeliKeySDK } from './client';
export * from './types';
export * from './resources';
export { NotifierClient } from './resources/notifier';
export * from './utils';
export * from './errors';

// Re-export commonly used types for convenience
export type {
  Agent,
  Policy,
  AgentConfig,
  AgentMetrics,
  PolicyScope,
  FallbackConfig,
  RolloutConfig,
  TelemetryData,
  ComplianceReport,
  DiagnosticsResult,
  VeliKeyConfig,
} from './types';

// Convenience factory functions
export { createClient, createPolicyBuilder, createAgentConfig } from './factories';
