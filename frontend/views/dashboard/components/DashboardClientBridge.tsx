import { NotificationsProvider } from "@toolpad/core/useNotifications";
import type { ReactNode } from "react";
import { AppPermission, type User } from "@/frontend/graphql/generated/gql/graphql-types";
import { UserStoreInitializer } from "@/frontend/views/dashboard/components/client/UserStoreInitializer";
import { DashboardLayout } from "@/frontend/views/dashboard/components/DashboardLayout";
import { getDashboardLayoutData } from "@/frontend/views/dashboard/lib/getDashboardLayoutData";

interface DashboardClientBridgeProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly roleLabel: string;
}

function isValidPermission(value: string): value is AppPermission {
  return Object.values(AppPermission).includes(value as AppPermission);
}

export async function DashboardClientBridge({
  children,
  userProfile,
  isSuperAdmin,
  roleLabel,
}: DashboardClientBridgeProps) {
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
    </NotificationsProvider>
  );
}
