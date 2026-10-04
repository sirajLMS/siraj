"use client";

import { useQuery } from "@apollo/client/react";

import { useNotifications } from "@toolpad/core/useNotifications";

import { useCallback, useMemo } from "react";

import { AppPermission, type NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";

import { notificationAlertsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";

import { useNotificationsDrawerStore } from "@/frontend/common/stores/notificationsDrawerStore";

import { useUserStore } from "@/frontend/common/stores/userStore";

import { logger } from "@/frontend/common/utils/logger";

import { ownProfileHref } from "@/frontend/common/utils/profileHref";

import { resolveNotificationDeepLink } from "@/frontend/common/views/dashboard/components/navbar/notifications/notificationDeepLinks";
import type { NotificationsDrawerViewModel } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

import { mapAlerts } from "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel.helpers";
import {
  useInvoiceProofHandlers,
  useMarkReadHandlers,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel.hooks";

import { useRouter } from "@/shared/i18n/navigation";

import { Translation, useAppTranslation } from "@/shared/locale";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

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
      router.push(`/schedule/tracking/reschedule?classInstanceId=${classInstanceId}`);
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

  const labels = useAppTranslation(Translation.Notifications);

  const coreNotifications = useAppTranslation(Translation.Dashboard.CoreNotifications);

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
    successMessage: coreNotifications.title,
    errorMessage: coreNotifications.errorLoading,
  });

  return {
    labels,

    errorLoadingMessage: coreNotifications.errorLoading,

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
