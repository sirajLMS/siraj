import type { Metadata } from "next";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
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
  return <StudentHistoryContainer studentId="me" />;
}
