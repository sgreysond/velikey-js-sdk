import { VeliKeySDK } from './client';
import { VeliKeyConfig } from './types';
export interface AgentConfigTemplate {
    controlPlaneUrl: string;
    authToken: string;
    enableTelemetry: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    plugins: Array<{
        name: string;
        config?: Record<string, unknown>;
    }>;
}
export interface PolicyDraft {
    name: string;
    description?: string;
    scope: Record<string, string>;
    rules: Record<string, unknown>;
}
export declare function createClient(config: VeliKeyConfig): VeliKeySDK;
export declare function createPolicyBuilder(name: string): PolicyBuilder;
export declare function createAgentConfig(controlPlaneUrl: string, authToken: string): AgentConfigTemplate;
export declare class PolicyBuilder {
    private policy;
    constructor(name: string);
    scope(scope: Record<string, string>): PolicyBuilder;
    rules(rules: Record<string, unknown>): PolicyBuilder;
    description(description: string): PolicyBuilder;
    build(): PolicyDraft;
}
//# sourceMappingURL=factories.d.ts.map