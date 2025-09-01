/**
 * VeliKey SDK Error Classes
 */

export class VeliKeyError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly hint?: string;
  public readonly nextCall?: string;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    hint?: string,
    nextCall?: string
  ) {
    super(message);
    this.name = 'VeliKeyError';
    this.code = code;
    this.statusCode = statusCode;
    this.hint = hint;
    this.nextCall = nextCall;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VeliKeyError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      hint: this.hint,
      nextCall: this.nextCall,
      stack: this.stack,
    };
  }
}

export class AuthenticationError extends VeliKeyError {
  constructor(message: string, hint?: string) {
    super(message, 'UNAUTHORIZED', 401, hint);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends VeliKeyError {
  constructor(message: string, hint?: string, nextCall?: string) {
    super(message, 'INVALID_SCHEMA', 400, hint, nextCall);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends VeliKeyError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends VeliKeyError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class PolicyConflictError extends VeliKeyError {
  constructor(message: string, hint?: string) {
    super(message, 'POLICY_CONFLICT', 409, hint, 'GET /policies/precedence?explain=true');
    this.name = 'PolicyConflictError';
  }
}

export class ThresholdBreachError extends VeliKeyError {
  constructor(message: string, hint?: string) {
    super(message, 'THRESHOLD_BREACH', 409, hint);
    this.name = 'ThresholdBreachError';
  }
}

export class DowngradeDetectedError extends VeliKeyError {
  constructor(message: string) {
    super(message, 'DOWNGRADE_DETECTED', 403);
    this.name = 'DowngradeDetectedError';
  }
}

export class NoCapabilityError extends VeliKeyError {
  constructor(capability: string, hint?: string) {
    super(`Required capability not available: ${capability}`, 'NO_CAPABILITY', 422, hint);
    this.name = 'NoCapabilityError';
  }
}

export class IdempotencyReplayError extends VeliKeyError {
  constructor(key: string) {
    super(`Operation already completed with idempotency key: ${key}`, 'IDEMPOTENCY_REPLAY', 409);
    this.name = 'IdempotencyReplayError';
  }
}

export class TransientError extends VeliKeyError {
  constructor(message: string, hint?: string) {
    super(message, 'TRANSIENT', 503, hint);
    this.name = 'TransientError';
  }
}

/**
 * Factory function to create appropriate error from API response
 */
export function createErrorFromResponse(response: any, statusCode?: number): VeliKeyError {
  const error = response.error || response;
  const code = error.code || 'UNKNOWN';
  const message = error.human || error.message || 'Unknown error occurred';
  const hint = error.hint;
  const nextCall = error.next_call;

  switch (code) {
    case 'UNAUTHORIZED':
      return new AuthenticationError(message, hint);
    case 'INVALID_SCHEMA':
      return new ValidationError(message, hint, nextCall);
    case 'NOT_FOUND':
      return new NotFoundError(message);
    case 'RATE_LIMIT':
      return new RateLimitError(message);
    case 'POLICY_CONFLICT':
      return new PolicyConflictError(message, hint);
    case 'THRESHOLD_BREACH':
      return new ThresholdBreachError(message, hint);
    case 'DOWNGRADE_DETECTED':
      return new DowngradeDetectedError(message);
    case 'NO_CAPABILITY':
      return new NoCapabilityError(message, hint);
    case 'IDEMPOTENCY_REPLAY':
      return new IdempotencyReplayError(message);
    case 'TRANSIENT':
      return new TransientError(message, hint);
    default:
      return new VeliKeyError(message, code, statusCode, hint, nextCall);
  }
}
