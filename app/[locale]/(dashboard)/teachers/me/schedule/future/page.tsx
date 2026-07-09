import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { FutureScheduleContainer } from "@/frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";

export const metadata: Metadata = {
  title: "Future Schedule - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeFutureSchedulePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <FutureScheduleContainer teacherId={teacherId} />;
}
