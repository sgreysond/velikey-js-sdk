import { GatewaysResource } from '../src/resources/gateways';

type Call = { method: string; path: string; data?: unknown };

function makeClient() {
  const calls: Call[] = [];
  const request = jest.fn(
    async (method: string, path: string, data?: unknown) => {
      calls.push({ method, path, data });
      return { ok: true } as unknown;
    }
  );
  return { client: { request }, calls };
}

describe('GatewaysResource', () => {
  describe('installPlan', () => {
    it('POSTs to /api/gateway/install-plans with the input', async () => {
      const { client, calls } = makeClient();
      const gw = new GatewaysResource(client);
      const input = { name: 'edge-prod', mode: 'INGRESS' as const, template: 'SOC2' as const };
      await gw.installPlan(input);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe('POST');
      expect(calls[0].path).toBe('/api/gateway/install-plans');
      expect(calls[0].data).toEqual(input);
    });

    it('throws when name is missing/blank before any request', async () => {
      const { client, calls } = makeClient();
      const gw = new GatewaysResource(client);
      await expect(
        gw.installPlan({ name: '  ', mode: 'INGRESS' } as never)
      ).rejects.toThrow(/name is required/);
      expect(calls).toHaveLength(0);
    });

    it('throws when mode is missing', async () => {
      const { client } = makeClient();
      const gw = new GatewaysResource(client);
      await expect(
        gw.installPlan({ name: 'x' } as never)
      ).rejects.toThrow(/mode is required/);
    });
  });

  describe('list', () => {
    it('GETs /api/gateways with no query when no opts', async () => {
      const { client, calls } = makeClient();
      await new GatewaysResource(client).list();
      expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/gateways' });
    });

    it('encodes limit/cursor/status into the query string', async () => {
      const { client, calls } = makeClient();
      await new GatewaysResource(client).list({
        limit: 25,
        cursor: 'abc',
        status: 'HEALTHY',
      });
      const url = new URL('https://x' + calls[0].path);
      expect(url.pathname).toBe('/api/gateways');
      expect(url.searchParams.get('limit')).toBe('25');
      expect(url.searchParams.get('cursor')).toBe('abc');
      expect(url.searchParams.get('status')).toBe('HEALTHY');
    });
  });

  describe('get', () => {
    it('URL-encodes the gateway id', async () => {
      const { client, calls } = makeClient();
      await new GatewaysResource(client).get('gw/with space');
      expect(calls[0].method).toBe('GET');
      expect(calls[0].path).toBe('/api/gateways/gw%2Fwith%20space');
    });

    it('throws on a blank id', async () => {
      const { client } = makeClient();
      await expect(new GatewaysResource(client).get('')).rejects.toThrow(
        /gateway id is required/
      );
    });
  });

  describe('rotate', () => {
    it('POSTs to /:id/rotate when confirm is "ROTATE"', async () => {
      const { client, calls } = makeClient();
      await new GatewaysResource(client).rotate('gw1', {
        target: 'cert',
        confirm: 'ROTATE',
      });
      expect(calls[0].method).toBe('POST');
      expect(calls[0].path).toBe('/api/gateways/gw1/rotate');
      expect(calls[0].data).toMatchObject({ target: 'cert', confirm: 'ROTATE' });
    });

    it('refuses to send without the ROTATE confirmation token', async () => {
      const { client, calls } = makeClient();
      await expect(
        new GatewaysResource(client).rotate('gw1', {
          target: 'all',
          confirm: 'nope' as never,
        })
      ).rejects.toThrow(/confirm must equal "ROTATE"/);
      expect(calls).toHaveLength(0);
    });
  });

  describe('decommission', () => {
    it('DELETEs with the confirm=DECOMMISSION guard', async () => {
      const { client, calls } = makeClient();
      await new GatewaysResource(client).decommission('gw1');
      expect(calls[0].method).toBe('DELETE');
      expect(calls[0].path).toBe('/api/gateways/gw1?confirm=DECOMMISSION');
    });

    it('throws on a blank id', async () => {
      const { client } = makeClient();
      await expect(
        new GatewaysResource(client).decommission('')
      ).rejects.toThrow(/gateway id is required/);
    });
  });
});
