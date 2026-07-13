"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/frontend/common/components/ui";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryDesktop } from "@/frontend/common/views/dashboard/students/history/components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "@/frontend/common/views/dashboard/students/history/components/StudentHistoryMobile";
import type { StudentHistoryViewProps } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";

export function StudentHistoryView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  selectedDay,
  embedded = false,
  onSelectWeek,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrint,
  enrollmentMonth,
  nowMonth,
  locale,
}: Readonly<StudentHistoryViewProps>) {
  const t = useTranslations("dashboard.studentHistory");
  const { canView } = useStudentFieldAccess();

  const content = canView("student_history") ? (
    <>
      <StudentHistoryDesktop
        studentName={studentName}
        currentMonth={currentMonth}
        metrics={metrics}
        classes={classes}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onPrint={onPrint}
        enrollmentMonth={enrollmentMonth}
        nowMonth={nowMonth}
        locale={locale}
      />
      <StudentHistoryMobile
        studentName={studentName}
        currentMonth={currentMonth}
        metrics={metrics}
        classes={classes}
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
        onSelectWeek={onSelectWeek}
        onSelectDay={onSelectDay}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onPrint={onPrint}
        enrollmentMonth={enrollmentMonth}
        nowMonth={nowMonth}
        locale={locale}
      />
    </>
  ) : (
    <ProfileRestrictedSection title={t("pageTitle")} />
  );

  if (embedded) {
    return content;
  }

  return <PageContainer>{content}</PageContainer>;
}
