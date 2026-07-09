import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { SubjectDetailContainer } from "@/frontend/views/dashboard/subjects/detail/SubjectDetailContainer";

export default async function SubjectDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <SubjectDetailContainer subjectId={id} />;
}
