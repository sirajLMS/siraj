import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { getAuthenticatedAuthBounceHref } from "@/frontend/common/lib/redirectToLogin";
import { AppClientProviders } from "@/frontend/common/providers/AppClientProviders";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function AuthLayout({ children }: { readonly children: ReactNode }) {
  const { userId, context, isImpersonating, isSimulatingGroup } = await getServerUserContext();
  const locale = await getLocale();

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
    redirect(targetHref);
    return undefined;
  }

  return <AppClientProviders locale={locale}>{children}</AppClientProviders>;
}
