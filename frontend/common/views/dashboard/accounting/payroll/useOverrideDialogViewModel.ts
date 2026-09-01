"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  CalculationStatus,
  type CurrencyCode,
  type PayrollOverrideInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { applyPayrollOverrideMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingPayroll, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Terminal domain rejections the dialog maps onto inline banners. */
const ALREADY_PAID_ERROR_CODE = "PAYROLL_ALREADY_PAID";
const AWAITING_SETTLEMENT_ERROR_CODE = "PAYROLL_AWAITING_SETTLEMENT";

/** Server-side cap on the persisted operator note, mirrored so typing stops at the limit. */
export const NOTE_MAX_LENGTH = 2000;

/** Server-side percentage bounds (whole numbers), mirrored for the Partially target. */
const MIN_PARTIAL_PERCENTAGE = 0;
const MAX_PARTIAL_PERCENTAGE = 100;

/** Target statuses an operator may pick; the terminal Paid/Waiting Paid states are not overridable targets. */
const OVERRIDE_TARGET_STATUSES = [
  CalculationStatus.Refund,
  CalculationStatus.Calculated,
  CalculationStatus.NotCalculated,
  CalculationStatus.Partially,
] as const;

type OverrideTargetStatus = (typeof OVERRIDE_TARGET_STATUSES)[number];

const OVERRIDE_TARGET_VALUE_SET: ReadonlySet<string> = new Set(OVERRIDE_TARGET_STATUSES);

function isOverrideTargetValue(value: string): value is OverrideTargetStatus {
  return OVERRIDE_TARGET_VALUE_SET.has(value);
}

/**
 * Client mirror of the server-side override rules: percentage is a whole
 * number 0–100 required for Partially, and the note is required for Refund and
 * Partially. Messages come from the payroll namespace so both locales render.
 * The percentage bounds apply only on the Partially target — the server runs
 * its percentage check solely for PARTIALLY, so a stale value left in the
 * hidden field must never block the other targets.
 */
function createOverrideSchema(labels: PayrollLabels) {
  return z
    .object({
      targetStatus: z.enum(OVERRIDE_TARGET_STATUSES),
      // Parsed leniently (empty or unparseable text becomes null); the range
      // rules live in superRefine so they stay conditional on the target.
      partialPercentage: z.string().transform(value => {
        const trimmed = value.trim();
        if (trimmed === "") return null;
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
      }),
      note: z.string().max(NOTE_MAX_LENGTH),
      force: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.targetStatus === CalculationStatus.Partially) {
        const percentage = data.partialPercentage;
        if (
          percentage === null ||
          !Number.isInteger(percentage) ||
          percentage < MIN_PARTIAL_PERCENTAGE ||
          percentage > MAX_PARTIAL_PERCENTAGE
        ) {
          ctx.addIssue({ code: "custom", message: labels.validation.percentageRequired, path: ["partialPercentage"] });
        }
      }
      const noteRequired =
        data.targetStatus === CalculationStatus.Refund || data.targetStatus === CalculationStatus.Partially;
      if (noteRequired && data.note.trim() === "") {
        ctx.addIssue({ code: "custom", message: labels.validation.noteRequired, path: ["note"] });
      }
    });
}

export type OverrideFormInput = z.input<ReturnType<typeof createOverrideSchema>>;
export type OverrideFormData = z.output<ReturnType<typeof createOverrideSchema>>;

function buildDefaultValues(): OverrideFormInput {
  return {
    targetStatus: CalculationStatus.Calculated,
    partialPercentage: "",
    note: "",
    force: false,
  };
}

/** One selectable override target with its localized label (label text includes the helper copy). */
export interface OverrideTargetOption {
  readonly value: OverrideTargetStatus;
  readonly label: string;
}

