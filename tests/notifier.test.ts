import { NotifierClient } from '../src';
import axios from 'axios';

const NOTIFIER_URL = process.env.NOTIFIER_URL || 'http://localhost:18082';
const SPOOL_URL = process.env.SPOOL_URL || 'http://localhost:18080';

describe('NotifierClient', () => {
  it('registers, issues, and attaches notify descriptor', async () => {
    const wa = Math.random().toString(16).slice(2);
    const client = new NotifierClient(NOTIFIER_URL, { spoolUrl: SPOOL_URL });

    await client.register({ wa, push_token: 'debug-token', expiry_sec: 60 });
    const tokens = await client.issue({ wa, count: 2, ttl_sec: 60 });

    expect(tokens.length).toBeGreaterThanOrEqual(1);

    const descriptor = {
      mbox_id: Buffer.from('mbox_js_sdk').toString('base64'),
      epoch: 0,
      notify: {
        wa,
        tokens,
        coalesce_window_ms: 1000,
      },
    };

    await client.attachNotify(descriptor);

    // Validate spool accepted mapping by depositing once
    const req = {
      mbox_id: descriptor.mbox_id,
      epoch: 0,
      seq: 1,
      nonce: Buffer.from('nonce').toString('base64'),
      mac: Buffer.from('mac').toString('base64'),
      msg_id: Buffer.from('msgid').toString('base64'),
      blob: Buffer.from('payload').toString('base64'),
    };

    const resp = await axios.post(`${SPOOL_URL}/v1/deposit`, req);
    expect(resp.status).toBe(200);
    expect(resp.data.status).toBe('ACCEPTED');
  });
});


