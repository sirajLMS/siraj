"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Chip, Stack, TextField, Typography } from "@mui/material";
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
  type StudentByIdQuery_studentById,
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
  readonly internalNotes: string;
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
/** Mirrors the server-side internal-notes cap (`INTERNAL_NOTES_MAX_LENGTH`). */
const INTERNAL_NOTES_MAX_LENGTH = 2000;

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

/** Previewable balance pair; null until the row loads and hours is valid. */
interface BalancePreview {
  readonly from: number;
  readonly to: number;
}

/** Rows whose balance fields can drive the preview (the fetched student record). */
interface BalancePreviewSource {
  readonly classesRemaining: number | null;
}

function computeBalancePreview(
  row: BalancePreviewSource | null,
  adjustmentType: CreditAdjustmentType,
  hours: number | null
): BalancePreview | null {
  const remaining = row?.classesRemaining;
  if (remaining === null || remaining === undefined || !isValidHours(hours)) return null;
  return { from: remaining, to: remainingAfterAdjustment(adjustmentType, remaining, hours) };
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

interface CreditAdjustmentLabelsForSummary {
  readonly summary: {
    readonly add: (hours: number, student: string) => string;
    readonly subtract: (hours: number, student: string) => string;
    readonly carryover: (hours: number, teacher: string, paymentDate: string) => string;
  };
}

/**
 * Human-readable recap of the pending operation for the pre-submit summary
 * strip. Incomplete carryover metadata (teacher/date still being picked) falls
 * back to the plain deduction wording; returns null while hours is not a
 * valid positive integer.
 */
function buildSummaryText(
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

/** Authoritative server rejection shown in the full-width band above the actions. */
interface SubmitError {
  readonly code: string | undefined;
  readonly message: string;
}

interface SelectedStudentCardProps {
  readonly row: StudentByIdQuery_studentById;
  /** Caption prefixing the `remaining / total` balance chip. */
  readonly balanceLabel: string;
}

/**
 * Read-only live-context card for the selected student. The picker input
 * cannot echo a programmatic value, so the resolved record (name, teacher,
 * current balance) is surfaced here while the search field above stays
 * available to swap the student.
 */
function SelectedStudentCard({ row, balanceLabel }: SelectedStudentCardProps) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        mt: -1.5,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: theme.palette.outlineVariant,
        borderRadius: 2,
        backgroundColor: theme.palette.surface,
      })}
    >
      <BaseAvatar label={row.name ?? ""} src={row.avatarUrl ?? undefined} size={40} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 14,
            // Long names must yield before the balance caption, not collide
            // with it: the nowrap ellipsis trades full text for a guaranteed
            // gap at narrow widths.
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.name}
        </Typography>
        {row.teacherName ? (
          <Typography
            sx={theme => ({ fontSize: theme.typography.caption.fontSize, color: theme.palette.text.secondary })}
          >
            {row.teacherName}
          </Typography>
        ) : null}
      </Box>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Typography
          sx={theme => ({
            typography: "labelUppercase",
            fontSize: theme.typography.labelSm.fontSize,
            color: theme.palette.text.secondary,
          })}
        >
          {balanceLabel}
        </Typography>
        <Chip size="small" label={`${row.classesRemaining ?? "—"} / ${row.classesTotal ?? "—"}`} />
      </Stack>
    </Box>
  );
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
  const internalNotes = useCreditAdjustFormStore(state => state.internalNotes);
  const carryoverTeacherId = useCreditAdjustFormStore(state => state.carryoverTeacherId);
  const fromDate = useCreditAdjustFormStore(state => state.fromDate);
  const toDate = useCreditAdjustFormStore(state => state.toDate);
  const paymentDate = useCreditAdjustFormStore(state => state.paymentDate);
  const clientRequestId = useCreditAdjustFormStore(state => state.clientRequestId);
  const setStudentId = useCreditAdjustFormStore(state => state.setStudentId);
  const setHours = useCreditAdjustFormStore(state => state.setHours);
  const setNotes = useCreditAdjustFormStore(state => state.setNotes);
  const setInternalNotes = useCreditAdjustFormStore(state => state.setInternalNotes);
  const regenerateClientRequestId = useCreditAdjustFormStore(state => state.regenerateClientRequestId);
  const reset = useCreditAdjustFormStore(state => state.reset);

  // The picker renders full person records while the store keeps only the id.
  const [student, setStudent] = useState<PersonOption | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreditAdjustFieldErrors>({});
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  // One submission per form session: the guard token is regenerated on mount
  // and on reset, so a re-mounted form can always submit again.
  const submittedTokenRef = useRef<string | null>(null);

  const [recordAdjustment, { loading: submitting }] = useMutation(recordCreditAdjustmentMutationDocument, {
    // Match the production client default: domain errors reject with
    // CombinedGraphQLErrors carrying `extensions.code` instead of resolving.
    errorPolicy: "none",
  });

  // The selected student (deep-linked or freshly picked) is the live-context
  // surface: fetch the full record whenever the store holds an id so the
  // summary card and the balance preview always reflect real data.
  const { data: selectedStudentData } = useQuery(studentByIdQueryDocument, {
    variables: { studentId: storeStudentId ?? "" },
    skip: storeStudentId === null,
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

  const selectedRowRaw = selectedStudentData?.studentById;
  // A stale response for a previously selected student must never leak into
  // the display: only use the row while it still matches the store id.
  const selectedRow = selectedRowRaw?.id === storeStudentId ? selectedRowRaw : null;
  const displayedStudent: PersonOption | null =
    student ??
    (selectedRow?.id && selectedRow.name
      ? { id: selectedRow.id, name: selectedRow.name, avatarUrl: selectedRow.avatarUrl }
      : null);
  // The picker edits free text while browsing, so the selected student is also
  // surfaced as a read-only summary with the live balance (mirrors the credits
  // list presentation).
  const studentSummary = selectedRow?.name ? selectedRow : null;

  // Carryover error highlights are re-derived from the live draft each render:
  // once a failed submit has flagged the section, fixing a field lifts its
  // error immediately instead of waiting for the next submit.
  const draft: CreditAdjustDraft = {
    studentId: storeStudentId,
    adjustmentType,
    hours,
    notes,
    internalNotes,
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

  // Live preview of the resulting balance: shown only once the student's real
  // balance has loaded and hours holds a positive whole number. A negative
  // outcome is what the server would reject with INSUFFICIENT_CLASSES, so it
  // is flagged with the error tone before the operator even submits.
  const balancePreview = computeBalancePreview(studentSummary, adjustmentType, hours);

  // The summary strip describes the exact pending write in words; it needs the
  // student name, which only exists once a row/option resolves.
  const studentName = studentSummary?.name ?? null;
  const summaryText = studentName === null ? null : buildSummaryText(t, draft, studentName);

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

  const handleInternalNotesChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInternalNotes(event.target.value);
  };

  const handleCancel = () => {
    router.push(CREDITS_LIST_HREF);
  };

  const applySubmitError = (error: unknown) => {
    // The full-width band is the authoritative error surface; the inline
    // hours error additionally pinpoints the fixable field for balance
    // rejections.
    setSubmitError({
      code: getGraphQLErrorCode(error),
      message: getGraphQLErrorMessage(error) ?? common.operationFailed,
    });
    if (getGraphQLErrorCode(error) === INSUFFICIENT_CLASSES_CODE) {
      setFieldErrors(previous => ({ ...previous, hours: t.validation.insufficientClasses }));
    }
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
    // A new attempt supersedes the previous rejection: clear the band up
    // front so a stale message never survives a successful retry.
    setSubmitError(null);
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
    <SectionPanel title={t.adjustCredits} subTitle={t.adjustCreditsSubtitle}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 3,
          // Extra bottom room on phones so the form clears the fixed bottom
          // navigation instead of clipping its last fields behind it.
          pb: { xs: 6, md: 3 },
        }}
      >
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
          {studentSummary !== null ? <SelectedStudentCard row={studentSummary} balanceLabel={t.form.balance} /> : null}
          {balancePreview !== null ? (
            // A negative outcome is what the server would reject with
            // INSUFFICIENT_CLASSES — flag it with the error tone up front.
            <Alert severity={balancePreview.to < 0 ? "error" : "info"}>
              {t.preview.balance(balancePreview.from, balancePreview.to)}
            </Alert>
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
            aria-invalid={fieldErrors.hours !== undefined}
            // Numeric input needs no full-width stretch; keep it compact with
            // the same outlined floating-label convention as the other fields.
            sx={{ width: "100%", maxWidth: 240 }}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
          <Box
            sx={theme => ({
              // The shared editor fixes a taller body than this short-form
              // reason warrants (~3 rows here); a wrapper-level override keeps
              // the shared component untouched.
              "& .ProseMirror.ProseMirror": { minHeight: theme.spacing(9) },
            })}
          >
            <RichTextEditor
              value={notes}
              onChange={handleNotesChange}
              label={t.reason.label}
              error={fieldErrors.notes !== undefined}
              helperText={fieldErrors.notes}
              disabled={submitting}
              required
            />
          </Box>
          <TextField
            multiline
            minRows={2}
            label={t.form.internalNotes}
            helperText={t.form.internalNotesHint}
            value={internalNotes}
            onChange={handleInternalNotesChange}
            disabled={submitting}
            fullWidth
            slotProps={{ htmlInput: { maxLength: INTERNAL_NOTES_MAX_LENGTH } }}
          />
          {summaryText !== null ? (
            // Pre-submit recap of the pending write, re-derived from the store
            // on every render so it always matches the current draft.
            <Alert severity="info">{summaryText}</Alert>
          ) : null}
          {submitError !== null ? (
            // Authoritative rejection surface: the GraphQL error code next to
            // the server's localized message.
            <Alert severity="error">
              <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {submitError.code !== undefined ? <Chip size="small" label={submitError.code} /> : null}
                <Typography sx={{ fontSize: 14 }}>{submitError.message}</Typography>
              </Stack>
            </Alert>
          ) : null}
          <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 2 }}>
            <FilterButton
              onClick={handleCancel}
              disabled={submitting}
              sx={theme => ({
                borderColor: theme.palette.outline,
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.outline,
                },
              })}
            >
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
