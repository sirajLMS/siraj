import type { Metadata } from "next";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import TeacherWeeklyScheduleContainer from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";
import { getTranslations } from "@/shared/locale";

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherWeeklySchedule;
  return { title: t.pageTitle("") };
}

export default async function TeacherMeWeeklySchedulePage({ params }: PageProps) {
  const { locale } = await params;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <TeacherWeeklyScheduleContainer teacherId={teacherId} />;
}
