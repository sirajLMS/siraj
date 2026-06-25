import { redirect } from "next/navigation";
import { type AppLocale, locales } from "@/shared/i18n/routing";

export default async function DashboardLayout({ params }: { readonly params: Promise<{ locale: string }> }) {
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  redirect(`/${locale}/login`);

  return <> </>;
}
