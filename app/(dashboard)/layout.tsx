import { headers } from "next/headers";
import type { ReactNode } from "react";
import { UserRole } from "@/backend/enum";
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
import { redirect } from "@/shared/i18n/routing";

/** Paths a teacher with an incomplete profile may still reach (to complete it). */
const PROFILE_COMPLETION_ALLOWED_PATHS = new Set(["/profile", "/profile/edit"]);

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

  // First-login profile-completion guard: teachers must set their national ID
  // before they can operate on the system. Admins may leave nationalId unset at
  // creation time, so we force the teacher to enter it on first login by
  // hard-redirecting every dashboard route to the profile edit page until it
  // is filled. The profile edit page itself is allowed through so the teacher
  // can actually complete the form.
  if (userProfile.role === UserRole.TEACHER && !userProfile.nationalIdComplete) {
    const headersList = await headers();
    const rawPathname = headersList.get("x-pathname");
    // Only redirect if x-pathname is explicitly provided AND is not an allowed path.
    // If x-pathname is missing (e.g. internal RSC requests), do NOT redirect to avoid infinite loops.
    if (rawPathname && !PROFILE_COMPLETION_ALLOWED_PATHS.has(rawPathname)) {
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
    <DashboardLayoutContainer userProfile={mappedUser} isSuperAdmin={userProfile.isSuperAdmin}>
      {children}
    </DashboardLayoutContainer>
  );
}
