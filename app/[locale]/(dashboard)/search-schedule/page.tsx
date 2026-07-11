import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchScheduleContainer } from "@/frontend/views/dashboard/search-schedule/SearchScheduleContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.searchSchedule" });
  return { title: t("pageTitle") };
}

export default function SearchSchedulePage() {
  return <SearchScheduleContainer />;
}
