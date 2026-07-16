import type { Metadata } from "next";
import { StatusTrackingContainer } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusTrackingContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.coreStatusTracking;
  return { title: t.pageTitle };
}

export default function StatusTrackingPage() {
  return <StatusTrackingContainer />;
}
