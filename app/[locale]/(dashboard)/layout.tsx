import type { ReactNode } from "react";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { DashboardLayoutContainer } from "@/frontend/views/dashboard/components/DashboardLayoutContainer";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function DashboardLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { userId, context, isImpersonating, isSimulatingGroup } = await getServerUserContext();
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  if (!userId || !context) {
    logger.info("[AuthRedirect] Dashboard layout redirecting to login", {
      reason: !userId ? "missing userId" : "missing permission context",
      hasUserId: Boolean(userId),
      hasContext: Boolean(context),
      isImpersonating,
      isSimulatingGroup,
    });
    redirect({ href: "/login", locale });
    return;
  }

  const userProfile = await getCurrentUser(userId, context);

  return <DashboardLayoutContainer userProfile={userProfile}>{children}</DashboardLayoutContainer>;
}
