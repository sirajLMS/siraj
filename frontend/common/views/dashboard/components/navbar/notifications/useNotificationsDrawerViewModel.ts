"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { AppPermission, type NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import {
  approvePaymentProofMutationDocument,
  rejectPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/billing-management.documents";
import {
  markNotificationReadMutationDocument,
  markNotificationsReadMutationDocument,
  notificationAlertsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";
import { useNotificationsDrawerStore } from "@/frontend/common/stores/notificationsDrawerStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { ownProfileHref } from "@/frontend/common/utils/profileHref";
import { resolveNotificationDeepLink } from "@/frontend/common/views/dashboard/components/navbar/notifications/notificationDeepLinks";
import type {
  NotificationDrawerAlert,
  NotificationMetadata,
  NotificationsDrawerViewModel,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import { useRouter } from "@/shared/i18n/navigation";
import { useAppTranslation } from "@/shared/locale";

const REFETCH_QUERIES = [{ query: notificationAlertsQueryDocument }, { query: meQueryDocument }] as const;

function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.entityKind === "string" && typeof record.entityId === "string";
}

function parseNotificationMetadata(value: unknown): NotificationMetadata | null {
  return isNotificationMetadata(value) ? value : null;
}

type RawNotificationAlert = NonNullable<
  NonNullable<Operations.NotificationAlertsQuery["notificationAlerts"]>["alerts"]
>[number];

function mapAlerts(rawAlerts: RawNotificationAlert[] | null | undefined): readonly NotificationDrawerAlert[] {
  if (!rawAlerts) {
    return [];
  }

  return rawAlerts.map((alert: RawNotificationAlert) => ({
    id: alert.id,
    deliveryId: alert.deliveryId,
    type: alert.type,
    eventType: alert.eventType,
    channel: alert.channel,
    metadata: parseNotificationMetadata(alert.metadata),
    title: alert.title,
    body: alert.body,
    createdAt: alert.createdAt,
    severity: alert.severity,
    readAt: alert.readAt,
  }));
}

type MarkOneReadFn = (deliveryId: string) => Promise<void>;

interface InvoiceProofHandlerDeps {
  readonly canManageBilling: boolean;
  readonly markOneRead: MarkOneReadFn;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly successMessage: string;
  readonly errorMessage: string;
}

async function _runInvoiceProofAction(
  action: "approve" | "reject",
  deliveryId: string,
  invoiceId: string,
  mutation: () => Promise<unknown>,
  deps: Readonly<InvoiceProofHandlerDeps>
): Promise<void> {
  if (!deps.canManageBilling) {
    logger.warn(
      `useNotificationsDrawerViewModel.handle${action === "approve" ? "Approve" : "Reject"}Invoice denied — missing permission`
    );
    deps.notifications.show(deps.errorMessage, { severity: "error" });
    return;
  }

  try {
    await mutation();
    await deps.markOneRead(deliveryId);
    deps.notifications.show(deps.successMessage, { severity: "success" });
  } catch (mutationError) {
    logger.warn(`useNotificationsDrawerViewModel.handle${action === "approve" ? "Approve" : "Reject"}Invoice failed`, {
      deliveryId,
      invoiceId,
      error: mutationError instanceof Error ? mutationError.message : String(mutationError),
    });
    deps.notifications.show(deps.errorMessage, { severity: "error" });
  }
}

function useMarkReadHandlers(): {
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

interface InvoiceProofHandlersInput {
  readonly canManageBilling: boolean;
  readonly markOneRead: MarkOneReadFn;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly successMessage: string;
  readonly errorMessage: string;
}

function useInvoiceProofHandlers(input: Readonly<InvoiceProofHandlersInput>): {
  handleApproveInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  handleRejectInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
} {
  const [approvePaymentProof] = useMutation(approvePaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });
  const [rejectPaymentProof] = useMutation(rejectPaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const deps: InvoiceProofHandlerDeps = useMemo(
    () => ({
      canManageBilling: input.canManageBilling,
      markOneRead: input.markOneRead,
      notifications: input.notifications,
      successMessage: input.successMessage,
      errorMessage: input.errorMessage,
    }),
    [input.canManageBilling, input.markOneRead, input.notifications, input.successMessage, input.errorMessage]
  );

  const handleApproveInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      await _runInvoiceProofAction(
        "approve",
        deliveryId,
        invoiceId,
        () => approvePaymentProof({ variables: { invoiceId, expectedVersion: null } }),
        deps
      );
    },
    [approvePaymentProof, deps]
  );

  const handleRejectInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      await _runInvoiceProofAction(
        "reject",
        deliveryId,
        invoiceId,
        () => rejectPaymentProof({ variables: { invoiceId, rejectionReason: null, expectedVersion: null } }),
        deps
      );
    },
    [rejectPaymentProof, deps]
  );

  return { handleApproveInvoice, handleRejectInvoice };
}

