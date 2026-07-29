import type { Metadata } from "next";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherClassListContainer } from "@/frontend/common/views/dashboard/teachers/classes/TeacherClassListContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherClassList;
  return { title: t.pageTitle };
}

export default async function ClassesPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  await requireTeacherIdForPage(userId, locale, context);

  return <TeacherClassListContainer />;
}
