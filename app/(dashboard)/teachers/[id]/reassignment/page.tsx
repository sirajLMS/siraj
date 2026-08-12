import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherReassignmentContainer } from "@/frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.teacherReassignment.pageTitle);
}

export default withPageAuth([AppPermission.STUDENT_REASSIGN_TEACHER, AppPermission.STUDENT_MANAGE_STATUS], async () => {
  return <TeacherReassignmentContainer />;
});
