import type * as Types from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Canonical description of a convenience audit log entry, before it is
 * normalized into a `CreateAuditLogInput` (actor type resolution, change
 * computation).
 */
export interface TypedAuditLogInput {
  actorUserId: string | null;
  entityType: Types.AuditEntityType;
  entityId: string;
  action: Types.AuditAction;
  description?: string | null;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Input for a state-transition log: a typed log entry whose `changes` are
 * derived from the previous/new state rather than supplied by the caller.
 */
export type StateTransitionInput = Omit<TypedAuditLogInput, "changes"> & {
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
};

/**
 * Input for logging a change to a single field.
 */
export interface SingleFieldChangeInput {
  actorUserId: string | null;
  entityType: Types.AuditEntityType;
  entityId: string;
  action: Types.AuditAction;
  description: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  metadata?: Record<string, unknown> | null;
}

/** Student status change log input */
export interface StudentStatusChangeInput {
  studentId: string;
  oldStatus: string;
  newStatus: string;
  actorUserId: string | null;
  description?: string;
}

/** Invoice change log input */
export interface InvoiceChangeInput {
  invoiceId: string;
  action: Types.AuditAction;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  actorUserId: string | null;
  description?: string;
}

/** Payment refund log input */
export interface PaymentRefundInput {
  paymentId: string;
  refundAmount: number;
  currency: CurrencyCode;
  actorUserId: string | null;
  reason?: string;
}

/** Permission change log input */
export interface PermissionChangeInput {
  userId: string;
  action: "GRANT" | "REVOKE";
  permissionOrGroupId: string;
  permissionType: "PERMISSION" | "PERMISSION_GROUP";
  actorUserId: string | null;
  description?: string;
}

/** Exchange rate update log input */
export interface ExchangeRateUpdateInput {
  rateId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  oldRate: number | null;
  newRate: number;
  actorUserId: string | null;
  source?: string;
}

/** System setting change log input */
export interface SystemSettingChangeInput {
  settingKey: string;
  oldValue: unknown;
  newValue: unknown;
  actorUserId: string | null;
  description?: string;
}

/**
 * Helper function to compute changes between old and new state.
 */
export function computeAuditChanges(
  previousState: Record<string, unknown> | null,
  newState: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!previousState || !newState) return null;

  const changes: Record<string, unknown> = {};

  for (const key in newState) {
    if (previousState[key] !== newState[key]) {
      changes[key] = { from: previousState[key], to: newState[key] };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Resolves the actor type from the actor id and normalizes a typed log entry
 * into the repository's create input.
 */
export function buildTypedAuditLogInput(input: TypedAuditLogInput): Types.CreateAuditLogInput {
  return {
    ...input,
    actorType: input.actorUserId ? "USER" : "SYSTEM",
  };
}

/**
 * Builds a create input for a state transition, deriving `changes` from the
 * previous/new state.
 */
export function buildStateTransitionInput(input: StateTransitionInput): Types.CreateAuditLogInput {
  return buildTypedAuditLogInput({
    ...input,
    changes: computeAuditChanges(input.previousState, input.newState),
  });
}

/**
 * Builds a create input for a single-field change by wrapping the field's
 * old/new values into previous/new state.
 */
export function buildSingleFieldChangeInput(input: SingleFieldChangeInput): Types.CreateAuditLogInput {
  return buildStateTransitionInput({
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    description: input.description,
    previousState: { [input.field]: input.oldValue },
    newState: { [input.field]: input.newValue },
    metadata: input.metadata,
  });
}
