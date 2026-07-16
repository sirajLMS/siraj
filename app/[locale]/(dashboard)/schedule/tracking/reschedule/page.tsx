import type { Metadata } from "next";
import { RescheduleTrackingContainer } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.rescheduleTracking;
  return { title: t.pageTitle };
}

export default function RescheduleTrackingPage() {
  return <RescheduleTrackingContainer />;
}
