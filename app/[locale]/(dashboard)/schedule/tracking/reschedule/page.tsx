import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RescheduleTrackingContainer } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.rescheduleTracking" });
  return { title: t("pageTitle") };
}

export default function RescheduleTrackingPage() {
  return <RescheduleTrackingContainer />;
}
