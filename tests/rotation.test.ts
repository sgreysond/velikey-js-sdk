import axios from 'axios';
import { MultiDeviceRotator } from '../src/rotation';
import { randomBytes } from 'crypto';

const SPOOL_URL = process.env.SPOOL_URL || 'http://localhost:18080';

const b64 = (buf: Buffer) => buf.toString('base64');

async function deposit(mboxId: string) {
  const req = {
    mbox_id: mboxId,
    epoch: 0,
    seq: 1,
    nonce: b64(randomBytes(16)),
    mac: b64(randomBytes(32)),
    msg_id: b64(randomBytes(16)),
    blob: b64(randomBytes(64)),
  };
  try {
    await axios.post(`${SPOOL_URL}/v1/deposit`, req);
  } catch (e: any) {
    if (e?.response?.status !== 429) {
      throw e;
    }
    // Tolerate rate limiting in constrained test env
  }
}

describe('MultiDeviceRotator', () => {
  it('rotates once and reports conflicts thereafter', async () => {
    const mboxId = b64(randomBytes(32));
    await deposit(mboxId);

    const rotator = new MultiDeviceRotator(SPOOL_URL, { maxAttempts: 1 });
    const res1 = await rotator.casRotate(mboxId, 0);
    expect(res1.status).toBe('rotated');

    const res2 = await rotator.casRotate(mboxId, 0);
    expect(res2.status).toBe('conflict');
  });
});


