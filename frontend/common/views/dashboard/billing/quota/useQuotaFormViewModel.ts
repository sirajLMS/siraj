import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export function useQuotaFormViewModel(quotaId?: string) {
  const t = useAppTranslation(DashboardBillingQuota);
  const router = useRouter();
  const { formData, setFormData, resetFormData } = useQuotaStore();

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
      const q = existingData.quota as unknown as QuotaItem;
      setFormData({
        studentId: q.studentId,
        kind: q.kind as QuotaKind,
        name: q.name,
        totalClasses: q.totalClasses,
        validFrom: q.validFrom,
        validUntil: q.validUntil,
        periodType: q.periodType as QuotaPeriodType | null,
        periodDays: q.periodDays,
        priority: q.priority,
      });
    }
  }, [isEditing, existingData, setFormData]);

  const [createQuotaMutation, { loading: creating }] = useMutation(createQuotaMutationDocument);

  const [updateQuotaMutation, { loading: updating }] = useMutation(updateQuotaMutationDocument);

  const handleSubmit = useCallback(async () => {
    if (isEditing && quotaId) {
      // Refetch to get latest version before updating (avoids stale version conflict)
      const { data: latest } = await refetchQuota();
      if (!latest?.quota) return;
      const q = latest.quota as unknown as QuotaItem;
      try {
        await updateQuotaMutation({
          variables: {
            id: quotaId,
            input: {
              name: formData.name,
              validUntil: formData.validUntil,
              status: q.status as QuotaStatus,
              priority: formData.priority,
              version: q.version,
            },
          },
        });
      } catch {
        // Version conflict or network error — user can retry
        return;
      }
    } else {
      await createQuotaMutation({
        variables: {
          input: {
            studentId: formData.studentId,
            kind: formData.kind as QuotaKind,
            name: formData.name,
            totalClasses: formData.totalClasses,
            validFrom: formData.validFrom,
            validUntil: formData.validUntil,
            periodType: formData.periodType as QuotaPeriodType | null,
            periodDays: formData.periodDays,
            priority: formData.priority,
          },
        },
      });
    }
    resetFormData();
    router.push("/quotas");
  }, [isEditing, quotaId, refetchQuota, formData, createQuotaMutation, updateQuotaMutation, resetFormData, router]);

  return {
    t,
    isEditing,
    formData,
    setFormData,
    handleSubmit,
    loading: creating || updating || loadingExisting,
  };
}
