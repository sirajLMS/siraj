import { create } from "zustand";
import type { DayScheduleConfig as BaseDayScheduleConfig } from "@/frontend/stores/recurring-schedule-types";
import type { DayOfWeek } from "@/frontend/views/dashboard/classes/recurring/types";

export type DayScheduleConfig = BaseDayScheduleConfig<DayOfWeek>;

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: "MONDAY", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "TUESDAY", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "WEDNESDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "THURSDAY", enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: "FRIDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "SATURDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
  { day: "SUNDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
];

interface CreateRecurringClassState {
  readonly isDialogOpen: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly days: readonly DayScheduleConfig[];
  openDialog: () => void;
  closeDialog: () => void;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  setErrorMessage: (message: string) => void;
  clearError: () => void;
  toggleDay: (day: DayOfWeek) => void;
  setTimeOverride: (day: DayOfWeek, time: string) => void;
  toggleTimeOverride: (day: DayOfWeek) => void;
  resetDays: () => void;
}

export const useCreateRecurringClassStore = create<CreateRecurringClassState>(set => ({
  isDialogOpen: false,
  isSubmitting: false,
  showSuccess: false,
  errorMessage: null,
  days: DEFAULT_DAY_SCHEDULE,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),
  setSubmitting: value => set({ isSubmitting: value }),
  setShowSuccess: value => set({ showSuccess: value }),
  resetSuccess: () => set({ showSuccess: false }),
  setErrorMessage: message => set({ errorMessage: message }),
  clearError: () => set({ errorMessage: null }),
  toggleDay: day =>
    set(state => ({
      days: state.days.map(d => (d.day === day ? { ...d, enabled: !d.enabled } : d)),
    })),
  setTimeOverride: (day, time) =>
    set(state => ({
      days: state.days.map(d => (d.day === day ? { ...d, timeOverride: time } : d)),
    })),
  toggleTimeOverride: day =>
    set(state => ({
      days: state.days.map(d => (d.day === day ? { ...d, showOverride: !d.showOverride } : d)),
    })),
  resetDays: () => set({ days: DEFAULT_DAY_SCHEDULE }),
}));
