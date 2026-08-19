import { GraphQLError } from "graphql";

export class DomainError extends GraphQLError {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, { ...options, extensions: { code } });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
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

export class ValidationError extends DomainError {
  constructor(codeOrMessage: string, messageOrOptions?: string | ErrorOptions, options?: ErrorOptions) {
    if (typeof messageOrOptions === "string") {
      super(codeOrMessage, messageOrOptions, options);
    } else {
      super("VALIDATION", codeOrMessage, messageOrOptions);
    }
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super("CONFLICT", message, options);
  }
}

export class QuotaNotFoundError extends NotFoundError {
  constructor(message: string) {
    super("QUOTA", message);
  }
}

export class QuotaAlreadyDeletedError extends DomainError {
  constructor(message: string) {
    super("QUOTA_ALREADY_DELETED", message);
  }
}

export class QuotaLedgerError extends DomainError {
  constructor(message: string) {
    super("QUOTA_LEDGER_ERROR", message);
  }
}