function buildTargetOptions(labels: PayrollLabels["override"]): readonly OverrideTargetOption[] {
  return [
    { value: CalculationStatus.Refund, label: labels.target.Refund },
    { value: CalculationStatus.Calculated, label: labels.target.Calculated },
    { value: CalculationStatus.NotCalculated, label: labels.target.NotCalculated },
    { value: CalculationStatus.Partially, label: labels.target.Partially },
  ];
}

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
function toStatusLabels(labels: PayrollLabels): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: labels.status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: labels.status.CALCULATED,
    [CalculationStatus.Partially]: labels.status.PARTIALLY,
    [CalculationStatus.Refund]: labels.status.REFUND,
    [CalculationStatus.WaitingPaid]: labels.status.WAITING_PAID,
    [CalculationStatus.Paid]: labels.status.PAID,
  };
}

/** Read-only snapshot of the row's current calculation values shown in the summary card. */
export interface OverrideSummaryValues {
  readonly calculationStatus: CalculationStatus | null;
  readonly teacherPaidAmount: string | null;
  readonly teacherPaidCurrency: CurrencyCode | null;
  readonly calculatedDuration: number | null;
  readonly isPartialPercentage: number | null;
  readonly payrollNote: string | null;
}

export interface UseOverrideDialogViewModelProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Report row the override targets; null leaves the summary blank and disables submission. */
  readonly row: PayrollReportRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful override. */
  readonly onClose: () => void;
}

export interface OverrideDialogViewModel {
  readonly form: UseFormReturn<OverrideFormInput, undefined, OverrideFormData>;
  readonly labels: PayrollLabels;
  readonly commonLabels: CommonLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly targetOptions: readonly OverrideTargetOption[];
  readonly summary: OverrideSummaryValues;
  readonly isPartialTarget: boolean;
  readonly noteRequired: boolean;
  readonly submitting: boolean;
  /** Terminal rejection: the row is already paid, so no override can apply. */
  readonly alreadyPaidBlocked: boolean;
  /** The server refused without force; the checkbox stays highlighted until force is ticked. */
  readonly forceHighlighted: boolean;
  /**
   * The force checkbox renders only where force can matter: rows already in
   * Waiting Paid, after the server reports an awaiting-settlement rejection
   * (the row may have drifted since the report loaded), or while force is
   * ticked so the control never unmounts under the operator. Other rows never
   * see it, mirroring the server where force only gates Waiting Paid rows.
   */
  readonly showForceCheckbox: boolean;
  /** False only when the row carries no instance id (blank summary disables the submit button). */
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly onTargetStatusChange: (value: string) => void;
  readonly onForceChange: (checked: boolean) => void;
}

function buildOverrideInput(data: OverrideFormData, instanceId: string, clientRequestId: string): PayrollOverrideInput {
  const note = data.note.trim();
  const isPartial = data.targetStatus === CalculationStatus.Partially;
  return {
    instanceId,
    targetStatus: data.targetStatus,
    partialPercentage: isPartial ? data.partialPercentage : null,
    note: note === "" ? null : note,
    force: data.force,
    clientRequestId,
  };
}

/** Domain rejection surfacing as an inline banner; null means no banner. */
type OverrideRejection = "alreadyPaid" | "awaitingSettlement";

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

