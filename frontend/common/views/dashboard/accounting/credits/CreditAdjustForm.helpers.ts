import { addDays } from "date-fns";
import { formatDateInput } from "@/frontend/common/components/intl/dateFormat";
import {
  CreditAdjustmentType as CreditAdjustmentGqlType,
  type CreditAdjustmentInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CarryoverBannerErrors } from "@/frontend/common/views/dashboard/accounting/credits/CarryoverBanner";
import type {
  CreditAdjustDraft,
  CreditAdjustFieldErrors,
  CreditAdjustValidationCopy,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";
import { PAYMENT_DATE_MAX_FUTURE_DAYS } from "@/frontend/common/views/dashboard/accounting/credits/creditAdjust.constants";
import { CreditAdjustmentType } from "@/shared/constants/billing";

export const INSUFFICIENT_CLASSES_CODE = "INSUFFICIENT_CLASSES";
export const CREDITS_LIST_HREF = "/accounting/credits";
/** Mirrors the server-side internal-notes cap (`INTERNAL_NOTES_MAX_LENGTH`). */
export const INTERNAL_NOTES_MAX_LENGTH = 2000;

/** Maps the shared cross-layer enum to the GraphQL mutation enum (same string values, distinct types). */
const ADJUSTMENT_TYPE_TO_GQL: Record<CreditAdjustmentType, CreditAdjustmentGqlType> = {
  [CreditAdjustmentType.ADD]: CreditAdjustmentGqlType.Add,
  [CreditAdjustmentType.SUBTRACT]: CreditAdjustmentGqlType.Subtract,
  [CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER]: CreditAdjustmentGqlType.SubtractWithCarryover,
};

const HTML_TAG_PATTERN = /<[^<>]*>/g;

/**
 * Rich-text emptiness probe for the required Reason field: a lone space in the
 * editor reaches store state as `"<p> </p>"` / `"<p>&nbsp;</p>"`, so a plain
 * `.trim()` always sees markup instead of the empty content. Strip tags and
 * decoding the non-breaking-space entity restores the whitespace-only signal.
 */
function hasReasonText(html: string): boolean {
  return html.replace(HTML_TAG_PATTERN, "").replaceAll("&nbsp;", " ").trim() !== "";
}

export function omitFieldError(
  errors: CreditAdjustFieldErrors,
  field: keyof CreditAdjustFieldErrors
): CreditAdjustFieldErrors {
  const { [field]: _omitted, ...rest } = errors;
  return rest;
}

/** ISO `YYYY-MM-DD` strings compare lexicographically, so range checks are plain string comparisons. */
function isRangeInverted(fromDate: string | null, toDate: string | null): boolean {
  return fromDate !== null && toDate !== null && fromDate > toDate;
}

function isPaymentDateTooFar(paymentDate: string | null): boolean {
  if (paymentDate === null) return false;
  return paymentDate > formatDateInput(addDays(new Date(), PAYMENT_DATE_MAX_FUTURE_DAYS));
}

/**
 * Client mirror of the server-side adjustment rules (hours ≥ 1 integer, reason
 * required, carryover fields required on the carryover path with both date
 * fences). Returns `null` when the draft is submittable.
 */
function validateCarryoverDraft(
  draft: CreditAdjustDraft,
  copy: CreditAdjustValidationCopy
): CarryoverBannerErrors | undefined {
  const carryover: {
    teacher?: string;
    fromDate?: string;
    toDate?: string;
    paymentDate?: string;
  } = {};
  if (draft.carryoverTeacherId === null) carryover.teacher = copy.required;
  if (draft.fromDate === null) carryover.fromDate = copy.required;
  if (draft.toDate === null) carryover.toDate = copy.required;
  if (draft.paymentDate === null) carryover.paymentDate = copy.required;
  if (isRangeInverted(draft.fromDate, draft.toDate)) {
    carryover.fromDate = copy.fromAfterTo;
    carryover.toDate = copy.fromAfterTo;
  }
  if (isPaymentDateTooFar(draft.paymentDate)) carryover.paymentDate = copy.paymentTooFar;
  return Object.keys(carryover).length === 0 ? undefined : carryover;
}

export function validateCreditAdjustDraft(
  draft: CreditAdjustDraft,
  copy: CreditAdjustValidationCopy
): CreditAdjustFieldErrors | null {
  const errors: {
    student?: string;
    hours?: string;
    notes?: string;
    carryover?: CarryoverBannerErrors;
  } = {};
  if (draft.studentId === null) errors.student = copy.required;
  if (draft.hours === null || !Number.isInteger(draft.hours) || draft.hours < 1) errors.hours = copy.hoursPositive;
  if (!hasReasonText(draft.notes)) errors.notes = copy.required;
  if (draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) {
    const carryover = validateCarryoverDraft(draft, copy);
    if (carryover) errors.carryover = carryover;
  }
  return Object.keys(errors).length === 0 ? null : errors;
}

export function buildValidationCopy(
  required: string,
  validation: { readonly hoursPositive: string; readonly fromAfterTo: string; readonly paymentTooFar: string }
): CreditAdjustValidationCopy {
  return {
    required,
    hoursPositive: validation.hoursPositive,
    fromAfterTo: validation.fromAfterTo,
    paymentTooFar: validation.paymentTooFar,
  };
}

export function resolveCarryoverErrors(
  fieldErrors: CreditAdjustFieldErrors,
  draft: CreditAdjustDraft,
  copy: CreditAdjustValidationCopy
): CarryoverBannerErrors | undefined {
  if (fieldErrors.carryover === undefined) return undefined;
  if (draft.adjustmentType !== CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) return undefined;
  return validateCarryoverDraft(draft, copy);
}

export function buildAdjustmentInput(draft: CreditAdjustDraft): CreditAdjustmentInput {
  const isCarryover = draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  const internalNotes = draft.internalNotes.trim();
  return {
    studentId: draft.studentId ?? "",
    adjustmentType: ADJUSTMENT_TYPE_TO_GQL[draft.adjustmentType],
    hours: draft.hours ?? 0,
    notes: draft.notes,
    // Omitted (undefined) when blank so an untouched note never reaches the wire.
    internalNotes: internalNotes === "" ? undefined : internalNotes,
    carryoverTeacherId: isCarryover ? draft.carryoverTeacherId : null,
    carryoverFromDate: isCarryover ? draft.fromDate : null,
    carryoverToDate: isCarryover ? draft.toDate : null,
    carryoverPaymentDate: isCarryover ? draft.paymentDate : null,
  };
}

export { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/frontend/common/views/dashboard/accounting/__shared__";
