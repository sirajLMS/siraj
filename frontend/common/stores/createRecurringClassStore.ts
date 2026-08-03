import { create } from "zustand";
import type {
  DayOfWeek,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type DayScheduleConfig,
  DEFAULT_DAY_SCHEDULE,
} from "@/frontend/common/views/dashboard/classes/recurring/types";

interface CreateRecurringClassState {
  readonly isDialogOpen: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly days: readonly DayScheduleConfig[];
  readonly schedulingMode: SchedulingMode | null;
  readonly quotaId: string | null;
  readonly earmarkedClasses: number | null;
  readonly generationHorizonWeeks: number | null;
  readonly ondemandNoCreditsOutcome: OnDemandNoCreditsOutcome | null;
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
  setSchedulingMode: (value: SchedulingMode | null) => void;
  setQuotaId: (value: string | null) => void;
  setEarmarkedClasses: (value: number | null) => void;
  setGenerationHorizonWeeks: (value: number | null) => void;
  setOndemandNoCreditsOutcome: (value: OnDemandNoCreditsOutcome | null) => void;
}

export const useCreateRecurringClassStore = create<CreateRecurringClassState>(set => ({
  isDialogOpen: false,
  isSubmitting: false,
  showSuccess: false,
  errorMessage: null,
  days: DEFAULT_DAY_SCHEDULE,
  schedulingMode: null,
  quotaId: null,
  earmarkedClasses: null,
  generationHorizonWeeks: null,
  ondemandNoCreditsOutcome: null,
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
  setSchedulingMode: value => set({ schedulingMode: value }),
  setQuotaId: value => set({ quotaId: value }),
  setEarmarkedClasses: value => set({ earmarkedClasses: value }),
  setGenerationHorizonWeeks: value => set({ generationHorizonWeeks: value }),
  setOndemandNoCreditsOutcome: value => set({ ondemandNoCreditsOutcome: value }),
}));
