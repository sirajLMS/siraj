import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getSubjectPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { SubjectDetailContainer } from "@/frontend/views/dashboard/subjects/detail/SubjectDetailContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.subjects" });
  const subjectName = await getSubjectPageTitle(id);
  if (subjectName) {
    return { title: t("detail.pageTitle", { name: subjectName }) };
  }
  return { title: t("pageTitle") };
}

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
