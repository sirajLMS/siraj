import type { Metadata } from "next";
import { ReportsContainer } from "@/frontend/common/views/dashboard/reports/ReportsContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.reports;
  return { title: t.pageTitle };
}

export default function ReportsPage() {
  return <ReportsContainer />;
}
