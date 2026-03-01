import axios from 'axios';
import { EventEmitter } from 'node:events';

/**
 * VeliKey SDK Error Classes
 */
class VeliKeyError extends Error {
    constructor(message, code, statusCode, hint, nextCall) {
        super(message);
        this.name = 'VeliKeyError';
        this.code = code;
        this.statusCode = statusCode;
        this.hint = hint;
        this.nextCall = nextCall;
        // Maintain proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VeliKeyError);
        }
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            hint: this.hint,
            nextCall: this.nextCall,
            stack: this.stack,
        };
    }
}
class AuthenticationError extends VeliKeyError {
    constructor(message, hint) {
        super(message, 'UNAUTHORIZED', 401, hint);
        this.name = 'AuthenticationError';
    }
}
class ValidationError extends VeliKeyError {
    constructor(message, hint, nextCall) {
        super(message, 'INVALID_SCHEMA', 400, hint, nextCall);
        this.name = 'ValidationError';
    }
}
class NotFoundError extends VeliKeyError {
    constructor(resource, id) {
        const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
        super(message, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
class RateLimitError extends VeliKeyError {
    constructor(message, retryAfter) {
        super(message, 'RATE_LIMIT', 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
class PolicyConflictError extends VeliKeyError {
    constructor(message, hint) {
        super(message, 'POLICY_CONFLICT', 409, hint, 'GET /policies/precedence?explain=true');
        this.name = 'PolicyConflictError';
    }
}
class ThresholdBreachError extends VeliKeyError {
    constructor(message, hint) {
        super(message, 'THRESHOLD_BREACH', 409, hint);
        this.name = 'ThresholdBreachError';
    }
}
class DowngradeDetectedError extends VeliKeyError {
    constructor(message) {
        super(message, 'DOWNGRADE_DETECTED', 403);
        this.name = 'DowngradeDetectedError';
    }
}
class NoCapabilityError extends VeliKeyError {
    constructor(capability, hint) {
        super(`Required capability not available: ${capability}`, 'NO_CAPABILITY', 422, hint);
        this.name = 'NoCapabilityError';
    }
}
class IdempotencyReplayError extends VeliKeyError {
    constructor(key) {
        super(`Operation already completed with idempotency key: ${key}`, 'IDEMPOTENCY_REPLAY', 409);
        this.name = 'IdempotencyReplayError';
    }
}
class TransientError extends VeliKeyError {
    constructor(message, hint) {
        super(message, 'TRANSIENT', 503, hint);
        this.name = 'TransientError';
    }
}
class UnsupportedOperationError extends VeliKeyError {
    constructor(method, routeHint) {
        super(`${method} is not available in the current public Axis API surface`, 'UNSUPPORTED_OPERATION', 501, routeHint ? `Use ${routeHint} instead` : undefined);
        this.name = 'UnsupportedOperationError';
    }
}
/**
 * Factory function to create appropriate error from API response
 */
function createErrorFromResponse(response, statusCode) {
    const error = (response && typeof response === 'object') ? (response.error || response) : { message: String(response ?? '') };
    const code = error.code || 'UNKNOWN';
    const message = error.human || error.error || error.message || 'Unknown error occurred';
    const hint = error.hint;
    const nextCall = error.next_call || error.nextCall;
    switch (code) {
        case 'UNAUTHORIZED':
            return new AuthenticationError(message, hint);
        case 'INVALID_SCHEMA':
            return new ValidationError(message, hint, nextCall);
        case 'NOT_FOUND':
            return new NotFoundError(message);
        case 'RATE_LIMIT':
            return new RateLimitError(message);
        case 'POLICY_CONFLICT':
            return new PolicyConflictError(message, hint);
        case 'THRESHOLD_BREACH':
            return new ThresholdBreachError(message, hint);
        case 'DOWNGRADE_DETECTED':
            return new DowngradeDetectedError(message);
        case 'NO_CAPABILITY':
            return new NoCapabilityError(message, hint);
        case 'IDEMPOTENCY_REPLAY':
            return new IdempotencyReplayError(message);
        case 'TRANSIENT':
            return new TransientError(message, hint);
        case 'UNSUPPORTED_OPERATION':
            return new UnsupportedOperationError(message, nextCall);
        default:
            return new VeliKeyError(message, code, statusCode, hint, nextCall);
    }
}

class AgentsResource {
    constructor(client) {
        this.client = client;
    }
    async list(options) {
        const response = await this.client.request('GET', '/api/agents', undefined, {
            ...options,
            params: {
                ...(options?.params || {}),
                ...(options?.agentId ? { agentId: options.agentId } : {}),
            },
        });
        return Array.isArray(response?.agents) ? response.agents : [];
    }
    async get(agentId, options) {
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

class PoliciesResource {
    constructor(client) {
        this.client = client;
    }
    async list(options) {
        const response = await this.client.request('GET', '/api/policies', undefined, {
            ...options,
            params: {
                ...(options?.params || {}),
                ...(options?.scope ? { scope: options.scope } : {}),
                ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
            },
        });
        return Array.isArray(response?.policies) ? response.policies : [];
    }
    async listForAgent(agentId, options) {
        const trimmed = agentId.trim();
        if (!trimmed) {
            throw new Error('agentId is required');
        }
        return this.client.request('GET', `/api/agents/${trimmed}/policies`, undefined, options);
    }
    async create() {
        throw new UnsupportedOperationError('policies.create', 'GET /api/policies');
    }
    async update() {
        throw new UnsupportedOperationError('policies.update', 'GET /api/policies');
    }
    async delete() {
        throw new UnsupportedOperationError('policies.delete', 'GET /api/policies');
    }
}

class MonitoringResource {
    constructor(client) {
        this.client = client;
    }
    async getActiveAlerts(options) {
        const response = await this.client.request('GET', '/api/alerts', undefined, {
            ...options,
            params: {
                ...(options?.params || {}),
                resolved: false,
                ...(options?.severity ? { severity: options.severity } : {}),
                ...(options?.category ? { category: options.category } : {}),
                ...(options?.limit ? { limit: options.limit } : {}),
            },
        });
        return Array.isArray(response?.alerts) ? response.alerts : [];
    }
    async getAlertStats(options) {
        return this.client.request('GET', '/api/alerts/stats', undefined, options);
    }
    async getDashboardStats() {
        throw new UnsupportedOperationError('monitoring.getDashboardStats', 'GET /api/alerts/stats');
    }
    async getMetrics() {
        throw new UnsupportedOperationError('monitoring.getMetrics', 'GET /api/usage');
    }
    async getAgentHealth() {
        throw new UnsupportedOperationError('monitoring.getAgentHealth', 'GET /api/health');
    }
}

class ComplianceResource {
    async getReport() {
        throw new UnsupportedOperationError('compliance.getReport', 'unsupported in public Axis API');
    }
    async listFrameworks() {
        throw new UnsupportedOperationError('compliance.listFrameworks', 'unsupported in public Axis API');
    }
    async runAssessment() {
        throw new UnsupportedOperationError('compliance.runAssessment', 'unsupported in public Axis API');
    }
}

class DiagnosticsResource {
    async runCheck() {
        throw new UnsupportedOperationError('diagnostics.runCheck', 'GET /api/health');
    }
    async getSystemInfo() {
        throw new UnsupportedOperationError('diagnostics.getSystemInfo', 'GET /api/health');
    }
    async testConnectivity() {
        throw new UnsupportedOperationError('diagnostics.testConnectivity', 'GET /api/healthz');
    }
}

class RolloutsResource {
    constructor(client) {
        this.client = client;
    }
    async plan(request, options) {
        if (!request?.policyId?.trim()) {
            throw new Error('policyId is required');
        }
        return this.client.request('POST', '/api/rollouts/plan', request, options);
    }
    async apply(request, options) {
        if (!request?.planId?.trim()) {
            throw new Error('planId is required');
        }
        const payload = {
            ...request,
            dryRun: request.dryRun !== false,
        };
        if (payload.dryRun === false) {
            payload.confirm = true;
            payload.confirmation = 'APPLY';
        }
        return this.client.request('POST', '/api/rollouts/apply', payload, {
            ...options,
            idempotencyKey: request.idempotencyKey || options?.idempotencyKey,
        });
    }
    async rollback(request, options) {
        if (!request?.rollbackToken?.trim()) {
            throw new Error('rollbackToken is required');
        }
        const payload = {
            ...request,
            confirm: true,
            confirmation: 'ROLLBACK',
        };
        return this.client.request('POST', '/api/rollouts/rollback', payload, options);
    }
}

class TelemetryResource {
    constructor(client) {
        this.client = client;
    }
    async ingest(data, options) {
        if (!data?.event?.trim()) {
            throw new Error('event is required');
        }
        return this.client.request('POST', '/api/telemetry/ingest', data, options);
    }
    async submit(data, options) {
        return this.ingest(data, options);
    }
    async getUsage(period = 'current', options) {
        return this.client.request('GET', '/api/usage', undefined, {
            ...options,
            params: {
                ...(options?.params || {}),
                period,
            },
        });
    }
    async getUsageSummary(options) {
        return this.client.request('GET', '/api/usage/summary', undefined, options);
    }
}

/**
 * Utility functions for VeliKey SDK
 */
/**
 * Generate a UUID v4
 */
function generateUUID() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto) {
        return globalThis.crypto.randomUUID();
    }
    // Fallback for older environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                throw lastError;
            }
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Validate required fields in an object
 */
function validateRequired(obj, requiredFields) {
    const missing = requiredFields.filter(field => obj[field] === undefined || obj[field] === null || obj[field] === '');
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}
/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = result[key];
            if (isObject(sourceValue) && isObject(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
    }
    return result;
}
/**
 * Check if value is a plain object
 */
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000)
        return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}
/**
 * Redact sensitive information from objects for logging
 */
function redactSecrets(obj) {
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'credential'];
    const result = { ...obj };
    function redactRecursive(item) {
        if (typeof item === 'object' && item !== null) {
            if (Array.isArray(item)) {
                return item.map(redactRecursive);
            }
            const redacted = {};
            for (const [key, value] of Object.entries(item)) {
                if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    redacted[key] = '[REDACTED]';
                }
                else {
                    redacted[key] = redactRecursive(value);
                }
            }
            return redacted;
        }
        return item;
    }
    return redactRecursive(result);
}
/**
 * Create a debounced function
 */
function debounce(func, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}
/**
 * Create a throttled function
 */
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

const DEFAULT_BASE_URL = 'https://axis.velikey.com';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_MIN_DELAY_MS = 250;
const DEFAULT_RETRY_MAX_DELAY_MS = 2000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const SDK_USER_AGENT = 'velikey-js-sdk/0.2.0';
class VeliKeySDK extends EventEmitter {
    constructor(config) {
        super();
        const authToken = config.bearerToken || config.apiKey;
        const hasAuth = Boolean(authToken || config.sessionCookie || config.sessionToken);
        if (!hasAuth) {
            throw new Error('Provide at least one credential: apiKey, bearerToken, sessionCookie, or sessionToken.');
        }
        this.authToken = authToken;
        this.sessionCookie = config.sessionCookie?.trim() || undefined;
        this.sessionToken = config.sessionToken?.trim() || undefined;
        this.useSecureSessionCookie = Boolean(config.useSecureSessionCookie);
        this.maxRetries = Math.max(0, config.maxRetries ?? DEFAULT_MAX_RETRIES);
        this.retryMinDelayMs = Math.max(1, config.retryMinDelayMs ?? DEFAULT_RETRY_MIN_DELAY_MS);
        this.retryMaxDelayMs = Math.max(this.retryMinDelayMs, config.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS);
        this.client = axios.create({
            baseURL: config.baseUrl || DEFAULT_BASE_URL,
            timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': SDK_USER_AGENT,
            },
        });
        this.agents = new AgentsResource(this);
        this.policies = new PoliciesResource(this);
        this.monitoring = new MonitoringResource(this);
        this.compliance = new ComplianceResource();
        this.diagnostics = new DiagnosticsResource();
        this.rollouts = new RolloutsResource(this);
        this.telemetry = new TelemetryResource(this);
    }
    async request(method, path, data, options) {
        const methodUpper = method.toUpperCase();
        const headers = {
            ...(options?.headers || {}),
        };
        this.applyAuth(headers);
        if (methodUpper !== 'GET' && methodUpper !== 'DELETE') {
            headers['Idempotency-Key'] = options?.idempotencyKey || generateUUID();
        }
        const requestConfig = {
            method: methodUpper,
            url: path,
            data,
            params: options?.params,
            headers,
            timeout: options?.timeout,
        };
        return this.executeWithRetry(requestConfig, options?.retryable !== false);
    }
    async testConnection() {
        const start = Date.now();
        try {
            const payload = await this.request('GET', '/api/healthz', undefined, {
                retryable: false,
            });
            return {
                connected: true,
                latencyMs: Date.now() - start,
                status: String(payload.status || 'ok'),
                version: String(payload.version || 'unknown'),
            };
        }
        catch {
            return {
                connected: false,
                latencyMs: Date.now() - start,
                status: 'unreachable',
                version: 'unknown',
            };
        }
    }
    async getHealth() {
        try {
            return await this.request('GET', '/api/health', undefined, {
                retryable: false,
            });
        }
        catch {
            return this.request('GET', '/api/healthz', undefined, {
                retryable: false,
            });
        }
    }
    async getUsage(period = 'current') {
        return this.request('GET', '/api/usage', undefined, {
            params: { period },
        });
    }
    async getUsageSummary() {
        return this.request('GET', '/api/usage/summary');
    }
    async getSecurityStatus() {
        const [agents, policies, alerts] = await Promise.all([
            this.agents.list(),
            this.policies.list({ isActive: true }),
            this.monitoring.getActiveAlerts(),
        ]);
        const totalAgents = agents.length;
        const onlineAgents = agents.filter((agent) => {
            const status = String(agent.status || '').toLowerCase();
            return status === 'active' || status === 'online';
        }).length;
        const activePolicies = policies.filter((policy) => policy.isActive !== false).length;
        const criticalAlerts = alerts.filter((alert) => String(alert.severity).toLowerCase() === 'critical').length;
        return {
            agentsOnline: `${onlineAgents}/${totalAgents}`,
            policiesActive: activePolicies,
            criticalAlerts,
            healthScore: totalAgents === 0 ? 0 : Math.max(0, Math.min(100, Math.round((onlineAgents / totalAgents) * 100))),
            generatedAt: new Date().toISOString(),
        };
    }
    destroy() {
        this.removeAllListeners();
    }
    applyAuth(headers) {
        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }
        const cookieHeader = this.resolveCookieHeader();
        if (cookieHeader) {
            headers.Cookie = cookieHeader;
        }
    }
    resolveCookieHeader() {
        if (this.sessionCookie) {
            return this.sessionCookie;
        }
        if (!this.sessionToken) {
            return undefined;
        }
        const cookieName = this.useSecureSessionCookie
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token';
        return `${cookieName}=${this.sessionToken}`;
    }
    async executeWithRetry(requestConfig, retryable) {
        let attempt = 0;
        while (attempt <= this.maxRetries) {
            try {
                const response = await this.client.request(requestConfig);
                return response.data;
            }
            catch (error) {
                const axiosError = error;
                const status = axiosError.response?.status;
                const shouldRetry = retryable &&
                    attempt < this.maxRetries &&
                    (status === undefined || RETRYABLE_STATUS_CODES.has(status));
                if (!shouldRetry) {
                    throw createErrorFromResponse(axiosError.response?.data || axiosError.message, status);
                }
                const delayMs = this.computeRetryDelayMs(attempt, axiosError);
                await sleep(delayMs);
                attempt += 1;
            }
        }
        throw createErrorFromResponse('Request failed after retry budget exhausted');
    }
    computeRetryDelayMs(attempt, error) {
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        const retryAfterMs = this.parseRetryAfterMs(Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader);
        if (retryAfterMs !== undefined) {
            return retryAfterMs;
        }
        const exponential = this.retryMinDelayMs * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 100);
        return Math.min(this.retryMaxDelayMs, exponential + jitter);
    }
    parseRetryAfterMs(retryAfter) {
        if (retryAfter === undefined || retryAfter === null) {
            return undefined;
        }
        if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
            return Math.max(0, Math.round(retryAfter * 1000));
        }
        const raw = String(retryAfter).trim();
        if (!raw) {
            return undefined;
        }
        const seconds = Number(raw);
        if (Number.isFinite(seconds)) {
            return Math.max(0, Math.round(seconds * 1000));
        }
        const date = Date.parse(raw);
        if (Number.isNaN(date)) {
            return undefined;
        }
        return Math.max(0, date - Date.now());
    }
}

