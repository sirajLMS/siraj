"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { addDays } from "date-fns";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { formatDateInput } from "@/frontend/common/components/intl/dateFormat";
import { BaseAvatar } from "@/frontend/common/components/ui/avatar";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import { RichTextEditor } from "@/frontend/common/components/ui/input";
import { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import {
  CreditAdjustmentType as CreditAdjustmentGqlType,
  type CreditAdjustmentInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { recordCreditAdjustmentMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { useUserAutocompleteStore } from "@/frontend/common/stores/userAutocompleteStore";
import { AdjustmentTypeRadioGroup } from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup";
import {
  CarryoverBanner,
  type CarryoverBannerErrors,
} from "@/frontend/common/views/dashboard/accounting/credits/CarryoverBanner";
import { PAYMENT_DATE_MAX_FUTURE_DAYS } from "@/frontend/common/views/dashboard/accounting/credits/creditAdjust.constants";
import { CreditAdjustmentType } from "@/shared/constants/billing";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";

export interface CreditAdjustFormProps {
  /** Student pre-selected through the credits list deep link (`?studentId=`). */
  readonly studentId: string | null;
}

interface CreditAdjustFieldErrors {
  readonly student?: string;
  readonly hours?: string;
  readonly notes?: string;
  readonly carryover?: CarryoverBannerErrors;
}

interface CreditAdjustDraft {
  readonly studentId: string | null;
  readonly adjustmentType: CreditAdjustmentType;
  readonly hours: number | null;
  readonly notes: string;
  readonly carryoverTeacherId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly paymentDate: string | null;
}

/** Copy slice the validator needs; assembled from the credit-adjustment and user-select namespaces. */
interface CreditAdjustValidationCopy {
  readonly required: string;
  readonly hoursPositive: string;
  readonly fromAfterTo: string;
  readonly paymentTooFar: string;
}

/** Maps the shared cross-layer enum to the GraphQL mutation enum (same string values, distinct types). */
const ADJUSTMENT_TYPE_TO_GQL: Record<CreditAdjustmentType, CreditAdjustmentGqlType> = {
  [CreditAdjustmentType.ADD]: CreditAdjustmentGqlType.Add,
  [CreditAdjustmentType.SUBTRACT]: CreditAdjustmentGqlType.Subtract,
  [CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER]: CreditAdjustmentGqlType.SubtractWithCarryover,
};

const INSUFFICIENT_CLASSES_CODE = "INSUFFICIENT_CLASSES";
const CREDITS_LIST_HREF = "/accounting/credits";

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

function omitFieldError(
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

function validateCreditAdjustDraft(
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

function buildAdjustmentInput(draft: CreditAdjustDraft): CreditAdjustmentInput {
  const isCarryover = draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  return {
    studentId: draft.studentId ?? "",
    adjustmentType: ADJUSTMENT_TYPE_TO_GQL[draft.adjustmentType],
    hours: draft.hours ?? 0,
    notes: draft.notes,
    carryoverTeacherId: isCarryover ? draft.carryoverTeacherId : null,
    carryoverFromDate: isCarryover ? draft.fromDate : null,
    carryoverToDate: isCarryover ? draft.toDate : null,
    carryoverPaymentDate: isCarryover ? draft.paymentDate : null,
  };
}

function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Service-level domain errors reach the client with an already-localized
 * message; surface it directly when present.
 */
function getGraphQLErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? null;
  if (error instanceof Error && error.message !== "") return error.message;
  return null;
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

interface CreditAdjustmentLabelsForSuccess {
  readonly success: {
    readonly added: (hours: number) => string;
    readonly subtracted: (hours: number) => string;
    readonly carryover: (hours: number, teacher: string) => string;
  };
}

function buildSuccessMessage(labels: CreditAdjustmentLabelsForSuccess, draft: CreditAdjustDraft): string {
  const hours = draft.hours ?? 0;
  if (draft.adjustmentType === CreditAdjustmentType.ADD) return labels.success.added(hours);
  const teacherName = resolveTeacherDisplayName(draft.carryoverTeacherId);
  if (draft.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER && teacherName !== null) {
    return labels.success.carryover(hours, teacherName);
  }
  return labels.success.subtracted(hours);
}

export function CreditAdjustForm({ studentId: preselectedStudentId }: Readonly<CreditAdjustFormProps>) {
  const t = useAppTranslation(DashboardBillingCreditAdjustment);
  const common = useAppTranslation(Translation.Common);
  const userSelect = useAppTranslation(Translation.Ui.UserSelect);
  const router = useRouter();
  const notifications = useNotifications();
  const client = useApolloClient();

  const adjustmentType = useCreditAdjustFormStore(state => state.adjustmentType);
  const storeStudentId = useCreditAdjustFormStore(state => state.studentId);
  const hours = useCreditAdjustFormStore(state => state.hours);
  const notes = useCreditAdjustFormStore(state => state.notes);
  const carryoverTeacherId = useCreditAdjustFormStore(state => state.carryoverTeacherId);
  const fromDate = useCreditAdjustFormStore(state => state.fromDate);
  const toDate = useCreditAdjustFormStore(state => state.toDate);
  const paymentDate = useCreditAdjustFormStore(state => state.paymentDate);
  const clientRequestId = useCreditAdjustFormStore(state => state.clientRequestId);
  const setStudentId = useCreditAdjustFormStore(state => state.setStudentId);
  const setHours = useCreditAdjustFormStore(state => state.setHours);
  const setNotes = useCreditAdjustFormStore(state => state.setNotes);
  const regenerateClientRequestId = useCreditAdjustFormStore(state => state.regenerateClientRequestId);
  const reset = useCreditAdjustFormStore(state => state.reset);

  // The picker renders full person records while the store keeps only the id.
  const [student, setStudent] = useState<PersonOption | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreditAdjustFieldErrors>({});
  // One submission per form session: the guard token is regenerated on mount
  // and on reset, so a re-mounted form can always submit again.
  const submittedTokenRef = useRef<string | null>(null);

  const [recordAdjustment, { loading: submitting }] = useMutation(recordCreditAdjustmentMutationDocument, {
    // Match the production client default: domain errors reject with
    // CombinedGraphQLErrors carrying `extensions.code` instead of resolving.
    errorPolicy: "none",
  });

  // Resolve the display record for a deep-linked student so the picker shows
  // a name instead of a bare id. A manual re-pick wins over a late response:
  // the derived option is used only while the picked list value is absent and
  // the store id still matches the fetched row.
  const { data: preselectedData } = useQuery(studentByIdQueryDocument, {
    variables: { studentId: preselectedStudentId ?? "" },
    skip: preselectedStudentId === null,
  });

  // Every mount starts a fresh form session: new guard token, deep-linked
  // student seeded into the store. Unmounting restores the pristine form so a
  // later visit never inherits stale values.
  useEffect(() => {
    regenerateClientRequestId();
    if (preselectedStudentId !== null) setStudentId(preselectedStudentId);
    return () => {
      reset();
    };
  }, [preselectedStudentId, regenerateClientRequestId, setStudentId, reset]);

  const preselectedRow = preselectedData?.studentById;
  const displayedStudent: PersonOption | null =
    student ??
    (preselectedRow?.id && preselectedRow.name && preselectedRow.id === storeStudentId
      ? { id: preselectedRow.id, name: preselectedRow.name, avatarUrl: preselectedRow.avatarUrl }
      : null);
  // The picker edits free text while browsing, so a deep-linked student is
  // also surfaced as a read-only summary with the current balance (mirrors the
  // credits list presentation).
  const preselectedSummary = preselectedRow?.id === storeStudentId && preselectedRow.name ? preselectedRow : null;

  // Carryover error highlights are re-derived from the live draft each render:
  // once a failed submit has flagged the section, fixing a field lifts its
  // error immediately instead of waiting for the next submit.
  const draft: CreditAdjustDraft = {
    studentId: storeStudentId,
    adjustmentType,
    hours,
    notes,
    carryoverTeacherId,
    fromDate,
    toDate,
    paymentDate,
  };
  const validationCopy: CreditAdjustValidationCopy = {
    required: userSelect.required,
    hoursPositive: t.validation.hoursPositive,
    fromAfterTo: t.validation.fromAfterTo,
    paymentTooFar: t.validation.paymentTooFar,
  };
  const isCarryover = adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  const carryoverErrors =
    fieldErrors.carryover === undefined || !isCarryover ? undefined : validateCarryoverDraft(draft, validationCopy);

  const handleStudentChange = (next: PersonOption | null) => {
    setStudent(next);
    setStudentId(next?.id ?? null);
    setFieldErrors(previous => omitFieldError(previous, "student"));
  };

  const handleHoursChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setHours(raw === "" ? null : Number(raw));
    setFieldErrors(previous => omitFieldError(previous, "hours"));
  };

  const handleNotesChange = (html: string) => {
    setNotes(html);
    setFieldErrors(previous => omitFieldError(previous, "notes"));
  };

  const handleCancel = () => {
    router.push(CREDITS_LIST_HREF);
  };

  const applySubmitError = (error: unknown) => {
    if (getGraphQLErrorCode(error) === INSUFFICIENT_CLASSES_CODE) {
      setFieldErrors(previous => ({ ...previous, hours: t.validation.insufficientClasses }));
      return;
    }
    notifications.show(getGraphQLErrorMessage(error) ?? common.operationFailed, { severity: "error" });
  };

  const applySubmitSuccess = (submittedDraft: CreditAdjustDraft) => {
    // The mutation result carries no recalculated balances — drop the cached
    // students directory entries so the list refetches with fresh balances,
    // and the deep-linked student record so a revisited preselection summary
    // never shows the stale balance.
    client.cache.evict({ fieldName: "studentsDirectory" });
    client.cache.evict({ fieldName: "studentById" });
    notifications.show(buildSuccessMessage(t, submittedDraft), { severity: "success" });
    reset();
    router.push(CREDITS_LIST_HREF);
  };

  const handleSubmit = async () => {
    if (submittedTokenRef.current === clientRequestId) return;
    const validation = validateCreditAdjustDraft(draft, validationCopy);
    setFieldErrors(validation ?? {});
    if (validation) return;
    submittedTokenRef.current = clientRequestId;
    try {
      await recordAdjustment({ variables: { input: buildAdjustmentInput(draft) } });
    } catch (error) {
      // Allow a retry within the same form session (e.g. after a network drop).
      submittedTokenRef.current = null;
      applySubmitError(error);
      return;
    }
    applySubmitSuccess(draft);
  };

  return (
    <SectionPanel title={t.adjustCredits}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <StudentAutocomplete
            value={displayedStudent}
            onChange={handleStudentChange}
            error={fieldErrors.student !== undefined}
            helperText={fieldErrors.student}
            disabled={submitting}
            required
            fullWidth
          />
          {preselectedSummary !== null ? (
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mt: -1.5 }}>
              <BaseAvatar
                label={preselectedSummary.name ?? ""}
                src={preselectedSummary.avatarUrl ?? undefined}
                size={28}
              />
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{preselectedSummary.name}</Typography>
              <Chip
                size="small"
                label={`${preselectedSummary.classesRemaining ?? "—"} / ${preselectedSummary.classesTotal ?? "—"}`}
              />
            </Stack>
          ) : null}
          <AdjustmentTypeRadioGroup sectionTitle={t.adjustmentType.title} />
          {isCarryover ? <CarryoverBanner errors={carryoverErrors} /> : null}
          <TextField
            type="number"
            label={t.hours.label}
            value={hours ?? ""}
            onChange={handleHoursChange}
            error={fieldErrors.hours !== undefined}
            helperText={fieldErrors.hours}
            disabled={submitting}
            required
            fullWidth
            aria-invalid={fieldErrors.hours !== undefined}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
          <RichTextEditor
            value={notes}
            onChange={handleNotesChange}
            label={t.reason.label}
            error={fieldErrors.notes !== undefined}
            helperText={fieldErrors.notes}
            disabled={submitting}
            required
          />
          <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 2 }}>
            <FilterButton onClick={handleCancel} disabled={submitting}>
              {common.cancel}
            </FilterButton>
            <PrimaryPageAction onClick={() => void handleSubmit()} loading={submitting}>
              {t.adjustCredits}
            </PrimaryPageAction>
          </Stack>
        </Stack>
      </Box>
    </SectionPanel>
  );
}
