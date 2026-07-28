import type { ReactNode } from "react";
import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DashboardClientBridge } from "@/frontend/common/views/dashboard/components/DashboardClientBridge";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly initialSidebarOpen?: boolean;
}

export async function DashboardLayoutContainer({
  children,
  userProfile,
  isSuperAdmin,
  initialSidebarOpen,
}: DashboardLayoutContainerProps) {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations;
  const adminT = t.admin;
  const coreLayoutT = t.coreLayout;

  return (
    <DashboardClientBridge
      userProfile={userProfile}
      isSuperAdmin={isSuperAdmin}
      roleLabel={adminT.roleLabel}
      appTitle={coreLayoutT.appTitle}
      logoAriaLabel={coreLayoutT.appTitle}
      initialSidebarOpen={initialSidebarOpen}
    >
      {children}
    </DashboardClientBridge>
  );
}
