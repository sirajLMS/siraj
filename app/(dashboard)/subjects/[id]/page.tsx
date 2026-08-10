import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getSubjectPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { SubjectDetailView } from "@/frontend/common/views/dashboard/subjects/detail/SubjectDetailContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.subjects;
  const subjectName = await getSubjectPageTitle(id);
  if (subjectName) {
    return { title: t.detail.pageTitle(subjectName) };
  }
  return { title: t.pageTitle };
}

export default async function SubjectDetailPage({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  return <SubjectDetailView subjectId={id} />;
}
