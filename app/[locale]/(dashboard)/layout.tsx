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
} from "@/frontend/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { DashboardLayoutContainer } from "@/frontend/views/dashboard/components/DashboardLayoutContainer";
import { type AppLocale, locales } from "@/shared/i18n/routing";

export default async function DashboardLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { userId, context, isImpersonating, isSimulatingGroup } = await getServerUserContext();
  let { locale } = await params;

  const isValidLocale = locales.includes(locale as AppLocale);
  locale = isValidLocale ? locale : locales[0];

  if (!userId || !context) {
    const reason = userId ? "missing permission context" : "missing userId";
    logger.info("[AuthRedirect] Dashboard layout redirecting to login", {
      reason,
      hasUserId: Boolean(userId),
      hasContext: Boolean(context),
      isImpersonating,
      isSimulatingGroup,
    });
    await redirectToLogin(locale);
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
