import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { SubjectDetailContainer } from "@/frontend/views/dashboard/subjects/detail/SubjectDetailContainer";
import { redirect } from "@/shared/i18n/routing";

export default async function SubjectDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <SubjectDetailContainer subjectId={id} />;
}
