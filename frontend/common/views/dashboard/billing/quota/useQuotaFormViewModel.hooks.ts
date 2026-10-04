import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  quotasQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { logger } from "@/frontend/common/utils/logger";
import type { QuotaFormData } from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import {
  appendCreatedQuota,
  buildCreateInput,
  buildUpdateInput,
  QUOTAS_PATH,
  replaceQuotaDetailCache,
  replaceQuotaInListCache,
  SUCCESS_AUTO_DISMISS_MS,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.helpers";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface UseQuotaFormSubmitParams {
  readonly isEditing: boolean;
  readonly quotaId: string | undefined;
  readonly existingStatus: QuotaStatus | null;
  readonly labels: QuotaLabels;
}

export interface UseQuotaFormSubmitResult {
  readonly onSubmit: (data: QuotaFormData) => Promise<void>;
  readonly submitting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

function useAutoDismiss(active: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(onDismiss, SUCCESS_AUTO_DISMISS_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [active, onDismiss]);
}

export function useQuotaFormSubmit({
  isEditing,
  quotaId,
  existingStatus,
  labels,
}: Readonly<UseQuotaFormSubmitParams>): UseQuotaFormSubmitResult {
  const router = useRouter();
  const [createQuotaMutation, { loading: creating }] = useMutation(createQuotaMutationDocument);
  const [updateQuotaMutation, { loading: updating }] = useMutation(updateQuotaMutationDocument);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDismissSuccess = useCallback(() => setShowSuccess(false), []);
  const onDismissError = useCallback(() => setSubmitError(null), []);

  useAutoDismiss(showSuccess, onDismissSuccess);

  const onSubmit = useCallback(
    async (data: QuotaFormData) => {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        if (isEditing) {
          if (!quotaId) throw new Error("Missing quota ID for update");
          const input = buildUpdateInput(data, existingStatus);
          await updateQuotaMutation({
            variables: { id: quotaId, input },
            update: (cache, { data: mutationData }) => {
              const updated = mutationData?.updateQuota;
              if (!updated) return;
              cache.updateQuery({ query: quotasQueryDocument }, replaceQuotaInListCache(quotaId, updated));
              cache.updateQuery(
                { query: quotaQueryDocument, variables: { id: quotaId } },
                replaceQuotaDetailCache(updated)
              );
            },
          });
        } else {
          const input = buildCreateInput(data);
          await createQuotaMutation({
            variables: { input },
            update: (cache, { data: mutationData }) => {
              const created = mutationData?.createQuota;
              if (!created) return;
              cache.updateQuery({ query: quotasQueryDocument }, appendCreatedQuota(created));
            },
          });
        }
        setShowSuccess(true);
        router.push(QUOTAS_PATH);
      } catch (error) {
        setSubmitError(isEditing ? labels.errors.updateFailed : labels.errors.createFailed);
        if (error instanceof Error) {
          logger.error("Quota form submission failed", { error: error.message });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, quotaId, existingStatus, updateQuotaMutation, createQuotaMutation, router, labels]
  );

  return {
    onSubmit,
    submitting: creating || updating || isSubmitting,
    showSuccess,
    submitError,
    onDismissSuccess,
    onDismissError,
  };
}