function useNavigationHandlers(permissions: readonly AppPermission[]): {
  handleViewEntity: (metadata: NotificationMetadata, eventType?: NotificationEventType | null) => void;
  handleReschedule: (classInstanceId: string) => void;
  handleManagePreferences: () => void;
} {
  const router = useRouter();

  const handleViewEntity = useCallback(
    (metadata: NotificationMetadata, eventType?: NotificationEventType | null) => {
      const href = resolveNotificationDeepLink(metadata, permissions, eventType);
      if (href === "/") {
        logger.warn("useNotificationsDrawerViewModel.handleViewEntity unknown entityKind", {
          entityKind: metadata.entityKind,
        });
      }
      router.push(href);
    },
    [permissions, router]
  );

  const handleReschedule = useCallback(
    (classInstanceId: string) => {
      router.push(`/reschedule?classInstanceId=${classInstanceId}`);
    },
    [router]
  );

  const handleManagePreferences = useCallback(() => {
    router.push(ownProfileHref());
  }, [router]);

  return { handleViewEntity, handleReschedule, handleManagePreferences };
}

export function useNotificationsDrawerViewModel(): NotificationsDrawerViewModel {
  const notifications = useNotifications();
  const t = useAppTranslation().dashboardTranslations.coreNotifications;
  const permissions = useUserStore(state => state.user?.permissions ?? state.permissions);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManageBilling = hasPermission(AppPermission.BillingUpdateStatusPaid);

  const drawerOpen = useNotificationsDrawerStore(state => state.drawerOpen);
  const openDrawer = useNotificationsDrawerStore(state => state.openDrawer);
  const closeDrawer = useNotificationsDrawerStore(state => state.closeDrawer);

  const canViewAlerts = hasPermission(AppPermission.NotificationViewAlerts);

  const { data, loading, error } = useQuery(notificationAlertsQueryDocument, {
    skip: !canViewAlerts,
  });

  const alerts = useMemo(() => mapAlerts(data?.notificationAlerts?.alerts), [data?.notificationAlerts?.alerts]);

  const unreadCount = data?.notificationAlerts?.unreadCount ?? 0;
  const totalCount = data?.notificationAlerts?.totalCount ?? 0;

  const { markOneRead, markAllRead } = useMarkReadHandlers();
  const { handleViewEntity, handleReschedule, handleManagePreferences } = useNavigationHandlers(permissions);
  const { handleApproveInvoice, handleRejectInvoice } = useInvoiceProofHandlers({
    canManageBilling,
    markOneRead,
    notifications,
    successMessage: t.title,
    errorMessage: t.errorLoading,
  });

  return {
    alerts,
    unreadCount,
    totalCount,
    loading,
    error,
    drawerOpen,
    openDrawer,
    closeDrawer,
    markOneRead,
    markAllRead,
    handleViewEntity,
    handleReschedule,
    handleApproveInvoice,
    handleRejectInvoice,
    handleManagePreferences,
  };
}
