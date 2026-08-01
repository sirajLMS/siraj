export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, message: string, options?: ErrorOptions) {
    super(`${entity}_NOT_FOUND`, message, options);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super("UNAUTHORIZED", message, options);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super("FORBIDDEN", message, options);
  }
}

export class QuotaNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaNotFoundError";
  }
}

export class QuotaAlreadyDeletedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaAlreadyDeletedError";
  }
}

export class QuotaLedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaLedgerError";
  }
}
