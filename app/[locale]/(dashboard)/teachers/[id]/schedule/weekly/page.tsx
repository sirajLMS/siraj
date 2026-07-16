import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import TeacherWeeklyScheduleContainer from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";
import { getTranslations } from "@/shared/locale/server";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherWeeklySchedule;
  const teacherName = await getTeacherPageTitle(id);
  if (teacherName) {
    return { title: t.pageTitle(teacherName) };
  }
  return { title: t.pageTitle("") };
}

export default async function TeacherWeeklySchedulePage({ params }: PageProps) {
  const { id, locale } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherWeeklyScheduleContainer teacherId={id} />;
}
