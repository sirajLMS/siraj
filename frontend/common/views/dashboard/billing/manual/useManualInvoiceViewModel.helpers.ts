import type { UseFormHandleSubmit } from "react-hook-form";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";

export function buildDefaultFormValues(): ManualInvoiceFormData {
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

export function buildSubmitHandler(
  handleSubmit: UseFormHandleSubmit<ManualInvoiceFormData>,
  onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void,
  sendEmail: boolean
): () => void {
  return () => {
    void handleSubmit(data => {
      onSubmit(data, sendEmail);
    })();
  };
}
