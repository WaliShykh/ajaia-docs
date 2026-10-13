/** Domain errors. Services throw these; the HTTP layer maps them to responses. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "validation_error", message);
  }
}
export class Unauthorized extends AppError {
  constructor(message = "Please sign in to continue.") {
    super(401, "unauthorized", message);
  }
}
export class Forbidden extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(403, "forbidden", message);
  }
}
export class NotFound extends AppError {
  constructor(message = "Not found.") {
    super(404, "not_found", message);
  }
}
export class Conflict extends AppError {
  constructor(message: string) {
    super(409, "conflict", message);
  }
}
export class PayloadTooLarge extends AppError {
  constructor(message: string) {
    super(413, "payload_too_large", message);
  }
}
export class UnsupportedType extends AppError {
  constructor(message: string) {
    super(415, "unsupported_type", message);
  }
}
export class RateLimited extends AppError {
  constructor(retryAfterSeconds: number) {
    super(429, "rate_limited", "Too many attempts. Please wait a few minutes and try again.", {
      "Retry-After": String(retryAfterSeconds),
    });
  }
}
