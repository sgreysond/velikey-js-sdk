import axios from 'axios';
import { VeliKeySDK } from '../src/client';
import { UnsupportedOperationError } from '../src/errors';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeHttpError(status: number, payload: Record<string, unknown> = {}) {
  const error: any = new Error(`HTTP ${status}`);
  error.response = {
    status,
    data: payload,
    headers: {},
  };
  return error;
}

describe('VeliKeySDK', () => {
  let requestMock: jest.Mock;

  beforeEach(() => {
    requestMock = jest.fn();
    mockedAxios.create.mockReturnValue({
      request: requestMock,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('configures axios with Axis defaults', () => {
    new VeliKeySDK({ sessionToken: 'token-123' });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://axis.velikey.com',
        timeout: 30000,
      })
    );
  });

  it('sends session token as Cookie header', async () => {
    requestMock.mockResolvedValue({ data: { agents: [] } });
    const sdk = new VeliKeySDK({ sessionToken: 'token-123' });

    await sdk.agents.list();

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/agents',
        headers: expect.objectContaining({
          Cookie: 'next-auth.session-token=token-123',
        }),
      })
    );
  });

  it('sends secure session cookie when requested', async () => {
    requestMock.mockResolvedValue({ data: { agents: [] } });
    const sdk = new VeliKeySDK({ sessionToken: 'token-123', useSecureSessionCookie: true });

    await sdk.agents.list();

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: '__Secure-next-auth.session-token=token-123',
        }),
      })
    );
  });

  it('sends bearer token header when api key is configured', async () => {
    requestMock.mockResolvedValue({ data: { current: {}, usage: {}, historical: [] } });
    const sdk = new VeliKeySDK({ apiKey: 'vk_test_123' });

    await sdk.getUsage();

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer vk_test_123',
        }),
      })
    );
  });

  it('retries transient failures before succeeding', async () => {
    requestMock
      .mockRejectedValueOnce(makeHttpError(503, { error: 'temporary' }))
      .mockResolvedValueOnce({ data: { status: 'ok' } });

    const sdk = new VeliKeySDK({
      sessionToken: 'token-123',
      retryMinDelayMs: 1,
      retryMaxDelayMs: 1,
      maxRetries: 1,
    });

    const result = await sdk.getHealth();
    expect(result.status).toBe('ok');
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('auto-populates apply confirmation for non-dry-run calls', async () => {
    requestMock.mockResolvedValue({ data: { success: true, data: { rollout_id: 'r-1' } } });
    const sdk = new VeliKeySDK({ sessionToken: 'token-123' });

    await sdk.rollouts.apply({ planId: 'plan-1', dryRun: false });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/rollouts/apply',
        data: expect.objectContaining({
          planId: 'plan-1',
          dryRun: false,
          confirm: true,
          confirmation: 'APPLY',
        }),
      })
    );
  });

  it('throws unsupported-operation errors for policy mutation helpers', async () => {
    const sdk = new VeliKeySDK({ sessionToken: 'token-123' });
    await expect(sdk.policies.create()).rejects.toBeInstanceOf(UnsupportedOperationError);
    await expect(sdk.policies.update()).rejects.toBeInstanceOf(UnsupportedOperationError);
    await expect(sdk.policies.delete()).rejects.toBeInstanceOf(UnsupportedOperationError);
  });
});
