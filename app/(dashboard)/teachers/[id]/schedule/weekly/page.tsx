import type { Metadata } from "next";
import { buildEntityNameFormattedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { TeacherWeeklyScheduleContainer } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ readonly id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNameFormattedTranslatedMetadata(
    () => getTeacherPageTitle(id),
    (t, name) => t.dashboardTranslations.teacherWeeklySchedule.pageTitle(name)
  );
}

export default withPageAuth<PageProps>([AppPermission.SCHEDULE_VIEW_WEEKLY], async (_auth, { params }) => {
  const { id } = await params;
  return <TeacherWeeklyScheduleContainer teacherId={id} />;
});
