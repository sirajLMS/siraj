// cspell:disable
import { create } from "zustand";
import type { TeacherDashboardState } from "./teacherDashboardTypes";

const INITIAL_STATE: TeacherDashboardState = {
  metrics: {
    totalClasses: 8,
    missedSlots: 2,
    completed: 3,
    studentsToday: 14,
  },
  scheduleRows: [
    {
      id: "teacher-session-1",
      rowNumber: 1,
      classId: "SLMS-9821",
      studentName: "Zaid Salman",
      studentInitials: "ZS",
      timeRange: "08:00 AM - 09:00 AM",
      status: "missed",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-2",
      rowNumber: 2,
      classId: "SLMS-4412",
      studentName: "Laila Mansour",
      studentInitials: "LM",
      timeRange: "10:30 AM - 11:30 AM",
      status: "upcoming",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-3",
      rowNumber: 3,
      classId: "SLMS-3390",
      studentName: "Omar Abbas",
      studentInitials: "OA",
      timeRange: "12:00 PM - 01:00 PM",
      status: "upcoming",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-4",
      rowNumber: 4,
      classId: "SLMS-1102",
      studentName: "Fatima Hadi",
      studentInitials: "FH",
      timeRange: "02:30 PM - 03:30 PM",
      status: "completed",
      videoEnabled: false,
      activateEnabled: false,
    },
  ],
  missedAlert: {
    classId: "SLMS-9821",
    scheduledTime: "08:00 AM",
  },
  scheduleDateLabel: "Monday, October 23, 2023",
  totalScheduledToday: 8,
};

export const useTeacherDashboardStore = create<TeacherDashboardState>(() => INITIAL_STATE);
