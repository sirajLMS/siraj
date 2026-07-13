import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ReportsContainer } from "@/frontend/common/views/dashboard/reports/ReportsContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.reports" });
  return { title: t("pageTitle") };
}

export default function ReportsPage() {
  return <ReportsContainer />;
}
