import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StatusTrackingContainer } from "@/frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.statusTracking" });
  return { title: t("pageTitle") };
}

export default function StatusTrackingPage() {
  return <StatusTrackingContainer />;
}
