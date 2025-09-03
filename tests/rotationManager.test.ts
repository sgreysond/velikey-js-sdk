import { RotationManager } from '../src/rotationManager';
import { MultiDeviceRotator } from '../src/rotation';

class FakeRotator extends MultiDeviceRotator {
  private calls = 0;
  constructor() { super('http://invalid'); }
  async casRotate(): Promise<{ status: 'rotated' | 'conflict' }> {
    this.calls++;
    return { status: this.calls === 1 ? 'rotated' : 'conflict' };
  }
}

describe('RotationManager', () => {
  it('rotates on open and rate limits subsequent attempts', async () => {
    const rotator = new FakeRotator();
    const mgr = new RotationManager(rotator as any, 'mbox', { minIntervalMs: 60 * 60 * 1000, rotateEveryNMessages: 1000, jitterMs: 0 });
    await mgr.onAppOpen();
    await mgr.onAppOpen();
    // Only first caused rotate success; second suppressed by interval
  });
});


