"use client";

import { create } from "zustand";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface AvailabilitySearchFilters {
  readonly fromTime: Date | null;
  readonly toTime: Date | null;
  readonly gender: Gender | null;
}

interface TeacherAvailabilityState {
  readonly filters: AvailabilitySearchFilters;
  setSearchFilters: (filters: AvailabilitySearchFilters) => void;
  reset: () => void;
}

const initialFilters: AvailabilitySearchFilters = {
  fromTime: null,
  toTime: null,
  gender: null,
};

export const useTeacherAvailabilityStore = create<TeacherAvailabilityState>(set => ({
  filters: initialFilters,
  setSearchFilters: filters => set({ filters }),
  reset: () => set({ filters: initialFilters }),
}));
