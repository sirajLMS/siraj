"use client";

import { useQuery } from "@apollo/client/react";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import type { ReactNode } from "react";
import { AppPermission, type User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
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
  readonly appTitle: string;
  readonly logoAriaLabel: string;
  readonly initialSidebarOpen?: boolean;
  readonly enablePeopleDirectory: boolean;
}

/**
 * Poll interval for the active `me` query that feeds the dashboard bell badge.
 * Kept at 60s to avoid flooding the server. Using `useQuery` (not
 * `client.refetchQueries({ include })`) keeps `me` registered as an active
 * observable so Apollo can refetch it without "Unknown query named me".
 */
const NOTIFICATION_COUNT_POLL_INTERVAL_MS = 60_000;

function isValidPermission(value: string): value is AppPermission {
  return Object.values(AppPermission).includes(value as AppPermission);
}

/**
 * Keeps `me` (and its `notificationCount`) as an active Apollo query for the
 * lifetime of the dashboard shell. Falls back to the SSR profile count until
 * the first client response arrives.
 */
function useLiveNotificationCount(fallbackCount: number): number {
  const { data } = useQuery(meQueryDocument, {
    pollInterval: NOTIFICATION_COUNT_POLL_INTERVAL_MS,
  });

  return data?.me?.notificationCount ?? fallbackCount;
}

export function DashboardClientBridge({
  children,
  userProfile,
  isSuperAdmin,
  roleLabel,
  appTitle,
  logoAriaLabel,
  initialSidebarOpen,
  enablePeopleDirectory,
}: Readonly<DashboardClientBridgeProps>) {
  const notificationCount = useLiveNotificationCount(userProfile.notificationCount || 0);
  const notificationsDrawerVm = useNotificationsDrawerViewModel();

  const permissions = (userProfile.permissions || []).filter(isValidPermission);
  const { sidebarGroups, sidebarItems, bottomNavItems } = getDashboardLayoutData(permissions, {
    enablePeopleDirectory,
  });

  return (
    <NotificationsProvider>
      <UserStoreInitializer userProfile={userProfile} isSuperAdmin={isSuperAdmin} />
      <DashboardLayout
        sidebarGroups={sidebarGroups}
        sidebarItems={sidebarItems}
        bottomNavItems={bottomNavItems}
        userName={userProfile.name || ""}
        userEmail={userProfile.email || ""}
        userRole={userProfile.role || ""}
        roleLabel={roleLabel}
        appTitle={appTitle}
        logoAriaLabel={logoAriaLabel}
        avatarUrl={userProfile.avatarUrl || ""}
        notificationCount={notificationCount}
        initialSidebarOpen={initialSidebarOpen}
      >
        {children}
      </DashboardLayout>
      <NotificationDrawer vm={notificationsDrawerVm} />
    </NotificationsProvider>
  );
}
