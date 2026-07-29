import type { Metadata } from "next";
import { DashboardNotFoundContent } from "@/frontend/common/views/dashboard/components/DashboardNotFoundContent";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreLayout;
  return { title: t.pageNotFoundTitle };
}

export default async function DashboardNotFound() {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreLayout;

  return (
    <DashboardNotFoundContent
      labels={{
        pageNotFoundTitle: t.pageNotFoundTitle,
        pageNotFoundDescription: t.pageNotFoundDescription,
        pageNotFoundBackToDashboard: t.pageNotFoundBackToDashboard,
      }}
    />
  );
}
