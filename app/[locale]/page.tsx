import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { type AppLocale, locales, redirect } from "@/shared/i18n/routing";

export default async function RootPage({ params }: { readonly params: Promise<{ locale: string }> }) {
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  const { userId, context } = await getServerUserContext();
  if (userId && context) {
    redirect({ href: "/dashboard", locale });
  } else {
    redirect({ href: "/login", locale });
  }

  return <> </>;
}
