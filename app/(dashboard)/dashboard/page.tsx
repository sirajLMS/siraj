import type { Metadata } from "next";
import { DashboardContainer } from "@/frontend/common/views/dashboard/dashboard/DashboardContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).commonTranslations;
  return { title: t.title };
}

export default function DashboardPage() {
  return <DashboardContainer />;
}
