import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { TeacherReassignmentContainer } from "@/frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";
import { redirect } from "@/shared/i18n/routing";

export default async function TeacherReassignmentPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string; readonly id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <TeacherReassignmentContainer />;
}
