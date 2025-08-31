# Contributing to VeliKey JavaScript/TypeScript SDK

We welcome contributions to the VeliKey JavaScript/TypeScript SDK! This document provides guidelines for contributing to the JavaScript client library for VeliKey Aegis.

## Development Environment

### Prerequisites

- **Node.js**: 16+ (recommended: use nvm)
- **npm/yarn/pnpm**: Package manager
- **Git**: For version control
- **TypeScript**: For type checking
- **VeliKey Aegis**: Access to control plane for testing

### Setup

```bash
# Clone the repository
git clone https://github.com/velikey/velikey-js-sdk.git
cd velikey-js-sdk

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type checking
npm run type-check
```

## Development Workflow [[memory:7696176]]

1. **Create a feature branch** from `main`
2. **Make your changes** with appropriate tests
3. **Run quality checks**:
   ```bash
   npm run build
   npm test
   npm run lint
   npm run type-check
   ```
4. **Commit with conventional messages** (feat, fix, chore, docs, refactor)
5. **Open a Pull Request** with clear description
6. **Address review feedback** promptly

## Code Quality Standards

### Testing Requirements [[memory:7696167]]

All contributions must include comprehensive testing:

- **Unit Tests**: Individual function and class testing
- **Integration Tests**: API integration testing
- **End-to-End Tests**: Complete workflow testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e              # End-to-end tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run tests in specific environments
npm run test:node             # Node.js environment
npm run test:browser          # Browser environment
```

### Code Style

We use strict formatting and linting:

```bash
# Format code
npm run lint:fix

# Check linting
npm run lint

# Type checking
npm run type-check

# Build check
npm run build

# All quality checks
npm run quality-check
```

### Configuration Files

The project uses these tools with specific configurations:

```json
// package.json
{
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "quality-check": "npm run lint && npm run type-check && npm run test && npm run build"
  }
}
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Project Structure

```
src/
├── index.ts                 # Main exports
├── client.ts                # Main client class
├── types.ts                 # TypeScript type definitions
├── errors.ts                # Error classes
├── resources/               # API resource modules
│   ├── index.ts
│   ├── agents.ts           # Agent management
│   ├── policies.ts         # Policy management
│   ├── monitoring.ts       # Metrics and alerts
│   ├── compliance.ts       # Compliance validation
│   └── diagnostics.ts      # System diagnostics
├── utils/                  # Utility functions
│   ├── index.ts
│   ├── auth.ts            # Authentication helpers
│   ├── validation.ts       # Input validation
│   └── formatting.ts       # Output formatting
├── hooks/                  # React hooks (optional)
│   ├── index.ts
│   ├── useVeliKey.ts      # Main React hook
│   └── useSecurityStatus.ts
└── internal/              # Internal modules
    ├── http.ts            # HTTP client
    └── config.ts          # Configuration

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                  # End-to-end tests
├── fixtures/             # Test fixtures
└── setup.ts              # Test setup

examples/                 # Usage examples
├── node-basic.js         # Basic Node.js example
├── react-hooks.tsx       # React hooks example
└── express-middleware.js # Express middleware example
```

## SDK Architecture

### Main Client Class

```typescript
interface VeliKeyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

interface SecurityStatus {
  healthScore: number;
  agentsOnline: string;
  criticalAlerts: number;
  policyCompliance: number;
  lastUpdated: string;
}

export class VeliKeySDK {
  private http: HttpClient;
  
  public readonly agents: AgentsResource;
  public readonly policies: PoliciesResource;
  public readonly monitoring: MonitoringResource;
  public readonly compliance: ComplianceResource;
  public readonly diagnostics: DiagnosticsResource;

  constructor(config: VeliKeyConfig) {
    this.http = new HttpClient(config);
    
    // Initialize resources
    this.agents = new AgentsResource(this.http);
    this.policies = new PoliciesResource(this.http);
    this.monitoring = new MonitoringResource(this.http);
    this.compliance = new ComplianceResource(this.http);
    this.diagnostics = new DiagnosticsResource(this.http);
  }

  async quickSetup(options: QuickSetupOptions): Promise<QuickSetupResult> {
    // High-level setup method
    const policy = await this.createPolicyBuilder()
      .complianceFramework(options.complianceFramework)
      .enforcementMode(options.enforcementMode)
      .postQuantumReady(options.postQuantum)
      .create(`${options.complianceFramework} Policy`);
    
    return {
      policyName: policy.name,
      policyId: policy.id,
      nextSteps: this.generateNextSteps(policy)
    };
  }

  async getSecurityStatus(): Promise<SecurityStatus> {
    return this.http.get<SecurityStatus>('/security/status');
  }

  createPolicyBuilder(): PolicyBuilder {
    return new PolicyBuilder(this.http);
  }
}
```

### Resource Pattern

