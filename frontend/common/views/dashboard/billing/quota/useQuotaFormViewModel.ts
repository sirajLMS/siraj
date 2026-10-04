import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Control, type FieldErrors, type UseFormHandleSubmit, type UseFormReturn, useForm } from "react-hook-form";
import { QuotaKind } from "@/frontend/common/graphql/generated/gql/graphql";
import { quotaQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import {
  createQuotaSchema,
  type QuotaFormData,
  type QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import {
  buildEditDefaults,
  CREATE_DEFAULT_VALUES,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.helpers";
import { useQuotaFormSubmit } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.hooks";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface UseQuotaFormViewModel {
  readonly form: UseFormReturn<QuotaFormInput, undefined, QuotaFormData>;
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly handleSubmit: UseFormHandleSubmit<QuotaFormInput, QuotaFormData>;
  readonly isSubmitting: boolean;
  readonly isEditing: boolean;
  readonly loadingExisting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly labels: QuotaLabels;
  readonly onSubmit: (data: QuotaFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

export interface UseQuotaFormViewModelProps {
  readonly quotaId?: string;
}

export function useQuotaFormViewModel({ quotaId }: Readonly<UseQuotaFormViewModelProps> = {}): UseQuotaFormViewModel {
  const labels = useAppTranslation(DashboardBillingQuota);
  const isEditing = Boolean(quotaId);

  const schema = createQuotaSchema(labels);

  const { data: existingData, loading: loadingExisting } = useQuery(quotaQueryDocument, {
    variables: { id: quotaId ?? "" },
    skip: !isEditing,
  });

  const editDefaultValues = buildEditDefaults(existingData?.quota ?? null);

  const form = useForm<QuotaFormInput, undefined, QuotaFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? editDefaultValues : CREATE_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isEditing && existingData?.quota) {
      const q = existingData.quota;
      form.reset({
        studentId: q.studentId ?? "",
        name: q.name ?? "",
        kind: q.kind ?? QuotaKind.Package,
        totalClasses: q.totalClasses ?? 10,
        validFrom: q.validFrom,
        validUntil: q.validUntil,
        periodType: q.periodType,
        periodDays: q.periodDays,
        priority: q.priority ?? 10,
      });
    }
  }, [isEditing, existingData, form]);

  const submit = useQuotaFormSubmit({
    isEditing,
    quotaId,
    existingStatus: existingData?.quota?.status ?? null,
    labels,
  });

  return {
    form,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isSubmitting: submit.submitting || loadingExisting,
    isEditing,
    loadingExisting,
    showSuccess: submit.showSuccess,
    submitError: submit.submitError,
    labels,
    onSubmit: submit.onSubmit,
    onDismissSuccess: submit.onDismissSuccess,
    onDismissError: submit.onDismissError,
  };
}
