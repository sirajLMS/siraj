import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { FutureScheduleContainer } from "@/frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ readonly id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherFutureSchedule;
  const teacherName = await getTeacherPageTitle(id);
  if (teacherName) {
    return { title: `${teacherName} — ${t.pageTitle}` };
  }
  return { title: t.pageTitle };
}

export default async function FutureSchedulePage({ params }: PageProps) {
  const { id } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return;
  }

  return <FutureScheduleContainer teacherId={id} />;
}
