import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { StudentParentAppraisalContainer } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/StudentParentAppraisalContainer";

export const generateStudentParentAppraisalMetadata = (): Promise<Metadata> =>
  buildTranslatedMetadata(t => t.dashboardTranslations.monthlyAppraisal.studentParentView.pageTitle);

export const createStudentParentAppraisalPageComponent = () =>
  withPageAuth([AppPermission.APPRAISAL_VIEW], () => <StudentParentAppraisalContainer studentId={null} />);
