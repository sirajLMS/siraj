import type { ReactNode } from "react";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
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
    logger.info("[AuthRedirect] Auth layout redirecting to dashboard", {
      reason: "server sees valid session — authenticated user on auth page",
      hasUserId: true,
      hasContext: true,
      isImpersonating,
      isSimulatingGroup,
    });
    redirect({ href: "/dashboard", locale });
    return;
  }

  return children;
}
