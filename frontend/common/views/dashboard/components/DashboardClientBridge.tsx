"use client";

import { useApolloClient } from "@apollo/client/react";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect } from "react";
import { AppPermission, type User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { logger } from "@/frontend/common/utils/logger";
import { UserStoreInitializer } from "@/frontend/common/views/dashboard/components/client/UserStoreInitializer";
import { DashboardLayout } from "@/frontend/common/views/dashboard/components/DashboardLayout";
import { NotificationDrawer } from "@/frontend/common/views/dashboard/components/navbar/notifications/NotificationDrawer";
import { useNotificationsDrawerViewModel } from "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel";
import { getDashboardLayoutData } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";

interface DashboardClientBridgeProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly roleLabel: string;
}

/**
 * The auth query whose `notificationCount` field feeds the dashboard bell
 * badge (see `meQueryDocument` in `auth.documents.ts` and the `User` type's
 * `notificationCount`). Refetched on a 60s interval so the bell badge
 * reflects server-side notification state changes (cron dispatch,
 * mark-as-read from another tab, etc.) without a manual page reload.
 *
 * Kept conservative at 60s to avoid flooding the server. The interval clears
 * on unmount (return-cleanup). Per AGENTS.md we match the actual auth query
 * document name here rather than guessing a string op name.
 */
const NOTIFICATION_COUNT_REFETCH_INTERVAL_MS = 60_000;

function isValidPermission(value: string): value is AppPermission {
  return Object.values(AppPermission).includes(value as AppPermission);
}

/**
 * Client-only side effect: refetch the `me` auth query (which carries
 * `notificationCount`) on a 60s interval. Lives inside `ApolloProvider`
 * (mounted at `app/layout.tsx`), so `useApolloClient` is safe to call here.
 * Errors are logged via the frontend `logger` (specs.md F4 forbids
 * `console.*`).
 */
function useNotificationCountRefetch(): void {
  const client = useApolloClient();

  useEffect(() => {
    const intervalId = setInterval(() => {
      client.refetchQueries({ include: [meQueryDocument] }).catch(error => {
        logger.warn("Notification drawer notificationCount refetch failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, NOTIFICATION_COUNT_REFETCH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [client]);
}

export function DashboardClientBridge({
  children,
  userProfile,
  isSuperAdmin,
  roleLabel,
}: Readonly<DashboardClientBridgeProps>) {
  useNotificationCountRefetch();
  const notificationsDrawerVm = useNotificationsDrawerViewModel();

  const permissions = (userProfile.permissions || []).filter(isValidPermission);
  const { sidebarItems, bottomNavItems } = getDashboardLayoutData(permissions);

  return (
    <NotificationsProvider>
      <UserStoreInitializer userProfile={userProfile} isSuperAdmin={isSuperAdmin} />
      <DashboardLayout
        sidebarItems={sidebarItems}
        bottomNavItems={bottomNavItems}
        userName={userProfile.name || ""}
        userEmail={userProfile.email || ""}
        userRole={userProfile.role || ""}
        roleLabel={roleLabel}
        avatarUrl={userProfile.avatarUrl || ""}
        notificationCount={userProfile.notificationCount || 0}
      >
        {children}
      </DashboardLayout>
      <NotificationDrawer vm={notificationsDrawerVm} />
    </NotificationsProvider>
  );
}
