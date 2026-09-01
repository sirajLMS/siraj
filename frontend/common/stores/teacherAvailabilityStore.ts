"use client";

import { create } from "zustand";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql";

export interface AvailabilitySearchFilters {
  readonly fromTime: Date | null;
  readonly toTime: Date | null;
  readonly gender: Gender | null;
}

interface TeacherAvailabilityState {
  readonly filters: AvailabilitySearchFilters;
  readonly hasSearched: boolean;
  setSearchFilters: (filters: AvailabilitySearchFilters) => void;
  setHasSearched: (hasSearched: boolean) => void;
  reset: () => void;
}

const initialFilters: AvailabilitySearchFilters = {
  fromTime: null,
  toTime: null,
  gender: null,
};

export const useTeacherAvailabilityStore = create<TeacherAvailabilityState>(set => ({
  filters: initialFilters,
  hasSearched: false,
  setSearchFilters: filters => set({ filters }),
  setHasSearched: hasSearched => set({ hasSearched }),
  reset: () => set({ filters: initialFilters, hasSearched: false }),
}));
