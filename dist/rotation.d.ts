export interface RotateResult {
    status: 'rotated' | 'conflict';
}
export declare class MultiDeviceRotator {
    private spoolUrl;
    private jitterMs;
    private baseBackoffMs;
    private maxAttempts;
    constructor(spoolUrl: string, opts?: {
        jitterMs?: number;
        baseBackoffMs?: number;
        maxAttempts?: number;
    });
    casRotate(mboxIdBase64: string, fromSeq?: number): Promise<RotateResult>;
    private backoffDuration;
    private sleep;
    private randomB64;
}
//# sourceMappingURL=rotation.d.ts.map