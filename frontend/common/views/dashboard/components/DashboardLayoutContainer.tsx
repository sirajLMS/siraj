import type { ReactNode } from "react";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import type { MeQuery_me as User } from "@/frontend/common/graphql/generated/gql/graphql";
import { AppClientProviders as DashboardClientProviders } from "@/frontend/common/providers/AppClientProviders";
import { DashboardClientBridge } from "@/frontend/common/views/dashboard/components/DashboardClientBridge";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly initialSidebarOpen?: boolean;
  readonly hideSidebarNavigation?: boolean;
}

export async function DashboardLayoutContainer({
  children,
  userProfile,
  isSuperAdmin,
  initialSidebarOpen,
  hideSidebarNavigation = false,
}: DashboardLayoutContainerProps) {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations;
  const adminT = t.admin;
  const coreLayoutT = t.coreLayout;
  const enableUsersDirectory = await isUsersDirectoryEnabled();

  return (
    <DashboardClientProviders locale={locale}>
      <DashboardClientBridge
        userProfile={userProfile}
        isSuperAdmin={isSuperAdmin}
        roleLabel={adminT.roleLabel}
        appTitle={coreLayoutT.appTitle}
        logoAriaLabel={coreLayoutT.appTitle}
        initialSidebarOpen={initialSidebarOpen}
        enableUsersDirectory={enableUsersDirectory}
        hideSidebarNavigation={hideSidebarNavigation}
      >
        {children}
      </DashboardClientBridge>
    </DashboardClientProviders>
  );
}
