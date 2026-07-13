import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherReassignmentContainer } from "@/frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string; readonly id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.teacherReassignment" });
  return { title: t("pageTitle") };
}

export default async function TeacherReassignmentPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string; readonly id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherReassignmentContainer />;
}
