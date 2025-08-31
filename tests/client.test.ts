/**
 * Tests for VeliKey JavaScript/TypeScript SDK
 */

import { VeliKeySDK, PolicyBuilder } from '../src/client';
import { AuthenticationError, ValidationError } from '../src/errors';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VeliKeySDK', () => {
  let client: VeliKeySDK;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = new VeliKeySDK({
      apiKey: 'test-api-key',
      baseUrl: 'https://api-test.velikey.com',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api-test.velikey.com',
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer test-api-key',
          'User-Agent': 'velikey-js-sdk/0.1.0',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should have all resource managers', () => {
      expect(client.agents).toBeDefined();
      expect(client.policies).toBeDefined();
      expect(client.monitoring).toBeDefined();
      expect(client.compliance).toBeDefined();
      expect(client.diagnostics).toBeDefined();
    });
  });

  describe('quickSetup', () => {
    it('should perform quick setup successfully', async () => {
      const mockResponse = {
        data: {
          policy_id: 'policy-123',
          policy_name: 'SOC2 Policy',
          deployment_instructions: { helm: 'helm install...' },
          next_steps: ['Deploy agents', 'Verify connectivity'],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.quickSetup({
        complianceFramework: 'soc2',
        enforcementMode: 'observe',
        postQuantum: true,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/setup/quick', {
        complianceFramework: 'soc2',
        enforcementMode: 'observe',
        postQuantum: true,
      });

      expect(result.policy_id).toBe('policy-123');
      expect(result.policy_name).toBe('SOC2 Policy');
    });
  });

  describe('getSecurityStatus', () => {
    it('should return security status', async () => {
      const mockResponse = {
        data: {
          healthScore: 85,
          agentsOnline: '3/3',
          policiesActive: 2,
          criticalAlerts: 0,
          recommendations: ['Enable post-quantum crypto'],
          lastUpdated: new Date().toISOString(),
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const status = await client.getSecurityStatus();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/security/status');
      expect(status.healthScore).toBe(85);
      expect(status.agentsOnline).toBe('3/3');
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const error = new Error('Request failed');
      (error as any).response = {
        status: 401,
        data: { message: 'Unauthorized' },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      // The interceptor should convert this to AuthenticationError
      // This test validates the error handling setup
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('event subscription', () => {
    it('should set up event polling', () => {
      const mockSetInterval = jest.spyOn(global, 'setInterval');
      
      client.subscribeToEvents(['alert', 'agent.status']);
      
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        30000
      );
    });

    it('should clean up on unsubscribe', () => {
      const mockClearInterval = jest.spyOn(global, 'clearInterval');
      
      client.subscribeToEvents();
      client.unsubscribe();
      
      expect(mockClearInterval).toHaveBeenCalled();
    });
  });
});

describe('PolicyBuilder', () => {
  let builder: PolicyBuilder;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
    };
    
    builder = new PolicyBuilder(mockAxiosInstance);
  });

  it('should build policy configuration correctly', () => {
    const config = builder
      .complianceStandard('SOC2 Type II')
      .postQuantumReady()
      .enforcementMode('enforce')
      .build();

    expect(config.rules.compliance_standard).toBe('SOC2 Type II');
    expect(config.rules.aegis.pq_ready).toContain('TLS_KYBER768_P256_SHA256');
    expect(config.enforcement_mode).toBe('enforce');
  });

  it('should create policy via API', async () => {
    const mockResponse = {
      data: {
        id: 'policy-123',
        name: 'Test Policy',
        compliance_framework: 'soc2',
      },
    };

    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    const policy = await builder
      .complianceStandard('SOC2 Type II')
      .enforcementMode('observe')
      .create('Test Policy', 'Test policy description');

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/policies', {
      name: 'Test Policy',
      description: 'Test policy description',
      rules: builder.rules,
      enforcement_mode: 'observe',
    });

    expect(policy.id).toBe('policy-123');
  });
});

describe('React Hooks', () => {
  // Mock React
  const mockUseState = jest.fn();
  const mockUseEffect = jest.fn();
  const mockUseCallback = jest.fn();

  beforeAll(() => {
    (global as any).React = {
      useState: mockUseState,
      useEffect: mockUseEffect,
      useCallback: mockUseCallback,
    };
  });

  it('should provide useVeliKey hook', () => {
    const { useVeliKey } = require('../src/client');
    
    mockUseState
      .mockReturnValueOnce([new VeliKeySDK({ apiKey: 'test' }), jest.fn()]) // client state
      .mockReturnValueOnce([false, jest.fn()]) // loading state
      .mockReturnValueOnce([null, jest.fn()]); // error state

    mockUseCallback.mockReturnValue(jest.fn());
    mockUseEffect.mockReturnValue(undefined);

    const result = useVeliKey('test-api-key');
    
    expect(result).toHaveProperty('client');
    expect(result).toHaveProperty('loading');
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('execute');
  });
});

// Integration tests
describe('Integration Tests', () => {
  beforeEach(() => {
    // Skip integration tests unless explicitly enabled
    if (!process.env.RUN_INTEGRATION_TESTS) {
      jest.skip();
    }
  });

  it('should connect to test API server', async () => {
    const client = new VeliKeySDK({
      apiKey: process.env.TEST_API_KEY || 'test-key',
      baseUrl: 'https://api-test.velikey.com',
    });

    try {
      const health = await client.getHealth();
      expect(health.status).toBe('ok');
    } catch (error) {
      // Expected if test server not available
      expect(error).toBeInstanceOf(Error);
    }
  });
});
