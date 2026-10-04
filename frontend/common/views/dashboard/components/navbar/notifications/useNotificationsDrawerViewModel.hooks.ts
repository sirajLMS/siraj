"use client";

import { useMutation } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import {
  approvePaymentProofMutationDocument,
  rejectPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/billing-management.documents";
import {
  markNotificationReadMutationDocument,
  markNotificationsReadMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";
import { logger } from "@/frontend/common/utils/logger";
import { REFETCH_QUERIES } from "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel.constants";

export type MarkOneReadFn = (deliveryId: string) => Promise<void>;

interface InvoiceProofHandlerDeps {
  readonly canManageBilling: boolean;
  readonly markOneRead: MarkOneReadFn;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly successMessage: string;
  readonly errorMessage: string;
}

export function useMarkReadHandlers(): {
  markOneRead: MarkOneReadFn;
  markAllRead: () => Promise<void>;
} {
  const [markOneReadMutation] = useMutation(markNotificationReadMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const [markAllReadMutation] = useMutation(markNotificationsReadMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const markOneRead = useCallback(
    async (deliveryId: string) => {
      try {
        await markOneReadMutation({ variables: { deliveryId } });
      } catch (mutationError) {
        logger.warn("useNotificationsDrawerViewModel.markOneRead failed", {
          deliveryId,
          error: mutationError instanceof Error ? mutationError.message : String(mutationError),
        });
      }
    },
    [markOneReadMutation]
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllReadMutation();
    } catch (mutationError) {
      logger.warn("useNotificationsDrawerViewModel.markAllRead failed", {
        error: mutationError instanceof Error ? mutationError.message : String(mutationError),
      });
    }
  }, [markAllReadMutation]);

  return { markOneRead, markAllRead };
}

async function runInvoiceProofAction(
  action: "approve" | "reject",
  deliveryId: string,
  invoiceId: string,
  mutation: () => Promise<unknown>,
  deps: Readonly<InvoiceProofHandlerDeps>
): Promise<void> {
  const actionLabel = action === "approve" ? "Approve" : "Reject";

  if (!deps.canManageBilling) {
    logger.warn(`useNotificationsDrawerViewModel.handle${actionLabel}Invoice denied — missing permission`);
    deps.notifications.show(deps.errorMessage, { severity: "error" });
    return;
  }

  try {
    await mutation();

    await deps.markOneRead(deliveryId);

    deps.notifications.show(deps.successMessage, { severity: "success" });
  } catch (mutationError) {
    logger.warn(`useNotificationsDrawerViewModel.handle${actionLabel}Invoice failed`, {
      deliveryId,
      invoiceId,
      error: mutationError instanceof Error ? mutationError.message : String(mutationError),
    });

    deps.notifications.show(deps.errorMessage, { severity: "error" });
  }
}

export function useInvoiceProofHandlers(deps: Readonly<InvoiceProofHandlerDeps>): {
  handleApproveInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  handleRejectInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
} {
  const [approvePaymentProof] = useMutation(approvePaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const [rejectPaymentProof] = useMutation(rejectPaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const invoiceDeps: InvoiceProofHandlerDeps = useMemo(
    () => ({
      canManageBilling: deps.canManageBilling,
      markOneRead: deps.markOneRead,
      notifications: deps.notifications,
      successMessage: deps.successMessage,
      errorMessage: deps.errorMessage,
    }),
    [deps.canManageBilling, deps.markOneRead, deps.notifications, deps.successMessage, deps.errorMessage]
  );

  const handleApproveInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      await runInvoiceProofAction(
        "approve",
        deliveryId,
        invoiceId,
        () => approvePaymentProof({ variables: { invoiceId, expectedVersion: null } }),
        invoiceDeps
      );
    },
    [approvePaymentProof, invoiceDeps]
  );

  const handleRejectInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      await runInvoiceProofAction(
        "reject",
        deliveryId,
        invoiceId,
        () => rejectPaymentProof({ variables: { invoiceId, rejectionReason: null, expectedVersion: null } }),
        invoiceDeps
      );
    },
    [rejectPaymentProof, invoiceDeps]
  );

  return { handleApproveInvoice, handleRejectInvoice };
}
