import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { AppPermission, InvoiceType } from "@/frontend/common/graphql/generated/gql/graphql";
import { createManualInvoiceMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";

interface PermissionFlags {
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
}

export function useInvoicePermissions(): PermissionFlags {
  const hasPermission = useUserStore(state => state.hasPermission);
  return {
    canCreate: hasPermission(AppPermission.BillingCreateInvoice),
    canSendEmail: hasPermission(AppPermission.SystemDispatchEmail),
  };
}

export function useCreateManualInvoice(
  setIsSubmitting: (isSubmitting: boolean) => void,
  setShowSuccess: (showSuccess: boolean) => void
): (data: ManualInvoiceFormData, sendEmail: boolean) => void {
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

  return useCallback(
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
}
