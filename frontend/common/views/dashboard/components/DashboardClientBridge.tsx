"use client";

import { useQuery } from "@apollo/client/react";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppPermission, type MeQuery_me as User } from "@/frontend/common/graphql/generated/gql/graphql";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { UserStoreInitializer } from "@/frontend/common/views/dashboard/components/client/UserStoreInitializer";
import { DashboardLayout } from "@/frontend/common/views/dashboard/components/DashboardLayout";
import { NotificationDrawer } from "@/frontend/common/views/dashboard/components/navbar/notifications/NotificationDrawer";
import { useNotificationsDrawerViewModel } from "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel";
import { TeacherProfileCompletionRedirect } from "@/frontend/common/views/dashboard/components/TeacherProfileCompletionRedirect";
import { getDashboardLayoutData } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";

const NOTIFICATION_COUNT_POLL_INTERVAL_MS = 120_000;

const IDLE_TIMEOUT_MS = 300_000;
const IDLE_EVENTS: readonly (keyof WindowEventMap)[] = ["mousemove", "keydown", "mousedown", "touchstart", "focus"];

interface DashboardClientBridgeProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly roleLabel: string;
  readonly appTitle: string;
  readonly appLogoUrl?: string | null;
  readonly logoAriaLabel: string;
  readonly initialSidebarOpen?: boolean;
  readonly enableUsersDirectory: boolean;
  readonly hideSidebarNavigation?: boolean;
}

/**
 * Tracks user activity (mouse, keyboard, touch, focus) and visibility changes.
 * After {@link IDLE_TIMEOUT_MS} of inactivity, `isIdle` becomes `true`.
 * Any activity event resets `isIdle` to `false`.
 */
function useIdleDetection(): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT_MS);
  }, []);

  const handleActivity = useCallback(() => {
    // When the tab becomes hidden, mark idle immediately instead of
    // waiting for the idle timeout — polling pauses right away.
    if (document.hidden) {
      setIsIdle(true);
      return;
    }
    setIsIdle(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleActivity);
    resetIdleTimer();

    return () => {
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleActivity);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleActivity, resetIdleTimer]);

  return isIdle;
}

function isValidPermission(value: string): value is AppPermission {
  return (Object.values(AppPermission) as readonly string[]).includes(value);
}

/**
 * Keeps `me` (and its `notificationCount`) as an active Apollo query for the
 * lifetime of the dashboard shell. Falls back to the SSR profile count until
 * the first client response arrives. Polling pauses when the user is idle.
 */
function useLiveNotificationCount(fallbackCount: number): number {
  const isIdle = useIdleDetection();
  // Polling auto-pauses when isIdle (pollInterval=0) and auto-resumes when active.
  // No manual refetch needed — Apollo restarts polling when pollInterval flips
  // back to a positive value, avoiding a double-fetch on idle→active transition.
  const queryOptions = useMemo(
    () => ({
      pollInterval: isIdle ? 0 : NOTIFICATION_COUNT_POLL_INTERVAL_MS,
    }),
    [isIdle]
  );
  const { data } = useQuery(meQueryDocument, queryOptions);

  return data?.me?.notificationCount ?? fallbackCount;
}

export function DashboardClientBridge({
  children,
  userProfile,
  isSuperAdmin,
  roleLabel,
  appTitle,
  appLogoUrl,
  logoAriaLabel,
  initialSidebarOpen,
  enableUsersDirectory,
  hideSidebarNavigation = false,
}: Readonly<DashboardClientBridgeProps>) {
  const notificationCount = useLiveNotificationCount(userProfile.notificationCount ?? 0);
  const notificationsDrawerVm = useNotificationsDrawerViewModel();

  const permissions = (userProfile.permissions ?? []).filter(isValidPermission);
  const layoutData = hideSidebarNavigation
    ? { sidebarGroups: [], sidebarItems: [], bottomNavItems: [] }
    : getDashboardLayoutData(permissions, { enableUsersDirectory });
  const { sidebarGroups, sidebarItems, bottomNavItems } = layoutData;

  return (
    <NotificationsProvider>
      <TeacherProfileCompletionRedirect active={hideSidebarNavigation} />
      <UserStoreInitializer userProfile={userProfile} isSuperAdmin={isSuperAdmin} />
      <DashboardLayout
        sidebarGroups={sidebarGroups}
        sidebarItems={sidebarItems}
        bottomNavItems={bottomNavItems}
        userName={userProfile.name ?? ""}
        userEmail={userProfile.email ?? ""}
        userRole={userProfile.role ?? ""}
        roleLabel={roleLabel}
        appTitle={appTitle}
        appLogoUrl={appLogoUrl}
        logoAriaLabel={logoAriaLabel}
        avatarUrl={userProfile.avatarUrl ?? ""}
        notificationCount={notificationCount}
        initialSidebarOpen={initialSidebarOpen}
        hideSidebarNavigation={hideSidebarNavigation}
      >
        {children}
      </DashboardLayout>
      <NotificationDrawer vm={notificationsDrawerVm} />
    </NotificationsProvider>
  );
}
