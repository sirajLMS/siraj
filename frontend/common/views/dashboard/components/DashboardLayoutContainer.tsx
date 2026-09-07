import type { ReactNode } from "react";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { logger } from "@/backend/lib/logger";
import { AppearanceSettingsService } from "@/backend/services";
import type { AppearanceFields } from "@/backend/types";
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

  // Published appearance drives the navbar brand (site name + logo) so a
  // publish through the customize overlay shows up after the next server
  // render without touching locale files. Falls back to the translated
  // app title + default icon when no row exists or the read fails.
  let appearance: AppearanceFields | null = null;
  try {
    appearance = await AppearanceSettingsService.getFirstAppearancePublished();
  } catch (error) {
    logger.error("[DashboardLayoutContainer] published appearance read failed; falling back to translation brand.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  const appTitle = appearance?.siteName ?? coreLayoutT.appTitle;
  const appLogoUrl = appearance?.logoUrl ?? null;

  return (
    <DashboardClientProviders locale={locale}>
      <DashboardClientBridge
        userProfile={userProfile}
        isSuperAdmin={isSuperAdmin}
        roleLabel={resolveNavbarRoleLabel(userProfile.role, adminT)}
        appTitle={appTitle}
        appLogoUrl={appLogoUrl}
        logoAriaLabel={appTitle}
        initialSidebarOpen={initialSidebarOpen}
        enableUsersDirectory={enableUsersDirectory}
        hideSidebarNavigation={hideSidebarNavigation}
      >
        {children}
      </DashboardClientBridge>
    </DashboardClientProviders>
  );
}
