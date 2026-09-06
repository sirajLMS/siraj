"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useRef } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  CarryoverBalanceQuery_carryoverBalance,
  CreateCarryoverInput,
  CurrencyCode,
  UpdateCarryoverInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createCarryoverBalanceMutationDocument,
  updateCarryoverBalanceMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Terminal domain rejections the dialog maps onto inline field errors. */
const TEACHER_IMMUTABLE_ERROR_CODE = "CARRYOVER_TEACHER_IMMUTABLE";

/** Root field holding the carryover list page; dropped from the cache after writes. */
const CARRYOVER_LIST_FIELD = "carryoverBalances";

/** Server-side cap on the persisted operator note, mirrored so typing stops at the limit. */
export const CARRYOVER_NOTE_MAX_LENGTH = 2000;

/** Editable snapshot of an existing carryover; `null` on the dialog props means add mode. */
export type CarryoverFormRow = Pick<
  CarryoverBalanceQuery_carryoverBalance,
  | "id"
  | "teacherId"
  | "teacherName"
  | "teacherAvatarUrl"
  | "fromDate"
  | "toDate"
  | "payable"
  | "teacherCurrency"
  | "studentsCount"
  | "studentsText"
  | "note"
>;

/**
 * Client mirror of the server-side carryover form rules: teacher and currency
 * are required, payable must be a non-negative number, both period bounds are
 * required, and the range must not be inverted. Messages come from the
 * carryover and shared user-select namespaces so both locales render.
 */
interface CarryoverValidationCopy {
  readonly teacherRequired: string;
  readonly required: string;
  readonly dateRangeInvalid: string;
  readonly payableNegative: string;
  readonly currencyRequired: string;
  readonly noteTooLong: string;
}

function addPresenceIssues(values: CarryoverFormData, copy: CarryoverValidationCopy, ctx: z.RefinementCtx) {
  if (values.teacher === null) {
    ctx.addIssue({ code: "custom", message: copy.teacherRequired, path: ["teacher"] });
  }
  if (values.teacherCurrency === null) {
    ctx.addIssue({ code: "custom", message: copy.currencyRequired, path: ["teacherCurrency"] });
  }
  const payableRaw = values.payable.trim();
  if (payableRaw === "") {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["payable"] });
    return;
  }
  const payable = Number(payableRaw);
  if (Number.isNaN(payable) || payable < 0) {
    ctx.addIssue({ code: "custom", message: copy.payableNegative, path: ["payable"] });
  }
}

/** A picker can hand over an invalid Date (unparseable keystrokes); those read as "missing". */
function asValidDate(value: Date | null): Date | null {
  if (value === null) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

function addDateIssues(values: CarryoverFormData, copy: CarryoverValidationCopy, ctx: z.RefinementCtx) {
  const fromDate = asValidDate(values.fromDate);
  const toDate = asValidDate(values.toDate);
  if (fromDate === null) {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["fromDate"] });
  }
  if (toDate === null) {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["toDate"] });
  }
  if (fromDate !== null && toDate !== null && fromDate.getTime() > toDate.getTime()) {
    ctx.addIssue({ code: "custom", message: copy.dateRangeInvalid, path: ["fromDate"] });
    ctx.addIssue({ code: "custom", message: copy.dateRangeInvalid, path: ["toDate"] });
  }
}

function createCarryoverFormSchema(copy: CarryoverValidationCopy) {
  return z
    .object({
      teacher: z.custom<PersonOption | null>(value => value === null || typeof value === "object"),
      fromDate: z.custom<Date | null>(value => value === null || value instanceof Date),
      toDate: z.custom<Date | null>(value => value === null || value instanceof Date),
      payable: z.string(),
      teacherCurrency: z.custom<CurrencyCode | null>(value => value === null || typeof value === "string"),
      // Parsed leniently (empty or non-integer text becomes null); the count is
      // optional so an unparseable trailing value degrades to "not provided"
      // rather than blocking the whole write.
      studentsCount: z.string(),
      studentsText: z.string(),
      note: z.string().max(CARRYOVER_NOTE_MAX_LENGTH, copy.noteTooLong),
    })
    .superRefine((values, ctx) => {
      addPresenceIssues(values, copy, ctx);
      addDateIssues(values, copy, ctx);
    });
}

