"use client";

import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { UpcomingClassesTableMobile } from "@/frontend/mobile/views/dashboard/students/status/components/upcomingClassesTable.mobile";

export function StudentClassesMobileView({
  t,
  student,
  embedded,
  canViewSchedule,
  loading,
}: Readonly<StudentStatusViewModel>) {
  if (!canViewSchedule) {
    const restricted = <ProfileRestrictedSection title={t.sections.upcomingClassesMobile} />;
    return embedded ? restricted : <MobilePageContainer>{restricted}</MobilePageContainer>;
  }

  if (loading && !student) {
    return null;
  }

  if (!student) {
    return null;
  }

  const body = <UpcomingClassesTableMobile classes={student.upcomingClasses} studentId={student.id} />;

  if (embedded) {
    return body;
  }

  return <MobilePageContainer>{body}</MobilePageContainer>;
}