```typescript
// Base resource class
abstract class BaseResource {
  constructor(protected http: HttpClient) {}

  protected async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    return this.http.request<T>(method, path, data);
  }
}

// Policy resource implementation
export class PoliciesResource extends BaseResource {
  async list(options?: ListOptions): Promise<Policy[]> {
    const params = this.buildQueryParams(options);
    return this.request<Policy[]>('GET', `/policies${params}`);
  }

  async get(policyId: string): Promise<Policy> {
    return this.request<Policy>('GET', `/policies/${policyId}`);
  }

  async create(data: CreatePolicyRequest): Promise<Policy> {
    return this.request<Policy>('POST', '/policies', data);
  }

  async update(policyId: string, data: UpdatePolicyRequest): Promise<Policy> {
    return this.request<Policy>('PUT', `/policies/${policyId}`, data);
  }

  async delete(policyId: string): Promise<void> {
    await this.request<void>('DELETE', `/policies/${policyId}`);
  }

  async deploy(
    policyId: string, 
    options?: DeploymentOptions
  ): Promise<PolicyDeployment> {
    return this.request<PolicyDeployment>(
      'POST', 
      `/policies/${policyId}/deploy`,
      options
    );
  }

  private buildQueryParams(options?: ListOptions): string {
    if (!options) return '';
    
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.filter) params.append('filter', options.filter);
    
    return params.toString() ? `?${params.toString()}` : '';
  }
}
```

### Type Definitions

```typescript
// Core types
export interface Policy {
  id: string;
  name: string;
  complianceFramework?: string;
  enforcementMode: 'observe' | 'enforce';
  rules: Record<string, any>;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  version: string;
  lastSeen: string;
  healthScore: number;
  location?: {
    region: string;
    zone: string;
  };
}

// Request/Response types
export interface CreatePolicyRequest {
  name: string;
  rules: Record<string, any>;
  complianceFramework?: string;
  enforcementMode?: 'observe' | 'enforce';
}

export interface QuickSetupOptions {
  complianceFramework: string;
  enforcementMode?: 'observe' | 'enforce';
  postQuantum?: boolean;
}

export interface QuickSetupResult {
  policyName: string;
  policyId: string;
  nextSteps: string[];
}

// Error types
export class VeliKeyError extends Error {
  constructor(
    message: string,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'VeliKeyError';
  }
}

export class AuthenticationError extends VeliKeyError {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends VeliKeyError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### HTTP Client Implementation

```typescript
interface RequestConfig {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retries: number;

