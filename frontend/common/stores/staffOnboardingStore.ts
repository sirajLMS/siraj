"use client";

import { create } from "zustand";
import type { ManagerOnboardingResult } from "@/frontend/common/graphql/generated/gql/graphql-types";

interface StaffOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ManagerOnboardingResult | null;
  readonly reset: () => void;
}

export const useStaffOnboardingStore = create<StaffOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
