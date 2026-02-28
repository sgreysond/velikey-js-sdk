import { Agent, CallOptions } from '../types';
import { NotFoundError } from '../errors';

type RequestClient = {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, data?: unknown, options?: CallOptions): Promise<T>;
};

export class AgentsResource {
  constructor(private client: RequestClient) {}

  async list(options?: { agentId?: string } & CallOptions): Promise<Agent[]> {
    const response = await this.client.request<{ agents?: Agent[] }>('GET', '/api/agents', undefined, {
      ...options,
      params: {
        ...(options?.params || {}),
        ...(options?.agentId ? { agentId: options.agentId } : {}),
      },
    });
    return Array.isArray(response?.agents) ? response.agents : [];
  }

  async get(agentId: string, options?: CallOptions): Promise<Agent> {
    const trimmed = agentId.trim();
    if (!trimmed) {
      throw new Error('agentId is required');
    }

    const agents = await this.list({ ...options, agentId: trimmed });
    const matched = agents.find((agent) => agent.agentId === trimmed || agent.id === trimmed);
    if (!matched) {
      throw new NotFoundError('agent', trimmed);
    }
    return matched;
  }
}
