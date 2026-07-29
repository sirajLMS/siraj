import { headers } from "next/headers";
import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { UserRole } from "@/backend/enum";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { isPrefetchRequest } from "@/backend/lib/auth/is-prefetch";
import { mapBackendPermissionsToGraphql } from "@/backend/lib/auth/map-graphql-permissions";
import { logger } from "@/backend/lib/logger";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import {
  AccountStatus,
  type AppPermission,
  type CurrencyCode,
  type User,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DashboardLayoutContainer } from "@/frontend/common/views/dashboard/components/DashboardLayoutContainer";
import { redirect } from "@/shared/i18n/routing";

/** Paths a teacher with an incomplete profile may still reach (to complete it). */
const PROFILE_COMPLETION_ALLOWED_PATHS = new Set(["/profile", "/profile/edit"]);

interface DashboardProfileShellProps {
  readonly userId: string;
  readonly context: UserPermissionContext;
  readonly initialSidebarOpen: boolean;
  readonly children: ReactNode;
}

export async function DashboardProfileShell({
  userId,
  context,
  initialSidebarOpen,
  children,
}: Readonly<DashboardProfileShellProps>) {
  const userProfile = await getCurrentUser(userId, context);

  if (userProfile.role === UserRole.TEACHER && !userProfile.nationalIdComplete) {
    const headersList = await headers();
    const rawPathname = headersList.get("x-pathname");
    if (rawPathname && !PROFILE_COMPLETION_ALLOWED_PATHS.has(rawPathname)) {
      if (await isPrefetchRequest()) {
        forbidden();
        return;
      }
      logger.info("[ProfileCompletion] Redirecting teacher to complete national ID", {
        userId,
        rawPathname,
      });
      redirect("/profile/edit?forceComplete=1");
      return;
    }
  }

  const mappedUser: User = {
    id: userProfile.id,
    name: userProfile.name,
    email: userProfile.email,
    avatarUrl: userProfile.avatarUrl,
    permissions: mapBackendPermissionsToGraphql(userProfile.permissions) as AppPermission[],
    role: userProfile.role,
    notificationCount: userProfile.notificationCount,
    teacherId: userProfile.teacherId,
    parentId: userProfile.parentId,
    createdAt: userProfile.createdAt?.toISOString() ?? null,
    updatedAt: userProfile.updatedAt?.toISOString() ?? null,
    emailVerifiedAt: userProfile.emailVerifiedAt?.toISOString() ?? null,
    displayCurrency: userProfile.displayCurrency as CurrencyCode | null,
    phone: userProfile.phone ?? null,
    status: userProfile.status === "DEACTIVATED" ? AccountStatus.Deactivated : AccountStatus.Activated,
  };

  return (
    <DashboardLayoutContainer
      userProfile={mappedUser}
      isSuperAdmin={userProfile.isSuperAdmin}
      initialSidebarOpen={initialSidebarOpen}
    >
      {children}
    </DashboardLayoutContainer>
  );
}
