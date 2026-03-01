/**
 * Utility functions for VeliKey SDK
 */
/**
 * Generate a UUID v4
 */
export declare function generateUUID(): string;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
/**
 * Validate required fields in an object
 */
export declare function validateRequired<T extends Record<string, any>>(obj: T, requiredFields: (keyof T)[]): void;
/**
 * Deep merge two objects
 */
export declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
/**
 * Format bytes to human readable string
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Format duration in milliseconds to human readable string
 */
export declare function formatDuration(ms: number): string;
/**
 * Redact sensitive information from objects for logging
 */
export declare function redactSecrets<T extends Record<string, any>>(obj: T): T;
/**
 * Create a debounced function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Create a throttled function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map