export type CarryoverFormInput = z.input<ReturnType<typeof createCarryoverFormSchema>>;
export type CarryoverFormData = z.output<ReturnType<typeof createCarryoverFormSchema>>;

/** Post-validation view of the form where the required picker fields are non-null. */
type ValidCarryoverData = Omit<CarryoverFormData, "teacher" | "teacherCurrency"> & {
  readonly teacher: PersonOption;
  readonly teacherCurrency: CurrencyCode;
};

function buildTeacherOption(row: CarryoverFormRow): PersonOption | null {
  if (row.teacherId === null) return null;
  return { id: row.teacherId, name: row.teacherName ?? "", avatarUrl: row.teacherAvatarUrl ?? null };
}

/**
 * Fresh form values for a dialog session: blank for add mode, prefilled from
 * the carryover snapshot in edit mode.
 */
function buildFormDefaults(row: CarryoverFormRow | null): CarryoverFormInput {
  return {
    teacher: row === null ? null : buildTeacherOption(row),
    fromDate: parseDateInput(row?.fromDate),
    toDate: parseDateInput(row?.toDate),
    payable: row?.payable ?? "",
    teacherCurrency: row?.teacherCurrency ?? null,
    studentsCount: row?.studentsCount == null ? "" : String(row.studentsCount),
    studentsText: row?.studentsText ?? "",
    note: row?.note ?? "",
  };
}

/** Optional non-negative whole count; blank or garbage input persists as "not provided". */
function toOptionalStudentCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

/** Omitted (null) when blank so an untouched note/students text never reaches the wire. */
function toOptionalText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function toOptionalIsoDate(value: Date | null): string | null {
  const parsed = asValidDate(value);
  return parsed === null ? null : formatDateInput(parsed);
}

/** Editable fields shared by the create patch and the update patch. */
function buildEditableCarryoverFields(data: CarryoverFormData) {
  return {
    fromDate: toOptionalIsoDate(data.fromDate),
    toDate: toOptionalIsoDate(data.toDate),
    payable: data.payable.trim(),
    teacherCurrency: data.teacherCurrency,
    studentsCount: toOptionalStudentCount(data.studentsCount),
    studentsText: toOptionalText(data.studentsText),
    note: toOptionalText(data.note),
  };
}

function buildCreateCarryoverInput(data: ValidCarryoverData, clientRequestId: string): CreateCarryoverInput {
  return {
    ...buildEditableCarryoverFields(data),
    teacherId: data.teacher.id,
    teacherCurrency: data.teacherCurrency,
    clientRequestId,
  };
}

