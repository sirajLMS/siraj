"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormSetValue,
  useForm,
  useWatch,
} from "react-hook-form";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  type ManualInvoiceFormData,
  manualInvoiceSchema,
} from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ManualInvoiceLabels,
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { formatDraftTotal } from "@/frontend/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

export interface UseManualInvoiceViewModelProps {
  readonly labels: ManualInvoiceLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly parentsLoading: boolean;
  readonly studentsLoading: boolean;
  readonly onBack: () => void;
  readonly onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void;
  readonly onDismissSuccess: () => void;
  readonly onParentChange: (parentId: string | null) => void;
}

export interface ManualInvoiceViewModel {
  readonly labels: ManualInvoiceLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly draftCurrency: CurrencyCode;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly parentsLoading: boolean;
  readonly studentsLoading: boolean;
  readonly showSuccess: boolean;
  readonly onBack: () => void;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
  readonly onDismissSuccess: () => void;
}

const SUCCESS_AUTO_DISMISS_MS = 3000;

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

function useParentChangeSync(currentParentId: string, onParentChange: (parentId: string | null) => void): void {
  useEffect(() => {
    onParentChange(currentParentId || null);
  }, [currentParentId, onParentChange]);
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
    }, SUCCESS_AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);
}

export function useManualInvoiceViewModel(props: Readonly<UseManualInvoiceViewModelProps>): ManualInvoiceViewModel {
  const {
    labels,
    parentOptions,
    studentOptions,
    isSubmitting,
    showSuccess,
    canCreate,
    canSendEmail,
    parentsLoading,
    studentsLoading,
    onBack,
    onSubmit,
    onDismissSuccess,
    onParentChange,
  } = props;

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

  useParentChangeSync(currentParentId ?? "", onParentChange);
  useResetStudentOnParentChange(currentParentId ?? "", setValue);
  useAutoDismissOnSuccess(showSuccess, onDismissSuccess);

  const onSubmitClick = buildSubmitHandler(handleSubmit, onSubmit, false);
  const onSubmitAndSendEmailClick = buildSubmitHandler(handleSubmit, onSubmit, true);

  return {
    labels,
    parentOptions,
    studentOptions,
    control,
    errors,
    totalFormatted,
    draftCurrency,
    canCreate,
    canSendEmail,
    isSubmitting,
    parentsLoading,
    studentsLoading,
    showSuccess,
    onBack,
    onSubmitClick,
    onSubmitAndSendEmailClick,
    onDismissSuccess,
  };
}
