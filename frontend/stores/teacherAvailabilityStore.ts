// cspell:disable
import { create } from "zustand";
import type {
  TeacherAvailabilityInsights,
  WeeklyAvailability,
} from "@/frontend/views/dashboard/teachers/availability/types";

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

export const useTeacherAvailabilityStore = create<TeacherAvailabilityState>(set => ({
  weeklyAvailability: {},
  insights: { peakLoad: "", availableStaff: 0, timezones: [] },
  searchFilters: {
    from: "",
    to: "",
    gender: "Any",
  },
  setSearchFilters: filters => {
    set({ searchFilters: filters });
  },
}));
