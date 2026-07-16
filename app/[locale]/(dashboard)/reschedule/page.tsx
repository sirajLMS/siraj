import type { Metadata } from "next";
import { RescheduleContainer } from "@/frontend/common/views/dashboard/reschedule/home/RescheduleContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.rescheduleForm;
  return { title: t.pageTitle };
}

export default function ReschedulePage() {
  return <RescheduleContainer />;
}
