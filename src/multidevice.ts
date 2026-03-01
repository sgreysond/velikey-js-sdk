export interface RecoveryCode {
  code: string;
  createdAt: Date;
  usedAt?: Date;
}

export interface DeviceLinkRequest {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  attestation?: string;
}

export interface LinkedDevice {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  linkedAt: Date;
  lastSeen?: Date;
  mboxId?: string; // Per-device mailbox
}

export class MultiDeviceManager {
  private recoveryCode?: RecoveryCode;
  private linkedDevices: Map<string, LinkedDevice> = new Map();
  private syncMboxId?: string; // Shared sync mailbox

  /**
   * Generate a recovery code for linking new devices
   * Format: 6 groups of 4 alphanumeric chars (e.g., XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
   */
  generateRecoveryCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const groups = 6;
    const groupSize = 4;
    
    const code = Array.from({ length: groups }, () =>
      Array.from({ length: groupSize }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    ).join('-');

    this.recoveryCode = {
      code,
      createdAt: new Date(),
    };

    return code;
  }

  /**
   * Validate a recovery code
   */
  validateRecoveryCode(code: string): boolean {
    if (!this.recoveryCode) {
      return false;
    }

    // Check if code matches
    if (this.recoveryCode.code !== code) {
      return false;
    }

    // Check if already used
    if (this.recoveryCode.usedAt) {
      return false;
    }

    // Check if expired (24 hours)
    const expiryMs = 24 * 60 * 60 * 1000;
    const age = Date.now() - this.recoveryCode.createdAt.getTime();
    if (age > expiryMs) {
      return false;
    }

    return true;
  }

  /**
   * Link a new device using recovery code
   */
  linkDevice(code: string, request: DeviceLinkRequest): LinkedDevice | null {
    if (!this.validateRecoveryCode(code)) {
      return null;
    }

    // Mark recovery code as used
    this.recoveryCode!.usedAt = new Date();

    // Create linked device entry
    const device: LinkedDevice = {
      deviceId: request.deviceId,
      deviceName: request.deviceName,
      publicKey: request.publicKey,
      linkedAt: new Date(),
    };

    this.linkedDevices.set(device.deviceId, device);
    return device;
  }

  /**
   * Get all linked devices
   */
  getLinkedDevices(): LinkedDevice[] {
    return Array.from(this.linkedDevices.values());
  }

  /**
   * Remove a linked device
   */
  unlinkDevice(deviceId: string): boolean {
    return this.linkedDevices.delete(deviceId);
  }

  /**
   * Update device last seen timestamp
   */
  updateDeviceActivity(deviceId: string): void {
    const device = this.linkedDevices.get(deviceId);
    if (device) {
      device.lastSeen = new Date();
    }
  }

  /**
   * Set the shared sync mailbox ID
   */
  setSyncMailbox(mboxId: string): void {
    this.syncMboxId = mboxId;
  }

  /**
   * Get the shared sync mailbox ID
   */
  getSyncMailbox(): string | undefined {
    return this.syncMboxId;
  }

  /**
   * Set per-device mailbox ID
   */
  setDeviceMailbox(deviceId: string, mboxId: string): void {
    const device = this.linkedDevices.get(deviceId);
    if (device) {
      device.mboxId = mboxId;
    }
  }

  /**
   * Get per-device mailbox ID
   */
  getDeviceMailbox(deviceId: string): string | undefined {
    return this.linkedDevices.get(deviceId)?.mboxId;
  }

  /**
   * Export device link state for backup
   */
  exportState(): string {
    return JSON.stringify({
      recoveryCode: this.recoveryCode,
      linkedDevices: Array.from(this.linkedDevices.entries()),
      syncMboxId: this.syncMboxId,
    });
  }

  /**
   * Import device link state from backup
   */
  importState(state: string): void {
    const data = JSON.parse(state);
    
    if (data.recoveryCode) {
      this.recoveryCode = {
        ...data.recoveryCode,
        createdAt: new Date(data.recoveryCode.createdAt),
        usedAt: data.recoveryCode.usedAt ? new Date(data.recoveryCode.usedAt) : undefined,
      };
    }

    if (data.linkedDevices) {
      this.linkedDevices = new Map(
        data.linkedDevices.map(([id, device]: [string, any]) => [
          id,
          {
            ...device,
            linkedAt: new Date(device.linkedAt),
            lastSeen: device.lastSeen ? new Date(device.lastSeen) : undefined,
          },
        ])
      );
    }

    if (data.syncMboxId) {
      this.syncMboxId = data.syncMboxId;
    }
  }
}
