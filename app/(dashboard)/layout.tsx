import { cookies } from "next/headers";
import { forbidden } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { isPrefetchRequest } from "@/backend/lib/auth/is-prefetch";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { getSidebarStateFromCookies, SIDEBAR_COOKIE_NAME } from "@/frontend/common/lib/sidebar-detection";
import { DashboardProfileShell } from "@/frontend/common/views/dashboard/components/DashboardProfileShell";
import { DashboardShellSkeleton } from "@/frontend/common/views/dashboard/components/DashboardShellSkeleton";

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
    if (await isPrefetchRequest()) {
      forbidden();
      return undefined;
    }
    await redirectToLogin();
    return undefined;
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME);
  const initialSidebarOpen = getSidebarStateFromCookies(sidebarCookie?.value);

  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardProfileShell userId={userId} context={context} initialSidebarOpen={initialSidebarOpen}>
        {children}
      </DashboardProfileShell>
    </Suspense>
  );
}
