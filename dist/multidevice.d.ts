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
    mboxId?: string;
}
export declare class MultiDeviceManager {
    private recoveryCode?;
    private linkedDevices;
    private syncMboxId?;
    /**
     * Generate a recovery code for linking new devices
     * Format: 6 groups of 4 alphanumeric chars (e.g., XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
     */
    generateRecoveryCode(): string;
    /**
     * Validate a recovery code
     */
    validateRecoveryCode(code: string): boolean;
    /**
     * Link a new device using recovery code
     */
    linkDevice(code: string, request: DeviceLinkRequest): LinkedDevice | null;
    /**
     * Get all linked devices
     */
    getLinkedDevices(): LinkedDevice[];
    /**
     * Remove a linked device
     */
    unlinkDevice(deviceId: string): boolean;
    /**
     * Update device last seen timestamp
     */
    updateDeviceActivity(deviceId: string): void;
    /**
     * Set the shared sync mailbox ID
     */
    setSyncMailbox(mboxId: string): void;
    /**
     * Get the shared sync mailbox ID
     */
    getSyncMailbox(): string | undefined;
    /**
     * Set per-device mailbox ID
     */
    setDeviceMailbox(deviceId: string, mboxId: string): void;
    /**
     * Get per-device mailbox ID
     */
    getDeviceMailbox(deviceId: string): string | undefined;
    /**
     * Export device link state for backup
     */
    exportState(): string;
    /**
     * Import device link state from backup
     */
    importState(state: string): void;
}
//# sourceMappingURL=multidevice.d.ts.map