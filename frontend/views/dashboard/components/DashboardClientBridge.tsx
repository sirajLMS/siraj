import { NotificationsProvider } from "@toolpad/core/useNotifications";
import type { ReactNode } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { getAppLocale } from "@/frontend/views/dashboard/lib/getAppLocale";
import { getDashboardLayoutData } from "@/frontend/views/dashboard/lib/getDashboardLayoutData";
import { getDashboardPathname } from "@/frontend/views/dashboard/lib/getDashboardPathname";
import { AppPermission as BackendAppPermission } from "@/shared/lib/enum";
import { UserStoreInitializer } from "./client/UserStoreInitializer";
import { DashboardLayout } from "./DashboardLayout";

interface DashboardClientBridgeProps {
  readonly children: ReactNode;
  readonly userProfile: CurrentUserProfile;
  readonly roleLabel: string;
}

function isFrontendPermission(key: string): key is AppPermission {
  return key in BackendAppPermission;
}

export async function DashboardClientBridge({ children, userProfile, roleLabel }: DashboardClientBridgeProps) {
  const [pathname, locale] = await Promise.all([getDashboardPathname(), getAppLocale()]);
  const permissions = userProfile.permissions
    .map(p => {
      const entry = Object.entries(BackendAppPermission).find(([_, val]) => val === p);
      return entry ? entry[0] : "";
    })
    .filter(isFrontendPermission);
  const { sidebarItems, bottomNavItems, activeNavKey } = getDashboardLayoutData(pathname, permissions, locale);

  return (
    <NotificationsProvider>
      <UserStoreInitializer userProfile={userProfile} />
      <DashboardLayout
        sidebarItems={sidebarItems}
        bottomNavItems={bottomNavItems}
        activeNavKey={activeNavKey}
        userName={userProfile.name}
        userEmail={userProfile.email}
        userRole=""
        roleLabel={roleLabel}
        avatarUrl={userProfile.avatarUrl || ""}
        notificationCount={userProfile.notificationCount}
      >
        {children}
      </DashboardLayout>
    </NotificationsProvider>
  );
}
