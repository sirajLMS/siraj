import { NotificationsProvider } from "@toolpad/core/useNotifications";
import type { ReactNode } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { getDashboardLayoutData } from "@/frontend/views/dashboard/lib/getDashboardLayoutData";
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
  const permissions = userProfile.permissions
    .map(p => {
      const entry = Object.entries(BackendAppPermission).find(([_, val]) => val === p);
      return entry ? entry[0] : "";
    })
    .filter(isFrontendPermission);
  const { sidebarItems, bottomNavItems } = getDashboardLayoutData(permissions);

  return (
    <NotificationsProvider>
      <UserStoreInitializer userProfile={userProfile} />
      <DashboardLayout
        sidebarItems={sidebarItems}
        bottomNavItems={bottomNavItems}
        userName={userProfile.name}
        userEmail={userProfile.email}
        userRole={userProfile.role}
        roleLabel={roleLabel}
        avatarUrl={userProfile.avatarUrl || ""}
        notificationCount={userProfile.notificationCount}
      >
        {children}
      </DashboardLayout>
    </NotificationsProvider>
  );
}
