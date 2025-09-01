/**
 * TypeScript type definitions for VeliKey JavaScript SDK
 */

export interface VeliKeyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  version: string;
  lastHeartbeat: string;
  config: AgentConfig;
  metrics: AgentMetrics;
  tags: Record<string, string>;
}

export interface AgentConfig {
  controlPlaneUrl: string;
  authToken: string;
  enableTelemetry: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  plugins: PluginConfig[];
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface AgentMetrics {
  cpu: number;
  memory: number;
  connections: number;
  throughput: number;
  latency: number;
  errorRate: number;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  scope: PolicyScope;
  preferences: string[];
  fallback: FallbackConfig;
  rollout: RolloutConfig;
  modes?: ModesConfig;
  thresholds?: ThresholdsConfig;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface PolicyScope {
  tenant?: string;
  region?: string;
  service?: string;
  partner?: string;
}

export interface FallbackConfig {
  allowed: boolean;
  denyIfNoPQ?: boolean;
  maxSteps?: number;
}

export interface RolloutConfig {
  canaryPercent: number;
  stabilizationWindowS?: number;
}

export interface ModesConfig {
  aegis?: 'observe' | 'hybrid_preferred' | 'hybrid_required';
  somnus?: 'observe' | 'rewrap_only' | 'enforce_soft' | 'enforce_strict';
  alpe?: 'observe' | 'enforce_soft' | 'enforce_strict' | 'rewrap_only';
}

export interface ThresholdsConfig {
  errorRateMax?: number;
  latencyP95IncreaseMs?: number;
  compatibilityMin?: number;
}

export interface RolloutPlan {
  id: string;
  policyId: string;
  phases: RolloutPhase[];
  estimatedDurationS: number;
  riskAssessment: string;
  createdAt: string;
}

export interface RolloutPhase {
  phase: string;
  percentage: number;
  durationS: number;
  successCriteria: string[];
}

export interface RolloutResult {
  id: string;
  planId: string;
  rollbackToken: string;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  explain: string;
}

export interface TelemetryData {
  agentId: string;
  timestamp: string;
  metrics: {
    throughput: number;
    latency: number;
    errorRate: number;
    quantumConnections: number;
    classicalConnections: number;
  };
}

export interface ComplianceReport {
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
}

export interface ComplianceFinding {
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  evidence?: string;
}

export interface DiagnosticsResult {
  agentId: string;
  timestamp: string;
  checks: DiagnosticCheck[];
  overall: 'healthy' | 'warning' | 'critical';
}

export interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, any>;
}

export interface BillingUsage {
  tenant: string;
  period: string;
  usage: {
    connections: number;
    dataTransferred: number;
    policies: number;
    agents: number;
  };
  costs: {
    total: number;
    breakdown: Record<string, number>;
  };
}

// Request/Response types
export interface CreatePolicyRequest {
  name: string;
  description?: string;
  scope: PolicyScope;
  preferences: string[];
  fallback: FallbackConfig;
  rollout: RolloutConfig;
  modes?: ModesConfig;
  thresholds?: ThresholdsConfig;
}

export interface PlanRolloutRequest {
  policyId: string;
  canaryPercent?: number;
  stabilizationWindowS?: number;
}

export interface ApplyRolloutRequest {
  planId: string;
  idempotencyKey?: string;
}

export interface TriggerRollbackRequest {
  rollbackToken: string;
}

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  explain?: ExplainResult;
  rollbackToken?: string;
  idempotencyReplayed?: boolean;
}

export interface APIError {
  code: string;
  human: string;
  hint?: string;
  nextCall?: string;
  docsAnchor?: string;
}

export interface ExplainResult {
  decision: string;
  why: string[];
  nextActions: NextAction[];
  diff?: DiffResult;
}

export interface NextAction {
  tool: string;
  args: Record<string, any>;
  description: string;
}

export interface DiffResult {
  before?: any;
  after?: any;
  added: Record<string, any>;
  removed: Record<string, any>;
  modified: Record<string, any>;
}

// Options for API calls
export interface CallOptions {
  dryRun?: boolean;
  explain?: boolean;
  timeout?: number;
  idempotencyKey?: string;
}
