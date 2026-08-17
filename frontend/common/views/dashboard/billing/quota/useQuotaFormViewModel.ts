import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type Control, type FieldErrors, type UseFormHandleSubmit, type UseFormReturn, useForm } from "react-hook-form";
import type { QuotasQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  QuotaKind,
  type QuotaStatus,
  type QuotaSubmitInput,
  type QuotaUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaQuery } from "@/frontend/common/graphql/generated/gql/operations";
import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  quotasQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { logger } from "@/frontend/common/utils/logger";
import {
  createQuotaSchema,
  type QuotaFormData,
  type QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

const SUCCESS_AUTO_DISMISS_MS = 3000;
const QUOTAS_PATH = "/quotas";

const CREATE_DEFAULT_VALUES: QuotaFormInput = {
  studentId: "",
  name: "",
  kind: QuotaKind.Package,
  totalClasses: 10,
  validFrom: null,
  validUntil: null,
  periodType: null,
  periodDays: null,
  priority: 10,
};

function replaceQuotaInListCache(
  quotaId: string,
  updated: QuotaQuery["quota"]
): (data: QuotasQuery | null) => QuotasQuery | null {
  return cached => {
    if (!cached?.quotas?.rows) return cached;
    return {
      ...cached,
      quotas: {
        ...cached.quotas,
        rows: cached.quotas.rows.map(row => (row.id === quotaId ? { ...row, ...updated } : row)),
      },
    };
  };
}

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
  const router = useRouter();
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

  const [createQuotaMutation, { loading: creating }] = useMutation(createQuotaMutationDocument);
  const [updateQuotaMutation, { loading: updating }] = useMutation(updateQuotaMutationDocument);

  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeSuccess = useCallback(() => setShowSuccess(false), []);
  const closeError = useCallback(() => setSubmitError(null), []);

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(closeSuccess, SUCCESS_AUTO_DISMISS_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, closeSuccess]);

  const onSubmit = useCallback(
    async (data: QuotaFormData) => {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        if (isEditing) {
          if (!quotaId) throw new Error("Missing quota ID for update");
          const input = buildUpdateInput(data, existingData?.quota?.status ?? null);
          await updateQuotaMutation({
            variables: { id: quotaId, input },
            update: (cache, { data: mutationData }) => {
              const updated = mutationData?.updateQuota;
              if (!updated) return;
              cache.updateQuery({ query: quotasQueryDocument }, replaceQuotaInListCache(quotaId, updated));
              cache.updateQuery({ query: quotaQueryDocument, variables: { id: quotaId } }, cached => {
                if (!cached?.quota) return cached;
                return { ...cached, quota: { ...cached.quota, ...updated } };
              });
            },
          });
        } else {
          const input = buildCreateInput(data);
          await createQuotaMutation({
            variables: { input },
            update: (cache, { data: mutationData }) => {
              const created = mutationData?.createQuota;
              if (!created) return;
              cache.updateQuery({ query: quotasQueryDocument }, cached => {
                if (!cached?.quotas?.rows) return cached;
                return {
                  ...cached,
                  quotas: {
                    ...cached.quotas,
                    rows: [...cached.quotas.rows, created],
                    totalCount: (cached.quotas.totalCount ?? 0) + 1,
                  },
                };
              });
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
    [isEditing, quotaId, existingData, updateQuotaMutation, createQuotaMutation, router, labels]
  );

  return {
    form,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isSubmitting: creating || updating || isSubmitting || loadingExisting,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    labels,
    onSubmit,
    onDismissSuccess: closeSuccess,
    onDismissError: closeError,
  };
}

function buildEditDefaults(quota: QuotaQuery["quota"]): QuotaFormInput {
  return {
    studentId: quota?.studentId ?? "",
    name: quota?.name ?? "",
    kind: quota?.kind ?? QuotaKind.Package,
    totalClasses: quota?.totalClasses ?? 10,
    validFrom: quota?.validFrom,
    validUntil: quota?.validUntil,
    periodType: quota?.periodType,
    periodDays: quota?.periodDays,
    priority: quota?.priority ?? 10,
  };
}

function buildCreateInput(data: QuotaFormData): QuotaSubmitInput {
  return {
    studentId: data.studentId,
    kind: data.kind,
    name: data.name,
    totalClasses: data.totalClasses,
    validFrom: data.validFrom ?? null,
    validUntil: data.validUntil ?? null,
    periodType: data.periodType ?? null,
    periodDays: data.periodDays ?? null,
    priority: data.priority,
    idempotencyKey: null,
    rolloverPolicy: null,
  };
}

function buildUpdateInput(data: QuotaFormData, status: QuotaStatus | null): QuotaUpdateInput {
  return {
    name: data.name,
    validUntil: data.validUntil ?? null,
    status,
    priority: data.priority,
  };
}
