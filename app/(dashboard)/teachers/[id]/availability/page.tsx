// cspell:disable
import type { Metadata } from "next";
import { buildEntityNamePrefixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { TeacherAvailabilityContainer } from "@/frontend/common/views/dashboard/teachers/availability/TeacherAvailabilityContainer";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ readonly id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNamePrefixedTranslatedMetadata(
    () => getTeacherPageTitle(id),
    t => t.dashboardTranslations.teacherAvailability.pageTitle
  );
}

export default withPageAuth<PageProps>([AppPermission.SCHEDULE_SEARCH_AVAILABILITY], async (_auth, { params }) => {
  const { id } = await params;
  return <TeacherAvailabilityContainer teacherId={id} />;
});
