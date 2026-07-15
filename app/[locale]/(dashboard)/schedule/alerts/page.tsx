import type { Metadata } from "next";
import { ScheduleAlertsContainer } from "@/frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.core.scheduleAlerts");
  return { title: t.pageTitle };
}

export default function ScheduleAlertsPage() {
  return <ScheduleAlertsContainer />;
}
