import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherReassignmentContainer } from "@/frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string; readonly id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.teacherReassignment");
  return { title: t.pageTitle };
}

export default async function TeacherReassignmentPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string; readonly id: string }>;
}) {
  const { locale } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherReassignmentContainer />;
}
