"use client";

import { create } from "zustand";
import type { CreateManagerMutation_createManager } from "@/frontend/common/graphql/generated/gql/graphql";

interface StaffOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: CreateManagerMutation_createManager | null;
  readonly reset: () => void;
}

export const useStaffOnboardingStore = create<StaffOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
