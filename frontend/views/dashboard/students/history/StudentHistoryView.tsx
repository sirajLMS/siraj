"use client";

import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { ClassDetailsModal } from "./components/ClassDetailsModal";
import { StudentHistoryDesktop } from "./components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "./components/StudentHistoryMobile";
import type { ClassSession, StudentHistoryMetrics } from "./types";

interface StudentHistoryViewProps {
  studentName: string;
  currentMonth: Date;
  metrics: StudentHistoryMetrics;
  classes: Readonly<Partial<Record<number, ClassSession>>>;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
  onMonthChange?: (date: Date) => void;
  onViewAssignments: (classInstanceId: string) => void;
  onDownloadLogs: (classInstanceId: string) => void;
}

export function StudentHistoryView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  onSelectWeek,
  onMonthChange,
  onViewAssignments,
  onDownloadLogs,
}: Readonly<StudentHistoryViewProps>) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    if (classes[day]) {
      setIsModalOpen(true);
    }
  };

  const handleSelectSession = (session: ClassSession) => {
    setSelectedDay(session.dayOfMonth);
    setIsModalOpen(true);
  };

  const selectedSession = selectedDay === null ? undefined : classes[selectedDay];

  const monthShort = currentMonth.toLocaleString("en-US", { month: "short" });
  const yearStr = currentMonth.getFullYear();
  const dateStr = selectedDay ? `${monthShort} ${selectedDay}, ${yearStr}` : "";

  const handleMonthChange = () => {
    if (!onMonthChange) return;
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    onMonthChange(nextMonth);
  };

  return (
    <PageContainer>
      <RequirePermission permissions={[AppPermission.HistoryViewCalendar]}>
        <StudentHistoryDesktop
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          onSelectDay={handleSelectDay}
          onChangeMonth={handleMonthChange}
        />
        <StudentHistoryMobile
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          selectedWeek={selectedWeek}
          onSelectWeek={onSelectWeek}
          onSelectSession={handleSelectSession}
          onChangeMonth={handleMonthChange}
        />
      </RequirePermission>

      <RequirePermission permissions={[AppPermission.HistoryViewDetails]}>
        {isModalOpen && selectedSession && (
          <ClassDetailsModal
            session={selectedSession}
            dateStr={dateStr}
            onClose={() => {
              setIsModalOpen(false);
            }}
            onViewAssignments={() => onViewAssignments(selectedSession.id)}
            onDownloadLogs={() => onDownloadLogs(selectedSession.id)}
          />
        )}
      </RequirePermission>
    </PageContainer>
  );
}
