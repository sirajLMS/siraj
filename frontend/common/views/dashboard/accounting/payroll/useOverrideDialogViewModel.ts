"use client";

import { useApolloClient } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildDefaultValues,
  buildTargetOptions,
  createOverrideSchema,
  NOTE_MAX_LENGTH,
  type OverrideDialogRow,
  type OverrideFormData,
  type OverrideFormInput,
  type OverrideSummaryValues,
  type OverrideTargetOption,
  toStatusLabels,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.helpers";
import {
  useOverrideFormActions,
  useOverrideRejection,
  useOverrideSession,
  useOverrideSubmission,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.hooks";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingPayroll, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

export type { OverrideDialogRow };
export { NOTE_MAX_LENGTH };

export interface UseOverrideDialogViewModelProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Payroll snapshot the override targets; null leaves the summary blank and disables submission. */
  readonly row: OverrideDialogRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful override. */
  readonly onClose: () => void;
  /** Runs after a successful override so the host page can refresh its queries. */
  readonly onApplied?: () => void;
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

export function useOverrideDialogViewModel({
  open,
  row,
  onClose,
  onApplied,
}: Readonly<UseOverrideDialogViewModelProps>): OverrideDialogViewModel {
  const labels = useAppTranslation(DashboardBillingPayroll);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();

  const form = useForm<OverrideFormInput, undefined, OverrideFormData>({
    resolver: zodResolver(createOverrideSchema(labels)),
    defaultValues: buildDefaultValues(),
  });

  const { clientRequestIdRef, submittedTokenRef } = useOverrideSession(open, form);
  const { rejection, setRejection } = useOverrideRejection(open);

  const targetStatus = useWatch({ control: form.control, name: "targetStatus" });
  const forceValue = useWatch({ control: form.control, name: "force" });
  const isPartialTarget = targetStatus === CalculationStatus.Partially;
  const noteRequired = targetStatus === CalculationStatus.Refund || isPartialTarget;
  const forceHighlighted = rejection === "awaitingSettlement";
  const showForceCheckbox =
    (row?.calculationStatus ?? null) === CalculationStatus.WaitingPaid || forceHighlighted || forceValue;

  const { applyingOverride, handleSubmitClick } = useOverrideSubmission({
    form,
    row,
    labels,
    commonLabels,
    notifications,
    client,
    setRejection,
    clientRequestIdRef,
    submittedTokenRef,
    onApplied,
    onClose,
  });

  const { handleTargetStatusChange, handleForceChange } = useOverrideFormActions(form, setRejection);

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
