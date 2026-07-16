import type { Metadata } from "next";
import { SearchScheduleContainer } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.coreSearchSchedule;
  return { title: t.pageTitle };
}

export default function SearchSchedulePage() {
  return <SearchScheduleContainer />;
}
