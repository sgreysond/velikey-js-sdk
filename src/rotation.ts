import axios from 'axios';

export interface RotateResult {
  status: 'rotated' | 'conflict';
}

export class MultiDeviceRotator {
  private spoolUrl: string;
  private jitterMs: number;
  private baseBackoffMs: number;
  private maxAttempts: number;

  constructor(spoolUrl: string, opts?: { jitterMs?: number; baseBackoffMs?: number; maxAttempts?: number }) {
    this.spoolUrl = spoolUrl;
    this.jitterMs = opts?.jitterMs ?? 50;
    this.baseBackoffMs = opts?.baseBackoffMs ?? 200;
    this.maxAttempts = opts?.maxAttempts ?? 3;
  }

  async casRotate(mboxIdBase64: string, fromSeq: number = 0): Promise<RotateResult> {
    const url = `${this.spoolUrl}/v1/cas-rotate`;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        const res = await axios.post(url, {
          mbox_id_old: mboxIdBase64,
          from_seq: fromSeq,
          r_cap: this.randomB64(48),
        }, { timeout: 3000 });
        if (res.status === 200) return { status: 'rotated' };
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          return { status: 'conflict' };
        }
        // transient error: backoff and retry
        await this.sleep(this.backoffDuration(attempt));
        continue;
      }
    }
    // If we exhausted without explicit conflict or success, treat as conflict (someone else likely rotated)
    return { status: 'conflict' };
  }

  private backoffDuration(attempt: number): number {
    const exp = this.baseBackoffMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * this.jitterMs);
    return exp + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private randomB64(bytes: number): string {
    const buf = Buffer.allocUnsafe(bytes);
    for (let i = 0; i < bytes; i++) buf[i] = Math.floor(Math.random() * 256);
    return buf.toString('base64');
  }
}