function buildUpdateCarryoverInput(data: CarryoverFormData, id: string): UpdateCarryoverInput {
  return { id, ...buildEditableCarryoverFields(data) };
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

export interface UseCarryoverFormViewModelProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Carryover snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: CarryoverFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export interface CarryoverFormViewModel {
  readonly form: UseFormReturn<CarryoverFormInput, undefined, CarryoverFormData>;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  /** Edit mode re-assigns no teacher, so the picker is locked and prefilled. */
  readonly isEdit: boolean;
  readonly title: string;
  readonly submitting: boolean;
  /**
   * Add mode needs a selected teacher; edit mode always can submit because the
   * teacher is prefilled from the row snapshot.
   */
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

export function useCarryoverFormViewModel({
  open,
  row,
  onClose,
  onSaved,
}: Readonly<UseCarryoverFormViewModelProps>): CarryoverFormViewModel {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const userSelectLabels = useAppTranslation(Translation.Ui.UserSelect);
  const errorLabels = useAppTranslation(Translation.Errors);
  const notifications = useNotifications();
  const client = useApolloClient();

  const isEdit = row !== null;
  const validationCopy: CarryoverValidationCopy = {
    teacherRequired: labels.validation.teacherRequired,
    required: userSelectLabels.required,
    dateRangeInvalid: labels.validation.dateRangeInvalid,
    payableNegative: labels.validation.payableNegative,
    currencyRequired: labels.validation.currencyRequired,
    noteTooLong: labels.validation.noteTooLong,
  };

  const form = useForm<CarryoverFormInput, undefined, CarryoverFormData>({
    resolver: zodResolver(createCarryoverFormSchema(validationCopy)),
    defaultValues: buildFormDefaults(null),
  });

  // One idempotency token per dialog session: re-opening the dialog starts a
  // fresh write, while retries inside the same session reuse the token so the
  // server-side idempotency window absorbs double submissions. The token also
  // doubles as the update-mode submit guard (update carries no clientRequestId).
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);
  // The effect below seeds the form from the row snapshot at open time; the ref
  // keeps the effect stable against mid-session row identity changes.
  const rowRef = useRef<CarryoverFormRow | null>(row);
  // Declared before the open-reset effect so the ref stays current whenever
  // that effect reads the latest snapshot.
  useEffect(() => {
    rowRef.current = row;
  });

  const [createCarryover, { loading: creating }] = useMutation(createCarryoverBalanceMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const [updateCarryover, { loading: updating }] = useMutation(updateCarryoverBalanceMutationDocument, {
    errorPolicy: "none",
  });

  const teacherSelection = useWatch({ control: form.control, name: "teacher" });

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildFormDefaults(rowRef.current));
  }, [open, form]);

  const applySubmitError = useCallback(
    (error: unknown) => {
      if (getGraphQLErrorCode(error) === TEACHER_IMMUTABLE_ERROR_CODE) {
        // Inline on the teacher field: the UI already locks the picker, so a
        // teacherId rejection means a stale/doctored payload the operator must
        // resolve at the record level (delete + recreate).
        form.setError("teacher", { message: errorLabels.carryover.teacherImmutable });
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [form, errorLabels, notifications, commonLabels]
  );

  const applySubmitSuccess = useCallback(() => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
    client.cache.gc();
    notifications.show(isEdit ? labels.success.updated : labels.success.created, { severity: "success" });
    onSaved?.();
    onClose();
  }, [client, labels, notifications, isEdit, onSaved, onClose]);

  const handleFormSubmit = useCallback(
    async (data: CarryoverFormData): Promise<void> => {
      const idempotencyToken = clientRequestIdRef.current;
      if (idempotencyToken === null || submittedTokenRef.current === idempotencyToken) return;
      // handleSubmit only runs the resolver-validated payload; this narrowing
      // guards the fallback path and keeps the builders on non-null types.
      if (data.teacher === null || data.teacherCurrency === null) return;
      // An edit target without an id is a broken snapshot; refuse silently
      // rather than sending a malformed patch.
      if (rowRef.current !== null && rowRef.current.id === null) return;
      const validData: ValidCarryoverData = {
        ...data,
        teacher: data.teacher,
        teacherCurrency: data.teacherCurrency,
      };
      submittedTokenRef.current = idempotencyToken;
      try {
        if (rowRef.current !== null) {
          await updateCarryover({
            variables: { input: buildUpdateCarryoverInput(validData, rowRef.current.id ?? "") },
          });
        } else {
          await createCarryover({ variables: { input: buildCreateCarryoverInput(validData, idempotencyToken) } });
        }
      } catch (error) {
        // Re-arm the guard so the operator can retry in this dialog session; the
        // reused token keeps the retry idempotent server-side.
        submittedTokenRef.current = null;
        applySubmitError(error);
        return;
      }
      applySubmitSuccess();
    },
    [createCarryover, updateCarryover, applySubmitError, applySubmitSuccess]
  );

  // handleSubmit runs validation on demand; wrapping it keeps the render path
  // free of any ref access until the submit event actually fires.
  const handleSubmitClick = useCallback(() => {
    void form.handleSubmit(handleFormSubmit)();
  }, [form, handleFormSubmit]);

  return {
    form,
    labels,
    commonLabels,
    isEdit,
    title: isEdit ? labels.modal.form.titleEdit : labels.modal.form.titleAdd,
    submitting: creating || updating,
    canSubmit: isEdit || (teacherSelection !== null && teacherSelection.id !== ""),
    onSubmit: handleSubmitClick,
    onCancel: onClose,
  };
}
