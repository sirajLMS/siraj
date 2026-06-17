import { create } from "zustand";
import type { ClassInstance } from "@/frontend/views/dashboard/types/dashboard";

interface ClassDetailsState {
  instance: ClassInstance;
  isWarningDismissed: boolean;
  dismissWarning: () => void;
}

const mockInstance: ClassInstance = {
  id: "cls-9921",
  instanceId: "SRJ-449-AA",
  courseName: "Advanced Arabic Grammar",
  student: {
    id: "88290",
    name: "Ahmed Omar",
    grade: "Grade 12",
    level: 4,
    avatarUrl: "/demo/avatars/01.png",
  },
  teacher: {
    name: "Dr. Ali",
    title: "Senior Linguist • PH.D",
    avatarUrl: "/demo/avatars/04.png",
  },
  scheduledDate: "Oct 24, 2023",
  startTime: "24 Oct 2023, 09:00 AM",
  endTime: "24 Oct 2023, 10:30 AM",
  durationMinutes: 90,
  status: "pending",
  latencyMs: 14,
  authorization: "OAuth 2.0 SSL",
  remarks:
    "Student requested focus on Surah .. verses 120-140. Please ensure high-quality audio recording for parent review.",
  hasTimezoneMismatch: true,
  studentTimezone: "GMT+3",
  performanceMetrics: [
    { key: "engagement", labelKey: "engagementScore", value: "92%" },
    { key: "assessment", labelKey: "assessmentProgress", value: "14/20" },
    { key: "focus", labelKey: "focusLevel", value: "High" },
    { key: "health", labelKey: "sessionHealth", value: "Stable" },
  ],
  heatmapData: [40, 60, 30, 80, 55, 45, 90, 70, 40, 60, 35, 85, 50, 40, 95, 75, 40, 60, 20, 80],
  attendanceRate: 94,
  avgGrade: "A-",
  lastClassDaysAgo: 3,
};

export const useClassDetailsStore = create<ClassDetailsState>(set => ({
  instance: mockInstance,
  isWarningDismissed: false,
  dismissWarning: () => {
    set({ isWarningDismissed: true });
  },
}));
