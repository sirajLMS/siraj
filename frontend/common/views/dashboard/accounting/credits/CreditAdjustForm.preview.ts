import { useUserAutocompleteStore } from "@/frontend/common/stores/userAutocompleteStore";
import type {
  BalancePreview,
  BalancePreviewSource,
  CreditAdjustDraft,
  CreditAdjustmentLabelsForSuccess,
  CreditAdjustmentLabelsForSummary,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";
import { CreditAdjustmentType } from "@/shared/constants/billing";

/** Hours must be a positive whole number before any balance math is meaningful. */
function isValidHours(hours: number | null): hours is number {
  return hours !== null && Number.isInteger(hours) && hours >= 1;
}

/** Resulting `classesRemaining`: Add grows the balance; Subtract and Carryover deduct from it. */
function remainingAfterAdjustment(
  adjustmentType: CreditAdjustmentType,
  classesRemaining: number,
  hours: number
): number {
  return adjustmentType === CreditAdjustmentType.ADD ? classesRemaining + hours : classesRemaining - hours;
}

export function computeBalancePreview(
  row: BalancePreviewSource | null,
  adjustmentType: CreditAdjustmentType,
  hours: number | null
): BalancePreview | null {
  const remaining = row?.classesRemaining;
  if (remaining === null || remaining === undefined || !isValidHours(hours)) return null;
  return { from: remaining, to: remainingAfterAdjustment(adjustmentType, remaining, hours) };
}

/**
 * Resolves the carryover teacher's display name from the person-picker result
 * cache (the picker caches every fetched options page per search key). The
 * store keeps only the teacher id for serializability; the name is needed only
 * for the success message.
 */
function resolveTeacherDisplayName(teacherId: string | null): string | null {
  if (teacherId === null) return null;
  const buckets = useUserAutocompleteStore.getState().byAudience.teacher;
  for (const cached of Object.values(buckets)) {
    const hit = cached.options.find(option => option.id === teacherId);
    if (hit) return hit.name;
  }
  return null;
}

export function buildSuccessMessage(labels: CreditAdjustmentLabelsForSuccess, draft: CreditAdjustDraft): string {
  const hours = draft.hours ?? 0;
  if (draft.adjustmentType === CreditAdjustmentType.ADD) return labels.success.added(hours);
  const teacherName = resolveTeacherDisplayName(draft.carryoverTeacherId);
  if (draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER && teacherName !== null) {
    return labels.success.carryover(hours, teacherName);
  }
  return labels.success.subtracted(hours);
}

/**
 * Human-readable recap of the pending operation for the pre-submit summary
 * strip. Incomplete carryover metadata (teacher/date still being picked) falls
 * back to the plain deduction wording; returns null while hours is not a
 * valid positive integer.
 */
export function buildSummaryText(
  labels: CreditAdjustmentLabelsForSummary,
  draft: CreditAdjustDraft,
  studentName: string
): string | null {
  if (!isValidHours(draft.hours)) return null;
  if (draft.adjustmentType === CreditAdjustmentType.ADD) return labels.summary.add(draft.hours, studentName);
  if (draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) {
    const teacherName = resolveTeacherDisplayName(draft.carryoverTeacherId);
    if (teacherName !== null && draft.paymentDate !== null) {
      return labels.summary.carryover(draft.hours, teacherName, draft.paymentDate);
    }
  }
  return labels.summary.subtract(draft.hours, studentName);
}
