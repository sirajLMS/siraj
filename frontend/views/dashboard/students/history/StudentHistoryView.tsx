"use client";

import { useState } from "react";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { useStudentHistoryStore } from "@/frontend/stores/mockStudentHistoryStore";
import { ClassDetailsModal } from "./components/ClassDetailsModal";
import { StudentHistoryDesktop } from "./components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "./components/StudentHistoryMobile";

export function StudentHistoryView() {
  const { studentName, currentMonth, metrics, classes, selectedDay, selectedWeek, setSelectedDay, setSelectedWeek } =
    useStudentHistoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    if (classes[day]) {
      setIsModalOpen(true);
    }
  };

  const selectedSession = selectedDay === null ? undefined : classes[selectedDay];

  return (
    <PageContainer>
      <StudentHistoryDesktop
        studentName={studentName}
        currentMonth={currentMonth}
        metrics={metrics}
        classes={classes}
        onSelectDay={handleSelectDay}
      />
      <StudentHistoryMobile
        studentName={studentName}
        currentMonth={currentMonth}
        metrics={metrics}
        classes={classes}
        selectedWeek={selectedWeek}
        onSelectWeek={setSelectedWeek}
      />
      {isModalOpen && selectedSession && (
        <ClassDetailsModal
          session={selectedSession}
          dateStr={`Oct ${selectedDay}, 2024`}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </PageContainer>
  );
}
