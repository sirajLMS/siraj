"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { createPackagePlanFormSchema } from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import {
  usePackagePlanArchive,
  usePackagePlanSubmit,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.actions.hooks";
import { PACKAGES_PATH } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.helpers";
import {
  useExistingPackagePlanForm,
  useSuccessAutoDismiss,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.hooks";
import type {
  UsePackagePlanFormViewModel,
  UsePackagePlanFormViewModelProps,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPackagePlans } from "@/shared/locale/namespaces";

export type { UsePackagePlanFormViewModel, UsePackagePlanFormViewModelProps };

export function usePackagePlanFormViewModel({
  planId,
}: Readonly<UsePackagePlanFormViewModelProps> = {}): UsePackagePlanFormViewModel {
  const t = useAppTranslation(DashboardAccountingPackagePlans);
  const router = useRouter();
  const isEditing = Boolean(planId);

  const schema = useMemo(() => createPackagePlanFormSchema(t), [t]);

  const navigateBack = useCallback(() => {
    router.push(PACKAGES_PATH);
  }, [router]);

  const { form, existing, loadingExisting, catalogData } = useExistingPackagePlanForm({
    planId: planId ?? "",
    isEditing,
    schema,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  useSuccessAutoDismiss(showSuccess, setShowSuccess);

  const { creating, updating, onSubmit } = usePackagePlanSubmit({
    form,
    existing,
    catalogData,
    planId: planId ?? "",
    isEditing,
    t,
    navigateBack,
    setShowSuccess,
    setSubmitError,
  });

  const { archiving, archiveDialogOpen, setArchiveDialogOpen, onArchive } = usePackagePlanArchive({
    planId: planId ?? "",
    t,
    navigateBack,
    setShowSuccess,
    setSubmitError,
  });

  const onDismissSuccess = useCallback(() => setShowSuccess(false), []);
  const onDismissError = useCallback(() => setSubmitError(null), []);

  return {
    t,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isSubmitting: creating || updating,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    existing,
    onSubmit,
    onArchive,
    archiveDialogOpen,
    setArchiveDialogOpen,
    archiving,
    onDismissSuccess,
    onDismissError,
  };
}
