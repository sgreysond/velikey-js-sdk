/**
 * Gateway resource (Phase 3.4 JS SDK).
 *
 * Programmatic access to /api/gateway/install-plans and
 * /api/gateways[/:id]. Pairs with the dashboard wizard + the
 * `aegis-cli gateway ...` subcommand.
 *
 * @example
 *   const aegis = new AegisClient({ apiKey, baseUrl });
 *   const plan = await aegis.gateways.installPlan({
 *     name: 'edge-prod',
 *     mode: 'INGRESS',
 *     template: 'SOC2',
 *     backendUrl: 'https://api.svc.cluster.local:8443',
 *   });
 *   console.log(plan.installScript);
 */

import type { CallOptions } from '../types';

export type GatewayMode = 'INGRESS' | 'EGRESS' | 'BOTH';
export type GatewayStatus =
  | 'PROVISIONING'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'EXPIRED'
  | 'DECOMMISSIONED';
export type GatewayTemplate = 'SOC2' | 'PCI' | 'HIPAA' | 'GDPR' | 'CUSTOM';
export type RotationTarget = 'cert' | 'key' | 'plugin-trust-anchor' | 'all';

export interface Gateway {
  id: string;
  tenantId: string;
  name: string;
  mode: GatewayMode;
  template: GatewayTemplate | null;
  status: GatewayStatus;
  agentId: string | null;
  agentVersion: string | null;
  chartVersion: string | null;
  certExpiresAt: string | null;
  backendUrl: string | null;
  lastRolloutId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayList {
  gateways: Gateway[];
  nextCursor: string | null;
}

export interface InstallPlanInput {
  name: string;
  mode: GatewayMode;
  template?: GatewayTemplate;
  backendUrl?: string;
  hostHint?: string;
}

export interface InstallPlan {
  planId: string;
  expiresAt: string;
  bootstrapToken: string;
  installScript: string;
  gatewayId: string;
  tenantId: string;
}

export interface RotateInput {
  target: RotationTarget;
  /** Required confirmation token, must equal "ROTATE". */
  confirm: 'ROTATE';
  idempotencyKey?: string;
}

export interface RotationResult {
  rotationId: string;
  gatewayId: string;
  target: RotationTarget;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  idempotencyKey: string;
  replayed: boolean;
  message: string;
}

export interface ListOptions {
  limit?: number;
  cursor?: string;
  status?: GatewayStatus;
}

type RequestClient = {
  request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: unknown,
    options?: CallOptions
  ): Promise<T>;
};

export class GatewaysResource {
  constructor(private client: RequestClient) {}

  /** Mint a single-use install plan for a new gateway. The
   *  bootstrap token expires in 15 minutes. */
  async installPlan(
    input: InstallPlanInput,
    options?: CallOptions
  ): Promise<InstallPlan> {
    if (!input?.name?.trim()) throw new Error('name is required');
    if (!input?.mode) throw new Error('mode is required');
    return this.client.request<InstallPlan>(
      'POST',
      '/api/gateway/install-plans',
      input,
      options
    );
  }

  /** Paginated list of gateways for the caller's tenant. */
  async list(opts?: ListOptions, options?: CallOptions): Promise<GatewayList> {
    const search = new URLSearchParams();
    if (opts?.limit) search.set('limit', String(opts.limit));
    if (opts?.cursor) search.set('cursor', opts.cursor);
    if (opts?.status) search.set('status', opts.status);
    const path = `/api/gateways${search.size ? `?${search}` : ''}`;
    return this.client.request<GatewayList>('GET', path, undefined, options);
  }

  async get(id: string, options?: CallOptions): Promise<Gateway> {
    if (!id?.trim()) throw new Error('gateway id is required');
    return this.client.request<Gateway>(
      'GET',
      `/api/gateways/${encodeURIComponent(id)}`,
      undefined,
      options
    );
  }

  /** Rotate certs / keys / plugin trust anchors. Returns 202 Accepted
   *  with a rotation id; reconcile happens on the next agent
   *  heartbeat (Phase 2 controller orchestrates the actual reload). */
  async rotate(
    id: string,
    input: RotateInput,
    options?: CallOptions
  ): Promise<RotationResult> {
    if (!id?.trim()) throw new Error('gateway id is required');
    if (input?.confirm !== 'ROTATE')
      throw new Error('confirm must equal "ROTATE"');
    return this.client.request<RotationResult>(
      'POST',
      `/api/gateways/${encodeURIComponent(id)}/rotate`,
      input,
      options
    );
  }

  async decommission(id: string, options?: CallOptions): Promise<Gateway> {
    if (!id?.trim()) throw new Error('gateway id is required');
    return this.client.request<Gateway>(
      'DELETE',
      `/api/gateways/${encodeURIComponent(id)}?confirm=DECOMMISSION`,
      undefined,
      options
    );
  }
}
