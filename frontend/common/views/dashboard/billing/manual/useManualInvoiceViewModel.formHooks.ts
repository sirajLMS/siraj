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
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type ManualInvoiceFormData,
  manualInvoiceSchema,
} from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { ManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { buildDefaultFormValues } from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.helpers";
import { formatDraftTotal } from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

export function useResetStudentOnParentChange(
  currentParentId: string,
  setValue: UseFormSetValue<ManualInvoiceFormData>
): void {
  useEffect(() => {
    if (currentParentId) {
      setValue("studentId", "");
    }
  }, [currentParentId, setValue]);
}

export function useAutoDismissOnSuccess(showSuccess: boolean, onDismissSuccess: () => void): void {
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

interface ParentChangeSync {
  readonly currentParentId: string | null;
  readonly selectedParentId: string | null;
  readonly onParentChange: (parentId: string | null) => void;
}

export function useSyncFormParentIdToStore({
  currentParentId,
  selectedParentId,
  onParentChange,
}: ParentChangeSync): void {
  useEffect(() => {
    if ((currentParentId ?? "") !== selectedParentId) {
      onParentChange((currentParentId ?? "") || null);
    }
  }, [currentParentId, onParentChange, selectedParentId]);
}

interface DraftTotals {
  readonly totalFormatted: string;
  readonly draftCurrency: CurrencyCode;
}

export function useDraftTotals(control: Control<ManualInvoiceFormData>): DraftTotals {
  const feeAmount = useWatch({ control, name: "feeAmount" });
  const billingMonths = useWatch({ control, name: "billingMonths" });
  const draftCurrency = useWatch({ control, name: "currency" }) ?? CurrencyCode.Usd;
  const monthCount = billingMonths.length;
  const totalFormatted = formatDraftTotal(feeAmount, monthCount);
  return { totalFormatted, draftCurrency };
}

interface InvoiceForm {
  readonly control: Control<ManualInvoiceFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly setValue: UseFormSetValue<ManualInvoiceFormData>;
  readonly currentParentId: string | null;
}

export function useInvoiceForm(labels: ManualInvoiceLabels): InvoiceForm {
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
  const currentParentId = useWatch({ control, name: "parentId" });
  return { control, handleSubmit, errors, setValue, currentParentId };
}
