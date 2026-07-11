import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RescheduleContainer } from "@/frontend/views/dashboard/reschedule/home/RescheduleContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.rescheduleForm" });
  return { title: t("pageTitle") };
}

export default function ReschedulePage() {
  return <RescheduleContainer />;
}
