import type { Metadata } from "next";
import { buildEntityNameOnlyTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getStudentPageTitle } from "@/backend/lib/titles/cached-page-title";
import { StudentProfilePageClient } from "@/frontend/common/views/dashboard/students/profile/StudentProfilePageClient";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNameOnlyTranslatedMetadata(
    () => getStudentPageTitle(id),
    t => t.dashboardTranslations.studentProfile.title
  );
}

export default withPageAuth([AppPermission.STUDENTS_LIST, AppPermission.STUDENT_VIEW_ASSOCIATED], async () => {
  return <StudentProfilePageClient />;
});
