"use client";

import { useCallback } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useManualInvoiceUiStore } from "@/frontend/common/stores/manualInvoiceUiStore";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { ManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import {
  useCreateManualInvoice,
  useInvoicePermissions,
} from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.actionHooks";
import {
  useAutoDismissOnSuccess,
  useDraftTotals,
  useInvoiceForm,
  useResetStudentOnParentChange,
  useSyncFormParentIdToStore,
} from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.formHooks";
import { buildSubmitHandler } from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.helpers";
import { buildManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import { useRouter } from "@/shared/i18n/navigation";
import { type ProfileParentLabels, Translation, useAppTranslation } from "@/shared/locale";

export type UseManualInvoiceViewModelProps = Record<string, never>;

export interface ManualInvoiceViewModel {
  readonly labels: ManualInvoiceLabels;
  readonly profileLabels: ProfileParentLabels;
  readonly selectedParentId: string | null;
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly draftCurrency: CurrencyCode;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onBack: () => void;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
  readonly onDismissSuccess: () => void;
}

export function useManualInvoiceViewModel(_props: Readonly<UseManualInvoiceViewModelProps>): ManualInvoiceViewModel {
  const t = useAppTranslation(Translation.Dashboard.BillingManual);
  const profileLabels = useAppTranslation(Translation.Profile.Parent);
  const labels = buildManualInvoiceLabels(t);
  const router = useRouter();

  const { canCreate, canSendEmail } = useInvoicePermissions();

  const selectedParentId = useManualInvoiceUiStore(state => state.selectedParentId);
  const setSelectedParentId = useManualInvoiceUiStore(state => state.setSelectedParentId);
  const setIsSubmitting = useManualInvoiceUiStore(state => state.setIsSubmitting);
  const setShowSuccess = useManualInvoiceUiStore(state => state.setShowSuccess);
  const isSubmitting = useManualInvoiceUiStore(state => state.isSubmitting);
  const showSuccess = useManualInvoiceUiStore(state => state.showSuccess);
  const dismissSuccess = useManualInvoiceUiStore(state => state.dismissSuccess);

  const { control, handleSubmit, errors, setValue, currentParentId } = useInvoiceForm(labels);
  const { totalFormatted, draftCurrency } = useDraftTotals(control);

  const onParentChange = useCallback(
    (parentId: string | null) => {
      setSelectedParentId(parentId);
    },
    [setSelectedParentId]
  );

  useResetStudentOnParentChange(currentParentId ?? "", setValue);
  useAutoDismissOnSuccess(showSuccess, dismissSuccess);
  useSyncFormParentIdToStore({ currentParentId, selectedParentId, onParentChange });

  const onSubmit = useCreateManualInvoice(setIsSubmitting, setShowSuccess);

  const onBack = useCallback(() => {
    router.push("/billing");
  }, [router]);

  const onSubmitClick = buildSubmitHandler(handleSubmit, onSubmit, false);
  const onSubmitAndSendEmailClick = buildSubmitHandler(handleSubmit, onSubmit, true);

  return {
    labels,
    profileLabels,
    selectedParentId,
    control,
    errors,
    totalFormatted,
    draftCurrency,
    canCreate,
    canSendEmail,
    isSubmitting,
    showSuccess,
    onBack,
    onSubmitClick,
    onSubmitAndSendEmailClick,
    onDismissSuccess: dismissSuccess,
  };
}
