import type { Metadata } from "next";
import { StudentHistoryView } from "@/frontend/common/views/dashboard/student/history/StudentHistoryContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.studentPortalHistory;
  return { title: t.pageTitle };
}

export default function StudentHistoryPage() {
  return <StudentHistoryView />;
}
