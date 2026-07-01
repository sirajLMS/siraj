import type { ReactNode } from "react";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function AuthLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { userId, context } = await getServerUserContext();
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  if (userId && context) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  return children;
}