  constructor(config: VeliKeyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.velikey.com';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const config: RequestConfig = {
      method: method.toUpperCase(),
      url: `${this.baseUrl}${path}`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'VeliKey-JS-SDK/1.0.0'
      },
      timeout: this.timeout
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.data = JSON.stringify(data);
    }

    return this.executeWithRetry<T>(config);
  }

  private async executeWithRetry<T>(
    config: RequestConfig,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await this.execute<T>(config);
      return response;
    } catch (error) {
      if (attempt < this.retries && this.shouldRetry(error)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await this.sleep(delay);
        return this.executeWithRetry<T>(config, attempt + 1);
      }
      throw error;
    }
  }

  private async execute<T>(config: RequestConfig): Promise<T> {
    // Use fetch or axios depending on environment
    if (typeof window !== 'undefined') {
      // Browser environment
      return this.fetchRequest<T>(config);
    } else {
      // Node.js environment
      return this.nodeRequest<T>(config);
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    return error.code === 'NETWORK_ERROR' || 
           (error.status >= 500 && error.status < 600);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## React Integration

### Custom Hooks

```typescript
// hooks/useVeliKey.ts
import { useState, useCallback, useEffect } from 'react';
import { VeliKeySDK, VeliKeyConfig } from '../client';

interface UseVeliKeyOptions extends Partial<VeliKeyConfig> {
  apiKey: string;
}

interface UseVeliKeyReturn {
  client: VeliKeySDK;
  loading: boolean;
  error: Error | null;
  execute: <T>(operation: (client: VeliKeySDK) => Promise<T>) => Promise<T>;
}

export function useVeliKey(options: UseVeliKeyOptions): UseVeliKeyReturn {
  const [client] = useState(() => new VeliKeySDK(options));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <T>(
    operation: (client: VeliKeySDK) => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(client);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { client, loading, error, execute };
}

// hooks/useSecurityStatus.ts
export function useSecurityStatus(client: VeliKeySDK, refreshInterval?: number) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const result = await client.getSecurityStatus();
        if (mounted) {
          setStatus(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStatus();

    if (refreshInterval) {
      intervalId = setInterval(fetchStatus, refreshInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [client, refreshInterval]);

  return { status, loading, error };
}
```

## Testing Guidelines

### Unit Testing with Jest

```typescript
// tests/unit/client.test.ts
import { VeliKeySDK } from '../../src/client';
import { HttpClient } from '../../src/internal/http';

// Mock the HTTP client
jest.mock('../../src/internal/http');
const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('VeliKeySDK', () => {
  let client: VeliKeySDK;
  let mockHttp: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttp = {
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as any;

    MockedHttpClient.mockImplementation(() => mockHttp);

    client = new VeliKeySDK({ apiKey: 'test-key' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSecurityStatus', () => {
    it('should return security status', async () => {
      const mockStatus = {
        healthScore: 85,
        agentsOnline: '5/10',
        criticalAlerts: 0,
        policyCompliance: 0.92,
        lastUpdated: '2024-01-15T10:30:00Z'
      };

      mockHttp.get.mockResolvedValue(mockStatus);

      const result = await client.getSecurityStatus();

      expect(result).toEqual(mockStatus);
      expect(mockHttp.get).toHaveBeenCalledWith('/security/status');
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockHttp.get.mockRejectedValue(error);

      await expect(client.getSecurityStatus()).rejects.toThrow('API Error');
    });
  });

  describe('quickSetup', () => {
    it('should create policy and return setup result', async () => {
      const mockPolicy = {
        id: 'pol_123',
        name: 'soc2 Policy',
        status: 'active'
      };

      // Mock the policy builder chain
      const mockBuilder = {
        complianceFramework: jest.fn().mockReturnThis(),
        enforcementMode: jest.fn().mockReturnThis(),
        postQuantumReady: jest.fn().mockReturnThis(),
        create: jest.fn().mockResolvedValue(mockPolicy)
      };

      jest.spyOn(client, 'createPolicyBuilder').mockReturnValue(mockBuilder as any);

      const result = await client.quickSetup({
        complianceFramework: 'soc2',
        enforcementMode: 'observe',
        postQuantum: true
      });

      expect(result.policyName).toBe('soc2 Policy');
      expect(result.policyId).toBe('pol_123');
      expect(mockBuilder.complianceFramework).toHaveBeenCalledWith('soc2');
      expect(mockBuilder.enforcementMode).toHaveBeenCalledWith('observe');
      expect(mockBuilder.postQuantumReady).toHaveBeenCalledWith(true);
    });
  });
});
```

### React Hook Testing

```typescript
// tests/unit/hooks/useVeliKey.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useVeliKey } from '../../../src/hooks/useVeliKey';

// Mock the VeliKeySDK
jest.mock('../../../src/client');

describe('useVeliKey', () => {
  it('should initialize client with provided options', () => {
    const { result } = renderHook(() => 
      useVeliKey({ apiKey: 'test-key' })
    );

    expect(result.current.client).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle async operations with loading states', async () => {
    const { result } = renderHook(() => 
      useVeliKey({ apiKey: 'test-key' })
    );

    const mockOperation = jest.fn().mockResolvedValue('success');

    let promise: Promise<string>;
    act(() => {
      promise = result.current.execute(mockOperation);
    });

    expect(result.current.loading).toBe(true);

    const result_value = await promise!;

    expect(result_value).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

### Integration Testing

```typescript
// tests/integration/client.integration.test.ts
import { VeliKeySDK } from '../../src/client';

// Skip if no API key provided
const testApiKey = process.env.VELIKEY_TEST_API_KEY;
const skipIntegration = !testApiKey;

describe('VeliKey SDK Integration', () => {
  let client: VeliKeySDK;

  beforeAll(() => {
    if (skipIntegration) {
      console.log('Skipping integration tests - no API key provided');
      return;
    }
    client = new VeliKeySDK({ apiKey: testApiKey! });
  });

  afterAll(() => {
    // Cleanup if needed
  });

  test('should get security status', async () => {
    if (skipIntegration) return;

    const status = await client.getSecurityStatus();

    expect(status.healthScore).toBeGreaterThanOrEqual(0);
    expect(status.healthScore).toBeLessThanOrEqual(100);
    expect(status.agentsOnline).toMatch(/\d+\/\d+/);
    expect(typeof status.criticalAlerts).toBe('number');
  });

  test('should list policies', async () => {
    if (skipIntegration) return;

    const policies = await client.policies.list();

    expect(Array.isArray(policies)).toBe(true);
    
    if (policies.length > 0) {
      const policy = policies[0];
      expect(policy).toHaveProperty('id');
      expect(policy).toHaveProperty('name');
      expect(policy).toHaveProperty('status');
    }
  });
});
```

## Build Configuration

### Rollup Configuration

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = ['axios', 'eventemitter3'];

export default [
  // Main build
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json'
      })
    ]
  },
  
  // Type definitions
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  }
];
```

## Git Commit Guidelines

Use conventional commit messages:

```
feat(client): add bulk operations support
fix(hooks): handle React strict mode edge case
docs(readme): update React integration examples
test(integration): add comprehensive API tests
refactor(http): improve error handling
```

## Release Process

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Build and test**:
   ```bash
   npm run quality-check
   npm run build
   ```
4. **Publish to npm**:
   ```bash
   npm publish
   ```

## Getting Help

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Community Forum**: [community.velikey.com](https://community.velikey.com)
- **Email**: [js-sdk@velikey.com](mailto:js-sdk@velikey.com)

## License

By contributing to VeliKey JavaScript/TypeScript SDK, you agree that your contributions will be licensed under the MIT License.
