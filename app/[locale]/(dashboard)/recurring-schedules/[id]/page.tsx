import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getRecurringSchedulePageTitle } from "@/backend/lib/titles/cached-page-title";
import { RecurringScheduleDetailContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const scheduleName = await getRecurringSchedulePageTitle(id);
  if (scheduleName) {
    return { title: scheduleName };
  }
  return { title: t("title") };
}

export default function RecurringScheduleDetailPage() {
  return <RecurringScheduleDetailContainer />;
}
