import type { Metadata } from "next";
import { buildEntityNamePrefixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { FutureScheduleContainer } from "@/frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ readonly id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNamePrefixedTranslatedMetadata(
    () => getTeacherPageTitle(id),
    t => t.dashboardTranslations.teacherFutureSchedule.pageTitle
  );
}

export default withPageAuth<PageProps>(null, async (_auth, { params }) => {
  const { id } = await params;
  return <FutureScheduleContainer teacherId={id} />;
});