export function useOverrideDialogViewModel({
  open,
  row,
  onClose,
}: Readonly<UseOverrideDialogViewModelProps>): OverrideDialogViewModel {
  const labels = useAppTranslation(DashboardBillingPayroll);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();

  const form = useForm<OverrideFormInput, undefined, OverrideFormData>({
    resolver: zodResolver(createOverrideSchema(labels)),
    defaultValues: buildDefaultValues(),
  });

  // One idempotency token per dialog session: re-opening the dialog starts a
  // fresh override, while retries inside the same session reuse the token so
  // the server-side idempotency window absorbs double submissions.
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);
  const [rejection, setRejection] = useState<OverrideRejection | null>(null);

  const [applyOverride, { loading: applyingOverride }] = useMutation(applyPayrollOverrideMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  const targetStatus = useWatch({ control: form.control, name: "targetStatus" });
  const forceValue = useWatch({ control: form.control, name: "force" });
  const isPartialTarget = targetStatus === CalculationStatus.Partially;
  const noteRequired = targetStatus === CalculationStatus.Refund || isPartialTarget;
  const forceHighlighted = rejection === "awaitingSettlement";
  const showForceCheckbox =
    (row?.calculationStatus ?? null) === CalculationStatus.WaitingPaid || forceHighlighted || forceValue;

  // A new open session clears the previous session's rejection banner during
  // render (the render-phase state adjustment) so no cascading effect fires.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setRejection(null);
  }

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildDefaultValues());
  }, [open, form]);

  const applySubmitError = useCallback(
    (error: unknown) => {
      const code = getGraphQLErrorCode(error);
      if (code === ALREADY_PAID_ERROR_CODE) {
        setRejection("alreadyPaid");
        return;
      }
      if (code === AWAITING_SETTLEMENT_ERROR_CODE) {
        setRejection("awaitingSettlement");
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [commonLabels, notifications]
  );

  const applySubmitSuccess = useCallback(() => {
    // The override result and the report row are distinct cached types, so the
    // report refreshes wholesale by dropping the cached root field.
    client.cache.evict({ fieldName: "payrollReport" });
    client.cache.gc();
    notifications.show(labels.success.overridden, { severity: "success" });
    onClose();
  }, [client, labels, notifications, onClose]);

  const handleFormSubmit = useCallback(
    async (data: OverrideFormData): Promise<void> => {
      const instanceId = row?.instanceId ?? null;
      const clientRequestId = clientRequestIdRef.current;
      if (instanceId === null || clientRequestId === null) return;
      if (submittedTokenRef.current === clientRequestId) return;
      submittedTokenRef.current = clientRequestId;
      try {
        await applyOverride({ variables: { input: buildOverrideInput(data, instanceId, clientRequestId) } });
      } catch (error) {
        // Re-arm the guard so the operator can retry in this dialog session; the
        // reused token keeps the retry idempotent server-side.
        submittedTokenRef.current = null;
        applySubmitError(error);
        return;
      }
      applySubmitSuccess();
    },
    [applyOverride, applySubmitError, applySubmitSuccess, row]
  );

  const handleTargetStatusChange = useCallback(
    (value: string) => {
      if (!isOverrideTargetValue(value)) return;
      form.setValue("targetStatus", value, { shouldDirty: true });
    },
    [form]
  );

  const handleForceChange = useCallback(
    (checked: boolean) => {
      // Ticking force resolves the awaiting-settlement rejection that
      // highlights the checkbox; other rejections are unaffected.
      if (checked) {
        setRejection(current => (current === "awaitingSettlement" ? null : current));
      }
      form.setValue("force", checked, { shouldDirty: true });
    },
    [form]
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
    statusLabels: toStatusLabels(labels),
    targetOptions: buildTargetOptions(labels.override),
    summary: {
      calculationStatus: row?.calculationStatus ?? null,
      teacherPaidAmount: row?.teacherPaidAmount ?? null,
      teacherPaidCurrency: row?.teacherPaidCurrency ?? null,
      calculatedDuration: row?.calculatedDuration ?? null,
      isPartialPercentage: row?.isPartialPercentage ?? null,
      payrollNote: row?.payrollNote ?? null,
    },
    isPartialTarget,
    noteRequired,
    submitting: applyingOverride,
    alreadyPaidBlocked: rejection === "alreadyPaid",
    forceHighlighted,
    showForceCheckbox,
    canSubmit: (row?.instanceId ?? null) !== null,
    onSubmit: handleSubmitClick,
    onCancel: onClose,
    onTargetStatusChange: handleTargetStatusChange,
    onForceChange: handleForceChange,
  };
}
