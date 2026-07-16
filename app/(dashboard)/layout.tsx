import type { ReactNode } from "react";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { mapBackendPermissionsToGraphql } from "@/backend/lib/auth/map-graphql-permissions";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import {
  AccountStatus,
  type AppPermission,
  type CurrencyCode,
  type User,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { DashboardLayoutContainer } from "@/frontend/common/views/dashboard/components/DashboardLayoutContainer";

export default async function DashboardLayout({ children }: { readonly children: ReactNode }) {
  const { userId, context, isImpersonating, isSimulatingGroup } = await getServerUserContext();

  if (!userId || !context) {
    const reason = userId ? "missing permission context" : "missing userId";
    logger.info("[AuthRedirect] Dashboard layout redirecting to login", {
      reason,
      hasUserId: Boolean(userId),
      hasContext: Boolean(context),
      isImpersonating,
      isSimulatingGroup,
    });
    await redirectToLogin();
    return;
  }

  const userProfile = await getCurrentUser(userId, context);

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
    <DashboardLayoutContainer userProfile={mappedUser} isSuperAdmin={userProfile.isSuperAdmin}>
      {children}
    </DashboardLayoutContainer>
  );
}
