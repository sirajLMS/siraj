import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuotaKind, type QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaQuery } from "@/frontend/common/graphql/generated/gql/operations";

import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { type QuotaFormState, useQuotaStore } from "@/frontend/common/stores/quotaStore";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function useQuotaFormViewModel(quotaId?: string) {
  const t = useAppTranslation(DashboardBillingQuota);
  const router = useRouter();
  const formData = useQuotaStore(s => s.formData);
  const setFormData = useQuotaStore(s => s.setFormData);
  const resetFormData = useQuotaStore(s => s.resetFormData);

  const isEditing = Boolean(quotaId);

  const { loadingExisting, handleSubmit, snackbar, creating, updating } = useQuotaFormInternals({
    quotaId,
    isEditing,
    formData,
    setFormData,
    resetFormData,
    router,
    translations: t,
  });

  return {
    t,
    isEditing,
    formData,
    setFormData,
    handleSubmit,
    loading: creating || updating || loadingExisting,
    snackbarOpen: snackbar.open,
    snackbarMessage: snackbar.message,
    handleSnackbarClose: snackbar.close,
  };
}

interface QuotaFormInternalsArgs {
  readonly quotaId?: string;
  readonly isEditing: boolean;
  readonly formData: QuotaFormState;
  readonly setFormData: (data: Partial<QuotaFormState>) => void;
  readonly resetFormData: () => void;
  readonly router: ReturnType<typeof useRouter>;
  readonly translations: QuotaLabels;
}

interface SnackbarState {
  readonly open: boolean;
  readonly message: string;
  readonly close: () => void;
}

function useQuotaFormInternals({
  quotaId,
  isEditing,
  formData,
  setFormData,
  resetFormData,
  router,
  translations,
}: QuotaFormInternalsArgs) {
  const {
    data: existingData,
    loading: loadingExisting,
    refetch: refetchQuota,
  } = useQuery(quotaQueryDocument, {
    variables: { id: quotaId ?? "" },
    skip: !isEditing,
  });

  const [createQuotaMutation, { loading: creating }] = useMutation(createQuotaMutationDocument);
  const [updateQuotaMutation, { loading: updating }] = useMutation(updateQuotaMutationDocument);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (isEditing && existingData?.quota) {
      setFormData(hydrateFormFromQuota(existingData.quota));
    }
  }, [isEditing, existingData, setFormData]);

  const closeSnackbar = useCallback(() => setSnackbarOpen(false), []);

  const notifyError = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  const runUpdate = useCallback(async (): Promise<boolean> => {
    if (!quotaId) return false;
    const { data: latest } = await refetchQuota();
    const quota = latest?.quota;
    if (!quota) return false;
    try {
      await updateQuotaMutation({ variables: { id: quotaId, input: buildUpdateInput(formData, quota.status) } });
      return true;
    } catch {
      notifyError(translations.errors.updateFailed);
      return false;
    }
  }, [quotaId, refetchQuota, formData, updateQuotaMutation, notifyError, translations]);

  const runCreate = useCallback(async (): Promise<boolean> => {
    try {
      await createQuotaMutation({ variables: { input: buildCreateQuotaInput(formData) } });
      return true;
    } catch {
      notifyError(translations.errors.createFailed);
      return false;
    }
  }, [createQuotaMutation, formData, notifyError, translations]);

  const handleSubmit = useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      const succeeded = isEditing ? await runUpdate() : await runCreate();
      if (!succeeded) return;
      resetFormData();
      router.push("/quotas");
    },
    [isEditing, runUpdate, runCreate, resetFormData, router]
  );

  const snackbar: SnackbarState = { open: snackbarOpen, message: snackbarMessage, close: closeSnackbar };

  return { loadingExisting, handleSubmit, snackbar, creating, updating };
}

function hydrateFormFromQuota(q: NonNullable<QuotaQuery["quota"]>) {
  return {
    studentId: q.studentId ?? "",
    kind: q.kind ?? QuotaKind.Package,
    name: q.name ?? "",
    totalClasses: q.totalClasses ?? 0,
    validFrom: q.validFrom,
    validUntil: q.validUntil,
    periodType: q.periodType,
    periodDays: q.periodDays,
    priority: q.priority ?? 10,
  };
}

function buildUpdateInput(formData: QuotaFormState, status: QuotaStatus | null) {
  return {
    name: formData.name,
    validUntil: formData.validUntil,
    status,
    priority: formData.priority,
  };
}

function buildCreateQuotaInput(formData: QuotaFormState) {
  return {
    studentId: formData.studentId,
    kind: formData.kind,
    name: formData.name,
    totalClasses: formData.totalClasses,
    validFrom: formData.validFrom,
    validUntil: formData.validUntil,
    periodType: formData.periodType,
    periodDays: formData.periodDays,
    priority: formData.priority,
    idempotencyKey: null,
    rolloverPolicy: null,
  };
}
