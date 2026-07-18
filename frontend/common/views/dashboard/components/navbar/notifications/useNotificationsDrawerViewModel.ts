"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { AppPermission, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
import { classHref, ownProfileHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  NotificationDrawerAlert,
  NotificationMetadata,
  NotificationsDrawerViewModel,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

const REFETCH_QUERIES = [notificationAlertsQueryDocument, meQueryDocument] as const;

function isParentViewer(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function isAdminViewer(permissions: readonly AppPermission[]): boolean {
  return permissions.includes(AppPermission.DashboardViewMetrics) || permissions.includes(AppPermission.ComplaintsList);
}

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

export function useNotificationsDrawerViewModel(): NotificationsDrawerViewModel {
  const router = useRouter();
  const notifications = useNotifications();
  const t = useAppTranslation().dashboardTranslations.coreNotifications;
  const permissions = useUserStore(state => state.user?.permissions ?? state.permissions);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManageBilling = hasPermission(AppPermission.BillingUpdateStatusPaid);

  const drawerOpen = useNotificationsDrawerStore(state => state.drawerOpen);
  const openDrawer = useNotificationsDrawerStore(state => state.openDrawer);
  const closeDrawer = useNotificationsDrawerStore(state => state.closeDrawer);

  const { data, loading, error } = useQuery(notificationAlertsQueryDocument);

  const [markOneReadMutation] = useMutation(markNotificationReadMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const [markAllReadMutation] = useMutation(markNotificationsReadMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const [approvePaymentProof] = useMutation(approvePaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const [rejectPaymentProof] = useMutation(rejectPaymentProofMutationDocument, {
    refetchQueries: [...REFETCH_QUERIES],
  });

  const alerts = useMemo(() => mapAlerts(data?.notificationAlerts?.alerts), [data?.notificationAlerts?.alerts]);

  const unreadCount = data?.notificationAlerts?.unreadCount ?? 0;
  const totalCount = data?.notificationAlerts?.totalCount ?? 0;

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

  const handleViewEntity = useCallback(
    (metadata: NotificationMetadata, eventType?: NotificationEventType | null) => {
      switch (metadata.entityKind) {
        case "invoice": {
          router.push(isParentViewer(permissions) ? "/billing/invoices" : "/billing");
          return;
        }
        case "class": {
          const classInstanceId = metadata.classInstanceId ?? metadata.entityId;
          router.push(classHref(classInstanceId));
          return;
        }
        case "student": {
          const tab = eventType === NotificationEventType.StudentQuotaOverridden ? "quota" : "status";
          router.push(studentProfileTabHref(metadata.entityId, tab));
          return;
        }
        case "complaint": {
          router.push(isAdminViewer(permissions) ? "/complaints/manage" : "/complaints");
          return;
        }
        case "suggestion": {
          router.push("/suggestions");
          return;
        }
        case "paymentMethod": {
          router.push(ownProfileHref());
          return;
        }
        case "schedule": {
          router.push("/schedule");
          return;
        }
        default: {
          logger.warn("useNotificationsDrawerViewModel.handleViewEntity unknown entityKind", {
            entityKind: (metadata as NotificationMetadata).entityKind,
          });
          router.push("/");
        }
      }
    },
    [permissions, router]
  );

  const handleReschedule = useCallback(
    (classInstanceId: string) => {
      router.push(`/reschedule?classInstanceId=${classInstanceId}`);
    },
    [router]
  );

  const handleApproveInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      if (!canManageBilling) {
        logger.warn("useNotificationsDrawerViewModel.handleApproveInvoice denied — missing permission");
        notifications.show(t.errorLoading, { severity: "error" });
        return;
      }

      try {
        await approvePaymentProof({
          variables: { invoiceId, expectedVersion: null },
        });
        await markOneRead(deliveryId);
        notifications.show(t.title, { severity: "success" });
      } catch (mutationError) {
        logger.warn("useNotificationsDrawerViewModel.handleApproveInvoice failed", {
          deliveryId,
          invoiceId,
          error: mutationError instanceof Error ? mutationError.message : String(mutationError),
        });
        notifications.show(t.errorLoading, { severity: "error" });
      }
    },
    [approvePaymentProof, canManageBilling, markOneRead, notifications, t.errorLoading, t.title]
  );

  const handleRejectInvoice = useCallback(
    async (deliveryId: string, invoiceId: string) => {
      if (!canManageBilling) {
        logger.warn("useNotificationsDrawerViewModel.handleRejectInvoice denied — missing permission");
        notifications.show(t.errorLoading, { severity: "error" });
        return;
      }

      try {
        await rejectPaymentProof({
          variables: {
            invoiceId,
            rejectionReason: null,
            expectedVersion: null,
          },
        });
        await markOneRead(deliveryId);
        notifications.show(t.title, { severity: "success" });
      } catch (mutationError) {
        logger.warn("useNotificationsDrawerViewModel.handleRejectInvoice failed", {
          deliveryId,
          invoiceId,
          error: mutationError instanceof Error ? mutationError.message : String(mutationError),
        });
        notifications.show(t.errorLoading, { severity: "error" });
      }
    },
    [canManageBilling, markOneRead, notifications, rejectPaymentProof, t.errorLoading, t.title]
  );

  const handleManagePreferences = useCallback(() => {
    router.push(ownProfileHref());
  }, [router]);

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
