import { MultiDeviceRotator } from './rotation';
export interface RotationCadenceOptions {
    minIntervalMs?: number;
    rotateEveryNMessages?: number;
    jitterMs?: number;
}
export declare class RotationManager {
    private rotator;
    private mboxIdBase64;
    private opts;
    private lastRotateAt;
    private fetchedSinceRotate;
    constructor(rotator: MultiDeviceRotator, mboxIdBase64: string, opts?: RotationCadenceOptions);
    onAppOpen(): Promise<void>;
    onMessagesFetched(count: number): Promise<void>;
    private maybeRotate;
}
//# sourceMappingURL=rotationManager.d.ts.map