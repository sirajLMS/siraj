import { create } from "zustand";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface StudentGroup {
  readonly id: string;
  readonly name: string;
}

export interface DayScheduleConfig {
  readonly day: DayOfWeek;
  readonly enabled: boolean;
  readonly timeOverride: string;
  readonly showOverride: boolean;
  readonly isWeekend: boolean;
}

interface CreateRecurringClassState {
  readonly studentGroups: readonly StudentGroup[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
}

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: "monday", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "tuesday", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "wednesday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "thursday", enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: "friday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "saturday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
  { day: "sunday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
];

const MOCK_STUDENT_GROUPS: readonly StudentGroup[] = [
  { id: "grade-10-math", name: "Grade 10 - Advanced Math" },
  { id: "grade-11-physics", name: "Grade 11 - Physics Honors" },
  { id: "grade-9-english", name: "Grade 9 - English Lit" },
];

export const useCreateRecurringClassStore = create<CreateRecurringClassState>(set => ({
  studentGroups: MOCK_STUDENT_GROUPS,
  isSubmitting: false,
  showSuccess: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
}));