class NotifierClient {
    constructor(baseUrl, opts) {
        this.http = axios.create({ baseURL: baseUrl, timeout: opts?.timeoutMs ?? 3000 });
        this.spoolUrl = opts?.spoolUrl;
    }
    async register(req) {
        await this.http.post('/v1/register', req);
    }
    async issue(req) {
        const { data } = await this.http.post('/v1/issue', req);
        // data.tokens = [{ token: string }]
        return Array.isArray(data.tokens) ? data.tokens.map((t) => t.token) : [];
    }
    async attachNotify(descriptor) {
        if (!this.spoolUrl)
            throw new Error('spoolUrl not configured');
        await axios.post(`${this.spoolUrl}/v1/attach-notify`, descriptor, { timeout: 3000 });
    }
}

function createClient(config) {
    return new VeliKeySDK(config);
}
function createPolicyBuilder(name) {
    return new PolicyBuilder(name);
}
function createAgentConfig(controlPlaneUrl, authToken) {
    return {
        controlPlaneUrl,
        authToken,
        enableTelemetry: true,
        logLevel: 'info',
        plugins: [],
    };
}
class PolicyBuilder {
    constructor(name) {
        this.policy = {
            name,
            scope: {},
            rules: {},
        };
    }
    scope(scope) {
        this.policy.scope = { ...this.policy.scope, ...scope };
        return this;
    }
    rules(rules) {
        this.policy.rules = { ...this.policy.rules, ...rules };
        return this;
    }
    description(description) {
        this.policy.description = description;
        return this;
    }
    build() {
        if (!this.policy.name.trim()) {
            throw new Error('policy name is required');
        }
        return { ...this.policy };
    }
}

export { AgentsResource, AuthenticationError, ComplianceResource, DiagnosticsResource, DowngradeDetectedError, IdempotencyReplayError, MonitoringResource, NoCapabilityError, NotFoundError, NotifierClient, PoliciesResource, PolicyConflictError, RateLimitError, RolloutsResource, TelemetryResource, ThresholdBreachError, TransientError, UnsupportedOperationError, ValidationError, VeliKeyError, VeliKeySDK, createAgentConfig, createClient, createErrorFromResponse, createPolicyBuilder, debounce, deepMerge, formatBytes, formatDuration, generateUUID, redactSecrets, retry, sleep, throttle, validateRequired };
//# sourceMappingURL=index.esm.js.map
