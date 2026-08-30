import type { ReactNode } from "react";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import type { MeQuery_me as User } from "@/frontend/common/graphql/generated/gql/graphql";
import { AppClientProviders as DashboardClientProviders } from "@/frontend/common/providers/AppClientProviders";
import { DashboardClientBridge } from "@/frontend/common/views/dashboard/components/DashboardClientBridge";
import { UserRole } from "@/shared/constants/auth.enum";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";
import type { AdminDashboardLabels } from "@/shared/locale/types";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
  readonly initialSidebarOpen?: boolean;
  readonly hideSidebarNavigation?: boolean;
}

/**
 * Administrative shells keep the explicit "Admin Dashboard" brand label; every
 * other portal (student, parent, teacher, supervisor) falls back to the
 * generic dashboard title so non-admin users never see admin branding.
 */
const ADMINISTRATIVE_ROLES: ReadonlySet<string> = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ACADEMY_ADMIN,
  UserRole.STAFF,
]);

function resolveNavbarRoleLabel(
  role: User["role"],
  labels: Pick<AdminDashboardLabels, "roleLabel" | "pageTitle">
): string {
  return role !== null && ADMINISTRATIVE_ROLES.has(role) ? labels.roleLabel : labels.pageTitle;
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
        roleLabel={resolveNavbarRoleLabel(userProfile.role, adminT)}
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
