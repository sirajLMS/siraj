import type { Metadata } from "next";
import { buildEntityNameFormattedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getSubjectPageTitle } from "@/backend/lib/titles/cached-page-title";
import { SubjectDetailView } from "@/frontend/common/views/dashboard/subjects/detail/SubjectDetailContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNameFormattedTranslatedMetadata(
    () => getSubjectPageTitle(id),
    (t, name) => t.dashboardTranslations.subjects.detail.pageTitle(name),
    t => t.dashboardTranslations.subjects.pageTitle
  );
}

export default withPageAuth<{ readonly params: Promise<{ readonly id: string }> }>(null, async (_auth, { params }) => {
  const { id } = await params;
  return <SubjectDetailView subjectId={id} />;
});
