import { GraphQLError } from "graphql";
import { DATABASE_UNAVAILABLE_DIGEST } from "@/shared/constants";

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

/** Machine-readable domain code for sends against an offboarded WhatsApp account. */
export const WHATSAPP_ACCOUNT_OFFBOARDED_CODE = "whatsapp.accountOffboarded";

/**
 * Thrown when a WhatsApp send targets an account that has been offboarded
 * (`offboardedAt` set). The channel adapter raises this before any Graph API
 * call so offboarded numbers fail fast instead of burning Meta retries.
 */
export class WhatsappAccountOffboardedError extends DomainError {
  constructor(message = "WhatsApp account is offboarded", options?: ErrorOptions) {
    super(WHATSAPP_ACCOUNT_OFFBOARDED_CODE, message, options);
  }
}

/** Machine-readable domain code when no active WhatsApp account can serve a routing purpose. */
export const WHATSAPP_NO_SENDER_FOR_PURPOSE_CODE = "whatsapp.noSenderForPurpose";

/**
 * Raised at dispatch time when neither the purpose-matched account nor the
 * GENERAL fallback is active, so the send fails before any Graph API call or
 * delivery row is created.
 */
export class WhatsappNoSenderForPurposeError extends DomainError {
  constructor(message = "No active WhatsApp sender account for this purpose", options?: ErrorOptions) {
    super(WHATSAPP_NO_SENDER_FOR_PURPOSE_CODE, message, options);
  }
}

/** Machine-readable domain code for a failed WhatsApp Embedded Signup completion. */
const WHATSAPP_EMBEDDED_SIGNUP_FAILED_CODE = "whatsapp.embeddedSignupFailed";

/**
 * Thrown when Embedded Signup completion fails at any server-side step:
 * authorization-code exchange, phone-number resolution, coexistence
 * confirmation (`is_on_biz_app && platform_type === "CLOUD_API"`), or account
 * persistence. Clients map `extensions.code` to localized onboarding copy.
 */
export class WhatsappEmbeddedSignupError extends DomainError {
  constructor(message = "WhatsApp embedded signup failed", options?: ErrorOptions) {
    super(WHATSAPP_EMBEDDED_SIGNUP_FAILED_CODE, message, options);
  }
}

/** Machine-readable domain code for assigning a routing purpose to an inactive account. */
const WHATSAPP_PURPOSE_REQUIRES_ACTIVE_CODE = "whatsapp.purposeRequiresActive";

/**
 * Thrown when a purpose is (re)assigned to a WhatsApp account that is not
 * active. Routing only considers active accounts, so purpose assignment on an
 * inactive row would silently misroute — the write is rejected instead.
 */
export class WhatsappPurposeRequiresActiveError extends DomainError {
  constructor(message = "Only active WhatsApp accounts can be assigned a purpose", options?: ErrorOptions) {
    super(WHATSAPP_PURPOSE_REQUIRES_ACTIVE_CODE, message, options);
  }
}

/**
 * DatabaseUnavailableError — thrown when the database is unreachable and all
 * bounded retries are exhausted (connection refused/reset/timeout, terminated
 * connections, pool exhaustion).
 *
 * The `digest` sentinel survives Next.js production error serialization into
 * client error boundaries (`app/error.tsx`), letting the UI render a
 * translated "temporarily unavailable" page instead of a generic failure —
 * without leaking any error details to the browser.
 *
 * In GraphQL resolvers it surfaces as `extensions.code === "DATABASE_UNAVAILABLE"`.
 */
export class DatabaseUnavailableError extends DomainError {
  public readonly digest: string;

  constructor(message = "Database temporarily unavailable", options?: ErrorOptions) {
    super("DATABASE_UNAVAILABLE", message, options);
    this.digest = DATABASE_UNAVAILABLE_DIGEST;
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
