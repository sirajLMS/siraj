import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuotaKind } from "@/frontend/common/graphql/generated/gql/graphql-types";

import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export function useQuotaFormViewModel(quotaId?: string) {
  const t = useAppTranslation(DashboardBillingQuota);
  const router = useRouter();
  const formData = useQuotaStore(s => s.formData);
  const setFormData = useQuotaStore(s => s.setFormData);
  const resetFormData = useQuotaStore(s => s.resetFormData);

  const isEditing = Boolean(quotaId);

  const {
    data: existingData,
    loading: loadingExisting,
    refetch: refetchQuota,
  } = useQuery(quotaQueryDocument, {
    variables: { id: quotaId ?? "" },
    skip: !isEditing,
  });

  useEffect(() => {
    if (isEditing && existingData?.quota) {
      const q = existingData.quota;
      setFormData({
        studentId: q.studentId ?? "",
        kind: q.kind ?? QuotaKind.Package,
        name: q.name ?? "",
        totalClasses: q.totalClasses ?? 0,
        validFrom: q.validFrom,
        validUntil: q.validUntil,
        periodType: q.periodType,
        periodDays: q.periodDays,
        priority: q.priority ?? 10,
      });
    }
  }, [isEditing, existingData, setFormData]);

  const [createQuotaMutation, { loading: creating }] = useMutation(createQuotaMutationDocument);

  const [updateQuotaMutation, { loading: updating }] = useMutation(updateQuotaMutationDocument);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isEditing && quotaId) {
        const { data: latest } = await refetchQuota();
        if (!latest?.quota) return;
        const q = latest.quota;
        try {
          await updateQuotaMutation({
            variables: {
              id: quotaId,
              input: {
                name: formData.name,
                validUntil: formData.validUntil,
                status: q.status,
                priority: formData.priority,
              },
            },
          });
        } catch {
          setSnackbarMessage(t.errors.updateFailed);
          setSnackbarOpen(true);
          return;
        }
      } else {
        try {
          await createQuotaMutation({
            variables: {
              input: {
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
              },
            },
          });
        } catch {
          setSnackbarMessage(t.errors.createFailed);
          setSnackbarOpen(true);
          return;
        }
      }
      resetFormData();
      router.push("/quotas");
    },
    [isEditing, quotaId, refetchQuota, formData, createQuotaMutation, updateQuotaMutation, resetFormData, router, t]
  );

  return {
    t,
    isEditing,
    formData,
    setFormData,
    handleSubmit,
    loading: creating || updating || loadingExisting,
    snackbarOpen,
    snackbarMessage,
    handleSnackbarClose,
  };
}
