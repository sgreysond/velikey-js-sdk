/**
 * VeliKey SDK Error Classes
 */
export declare class VeliKeyError extends Error {
    readonly code?: string;
    readonly statusCode?: number;
    readonly hint?: string;
    readonly nextCall?: string;
    constructor(message: string, code?: string, statusCode?: number, hint?: string, nextCall?: string);
    toJSON(): {
        name: string;
        message: string;
        code: string | undefined;
        statusCode: number | undefined;
        hint: string | undefined;
        nextCall: string | undefined;
        stack: string | undefined;
    };
}
export declare class AuthenticationError extends VeliKeyError {
    constructor(message: string, hint?: string);
}
export declare class ValidationError extends VeliKeyError {
    constructor(message: string, hint?: string, nextCall?: string);
}
export declare class NotFoundError extends VeliKeyError {
    constructor(resource: string, id?: string);
}
export declare class RateLimitError extends VeliKeyError {
    readonly retryAfter?: number;
    constructor(message: string, retryAfter?: number);
}
export declare class PolicyConflictError extends VeliKeyError {
    constructor(message: string, hint?: string);
}
export declare class ThresholdBreachError extends VeliKeyError {
    constructor(message: string, hint?: string);
}
export declare class DowngradeDetectedError extends VeliKeyError {
    constructor(message: string);
}
export declare class NoCapabilityError extends VeliKeyError {
    constructor(capability: string, hint?: string);
}
export declare class IdempotencyReplayError extends VeliKeyError {
    constructor(key: string);
}
export declare class TransientError extends VeliKeyError {
    constructor(message: string, hint?: string);
}
export declare class UnsupportedOperationError extends VeliKeyError {
    constructor(method: string, routeHint?: string);
}
/**
 * Factory function to create appropriate error from API response
 */
export declare function createErrorFromResponse(response: any, statusCode?: number): VeliKeyError;
//# sourceMappingURL=errors.d.ts.map