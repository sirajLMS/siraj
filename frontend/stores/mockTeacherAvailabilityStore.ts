// cspell:disable
import { create } from "zustand";

export interface AvailabilityEntry {
  readonly id: string;
  readonly teacherName: string;
  readonly localTime: string;
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WeeklyAvailability {
  readonly [time: string]: {
    readonly [K in DayOfWeek]?: AvailabilityEntry | null;
  };
}

export interface TeacherAvailabilityInsights {
  readonly peakLoad: string;
  readonly availableStaff: number;
  readonly timezones: readonly string[];
}

interface TeacherAvailabilityState {
  readonly weeklyAvailability: WeeklyAvailability;
  readonly insights: TeacherAvailabilityInsights;
  readonly searchFilters: {
    readonly from: string;
    readonly to: string;
    readonly gender: string;
  };
  setSearchFilters: (filters: { from: string; to: string; gender: string }) => void;
}

const MOCK_AVAILABILITY: WeeklyAvailability = {
  "08:00 AM": {
    monday: { id: "1", teacherName: "Sarah Al-Farsi", localTime: "08:00 Local" },
    wednesday: { id: "2", teacherName: "Omar Ahmed", localTime: "08:00 Local" },
  },
  "09:00 AM": {
    tuesday: { id: "3", teacherName: "Dr. Khalid", localTime: "09:00 Local" },
    thursday: { id: "4", teacherName: "Elena Petrova", localTime: "10:00 Local" },
  },
  "10:00 AM": {
    monday: { id: "5", teacherName: "Fatima Noor", localTime: "10:00 Local" },
    thursday: { id: "6", teacherName: "James Wilson", localTime: "11:00 Local" },
    friday: { id: "7", teacherName: "Sofia Chen", localTime: "10:00 Local" },
  },
  "11:00 AM": {
    wednesday: { id: "8", teacherName: "Mohammad Ali", localTime: "11:00 Local" },
  },
  "12:00 PM": {
    tuesday: { id: "9", teacherName: "Sarah Al-Farsi", localTime: "12:00 Local" },
  },
};

const MOCK_INSIGHTS: TeacherAvailabilityInsights = {
  peakLoad: "10:00 AM",
  availableStaff: 12,
  timezones: ["GMT", "EST", "AST", "+2"],
};

export const useTeacherAvailabilityStore = create<TeacherAvailabilityState>(set => ({
  weeklyAvailability: MOCK_AVAILABILITY,
  insights: MOCK_INSIGHTS,
  searchFilters: {
    from: "11:30 AM",
    to: "03:00 PM",
    gender: "Any",
  },
  setSearchFilters: filters => {
    set({ searchFilters: filters });
  },
}));
