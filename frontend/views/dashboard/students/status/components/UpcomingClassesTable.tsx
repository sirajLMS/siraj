"use client";

import { useTranslations } from "next-intl";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { UpcomingClassesTableDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop";
import { UpcomingClassesTableMobile } from "@/frontend/mobile/views/dashboard/students/status/components/upcomingClassesTable.mobile";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/views/dashboard/students/profile/useStudentFieldAccess";
import type { UpcomingClassesTableProps } from "@/frontend/views/dashboard/students/status/types";

export function UpcomingClassesTable({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const { isMobile } = useViewport();
  const t = useTranslations("dashboard.studentStatus");
  const { canView } = useStudentFieldAccess();

  if (!canView("student_schedule")) {
    return <ProfileRestrictedSection title={t("sections.upcomingClasses")} />;
  }

  if (isMobile) {
    return <UpcomingClassesTableMobile classes={classes} studentId={studentId} />;
  }

  return <UpcomingClassesTableDesktop classes={classes} studentId={studentId} />;
}
