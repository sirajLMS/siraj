"use client";

import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentStatusLabelsProvider } from "@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
import { UpcomingClassesTableDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop";

export function StudentClassesDesktopView({
  t,
  student,
  embedded,
  canViewSchedule,
  loading,
}: Readonly<StudentStatusViewModel>) {
  if (!canViewSchedule) {
    const restricted = <ProfileRestrictedSection title={t.sections.upcomingClasses} />;
    return embedded ? restricted : <DesktopPageContainer>{restricted}</DesktopPageContainer>;
  }

  if (loading && !student) {
    return null;
  }

  if (!student) {
    return null;
  }

  const body = (
    <StudentStatusLabelsProvider labels={t}>
      <UpcomingClassesTableDesktop classes={student.upcomingClasses} studentId={student.id} />
    </StudentStatusLabelsProvider>
  );

  if (embedded) {
    return body;
  }

  return <DesktopPageContainer>{body}</DesktopPageContainer>;
}
