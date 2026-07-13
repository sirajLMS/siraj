import type { ReactNode } from "react";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { getAuthenticatedAuthBounceHref } from "@/frontend/common/lib/redirectToLogin";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function AuthLayout({
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

  if (userId && context) {
    const targetHref = await getAuthenticatedAuthBounceHref();
    logger.info("[AuthRedirect] Auth layout redirecting authenticated user away from auth page", {
      reason: "server sees valid session — authenticated user on auth page",
      hasUserId: true,
      hasContext: true,
      isImpersonating,
      isSimulatingGroup,
      to: targetHref,
    });
    redirect({ href: targetHref, locale });
    return;
  }

  return children;
}
