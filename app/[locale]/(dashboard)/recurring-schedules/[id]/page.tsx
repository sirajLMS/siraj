import type { Metadata } from "next";
import { getRecurringSchedulePageTitle } from "@/backend/lib/titles/cached-page-title";
import { RecurringScheduleDetailContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations(locale, "common");
  const scheduleName = await getRecurringSchedulePageTitle(id);
  if (scheduleName) {
    return { title: scheduleName };
  }
  return { title: t.title };
}

export default function RecurringScheduleDetailPage() {
  return <RecurringScheduleDetailContainer />;
}
