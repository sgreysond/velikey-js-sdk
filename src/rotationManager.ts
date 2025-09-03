import { MultiDeviceRotator } from './rotation';

export interface RotationCadenceOptions {
  minIntervalMs?: number;
  rotateEveryNMessages?: number;
  jitterMs?: number;
}

export class RotationManager {
  private rotator: MultiDeviceRotator;
  private mboxIdBase64: string;
  private opts: Required<RotationCadenceOptions>;
  private lastRotateAt: number;
  private fetchedSinceRotate: number;

  constructor(rotator: MultiDeviceRotator, mboxIdBase64: string, opts?: RotationCadenceOptions) {
    this.rotator = rotator;
    this.mboxIdBase64 = mboxIdBase64;
    this.opts = {
      minIntervalMs: opts?.minIntervalMs ?? 10 * 60 * 1000,
      rotateEveryNMessages: opts?.rotateEveryNMessages ?? 100,
      jitterMs: opts?.jitterMs ?? 250,
    };
    this.lastRotateAt = 0;
    this.fetchedSinceRotate = 0;
  }

  async onAppOpen(): Promise<void> {
    await this.maybeRotate('open');
  }

  async onMessagesFetched(count: number): Promise<void> {
    this.fetchedSinceRotate += count;
    await this.maybeRotate('fetch');
  }

  private async maybeRotate(reason: 'open' | 'fetch'): Promise<void> {
    const now = Date.now();
    const jitter = Math.floor(Math.random() * this.opts.jitterMs);

    const intervalOk = now - this.lastRotateAt >= this.opts.minIntervalMs + jitter;
    const volumeOk = this.fetchedSinceRotate >= this.opts.rotateEveryNMessages;

    if (!intervalOk && !volumeOk) return;

    const res = await this.rotator.casRotate(this.mboxIdBase64, 0);
    if (res.status === 'rotated') {
      this.lastRotateAt = Date.now();
      this.fetchedSinceRotate = 0;
    }
  }
}


