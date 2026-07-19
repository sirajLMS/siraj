"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormSetValue,
  useForm,
  useWatch,
} from "react-hook-form";
import { AppPermission, CurrencyCode, InvoiceType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createManualInvoiceMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useManualInvoiceUiStore } from "@/frontend/common/stores/manualInvoiceUiStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  type ManualInvoiceFormData,
  manualInvoiceSchema,
} from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { ManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { buildManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import { formatDraftTotal } from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";
import { useRouter } from "@/shared/i18n/navigation";
import { useAppTranslation } from "@/shared/locale";

export type UseManualInvoiceViewModelProps = Record<string, never>;

export interface ManualInvoiceViewModel {
  readonly labels: ManualInvoiceLabels;
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

function buildDefaultFormValues(): ManualInvoiceFormData {
  return {
    parentId: "",
    studentId: "",
    feeAmount: "",
    currency: CurrencyCode.Usd,
    issueDate: "",
    dueDate: "",
    billingMonths: [],
  };
}

function buildSubmitHandler(
  handleSubmit: UseFormHandleSubmit<ManualInvoiceFormData>,
  onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void,
  sendEmail: boolean
): () => void {
  return () => {
    handleSubmit(data => {
      onSubmit(data, sendEmail);
    })();
  };
}

function useResetStudentOnParentChange(
  currentParentId: string,
  setValue: UseFormSetValue<ManualInvoiceFormData>
): void {
  useEffect(() => {
    if (currentParentId) {
      setValue("studentId", "");
    }
  }, [currentParentId, setValue]);
}

function useAutoDismissOnSuccess(showSuccess: boolean, onDismissSuccess: () => void): void {
  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);
}

export function useManualInvoiceViewModel(_props: Readonly<UseManualInvoiceViewModelProps>): ManualInvoiceViewModel {
  const t = useAppTranslation().dashboardTranslations.billingManual;
  const labels = buildManualInvoiceLabels(t);
  const router = useRouter();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
  const canSendEmail = hasPermission(AppPermission.SystemDispatchEmail);

  const selectedParentId = useManualInvoiceUiStore(state => state.selectedParentId);
  const setSelectedParentId = useManualInvoiceUiStore(state => state.setSelectedParentId);
  const isSubmitting = useManualInvoiceUiStore(state => state.isSubmitting);
  const setIsSubmitting = useManualInvoiceUiStore(state => state.setIsSubmitting);
  const showSuccess = useManualInvoiceUiStore(state => state.showSuccess);
  const setShowSuccess = useManualInvoiceUiStore(state => state.setShowSuccess);
  const dismissSuccess = useManualInvoiceUiStore(state => state.dismissSuccess);

  const schema = manualInvoiceSchema(labels.validation);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ManualInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultFormValues(),
  });

  const feeAmount = useWatch({ control, name: "feeAmount" });
  const billingMonths = useWatch({ control, name: "billingMonths" });
  const draftCurrency = useWatch({ control, name: "currency" }) ?? CurrencyCode.Usd;
  const currentParentId = useWatch({ control, name: "parentId" });
  const monthCount = billingMonths.length;
  const totalFormatted = formatDraftTotal(feeAmount, monthCount);

  const onParentChange = useCallback(
    (parentId: string | null) => {
      setSelectedParentId(parentId);
    },
    [setSelectedParentId]
  );

  useResetStudentOnParentChange(currentParentId ?? "", setValue);
  useAutoDismissOnSuccess(showSuccess, dismissSuccess);

  useEffect(() => {
    if ((currentParentId ?? "") !== selectedParentId) {
      onParentChange((currentParentId ?? "") || null);
    }
  }, [currentParentId, onParentChange, selectedParentId]);

  const [createManualInvoiceMutation] = useMutation(createManualInvoiceMutationDocument, {
    onCompleted: () => {
      setIsSubmitting(false);
      setShowSuccess(true);
    },
    onError: error => {
      setIsSubmitting(false);
      logger.error("Create manual invoice failed:", { error });
    },
  });

  const onSubmit = useCallback(
    (data: ManualInvoiceFormData, sendEmail: boolean) => {
      setIsSubmitting(true);
      createManualInvoiceMutation({
        variables: {
          parentId: data.parentId,
          studentId: data.studentId ?? null,
          amount: data.feeAmount,
          currency: data.currency,
          invoiceType: InvoiceType.Manual,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          exchangeRateSnapshot: null,
          exchangeRateSource: null,
          billingMonths: null,
          sendEmail,
        },
      }).catch(() => {});
    },
    [createManualInvoiceMutation, setIsSubmitting]
  );

  const onBack = useCallback(() => {
    router.push("/billing");
  }, [router]);

  const onSubmitClick = buildSubmitHandler(handleSubmit, onSubmit, false);
  const onSubmitAndSendEmailClick = buildSubmitHandler(handleSubmit, onSubmit, true);

  return {
    labels,
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
