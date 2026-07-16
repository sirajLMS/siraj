import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherClassListContainer } from "@/frontend/common/views/dashboard/teachers/classes/TeacherClassListContainer";
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
  const t = getTranslations(locale).dashboardTranslations.teacherClassList;
  return { title: t.pageTitle };
}

export default async function TeacherMeClassesPage({ params }: PageProps) {
  const { locale: _locale } = await params;

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  return <TeacherClassListContainer />;
}
