"use client";

import { useMutation } from "@apollo/client/react";
import {
  deleteInvoiceMutationDocument,
  sendPaymentReminderMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { AdminBillingQueries } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.queries";
import type { AdminBillingStoreBindings } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.store";
import type { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";

interface AdminBillingMutationsArgs {
  readonly actions: AdminBillingStoreBindings["actions"];
  readonly labels: ReturnType<typeof buildBillingLabels>;
  readonly tc: { readonly operationFailed: string };
  readonly t: { readonly reminderSent: string; readonly reminderFailed: string };
  readonly refetch: AdminBillingQueries["refetch"];
}

/**
 * Declares the delete-invoice and payment-reminder mutations. Completion and
 * failure both route through the store feedback and refresh the affected
 * queries so the grid and summary stay in step with the server.
 */
export function useAdminBillingMutations(args: Readonly<AdminBillingMutationsArgs>) {
  const { actions, labels, tc, t, refetch } = args;

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      actions.setDeleteTargetId(null);
      actions.showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetch.invoices();
      void refetch.summary();
      void refetch.credit();
    },
    onError: error => {
      logger.error("Delete invoice failed:", { error });
      actions.setDeleteTargetId(null);
      actions.showFeedback(tc.operationFailed, "error");
    },
  });

  const [sendReminderMutation] = useMutation(sendPaymentReminderMutationDocument, {
    onCompleted: data => {
      if (data.sendPaymentReminder?.success) {
        actions.showFeedback(t.reminderSent, "success");
      } else {
        actions.showFeedback(t.reminderFailed, "error");
      }
      actions.setSendingReminderId(null);
    },
    onError: error => {
      logger.error("Send reminder failed:", { error });
      actions.showFeedback(tc.operationFailed, "error");
      actions.setSendingReminderId(null);
    },
  });

  return { vm: { deletingInvoice }, deleteInvoiceMutation, sendReminderMutation };
}

export type AdminBillingMutations = ReturnType<typeof useAdminBillingMutations>;
