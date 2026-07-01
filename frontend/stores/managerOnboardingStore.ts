import { create } from "zustand";
import type { ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

interface ManagerOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ManagerOnboardingResult | null;
  readonly reset: () => void;
}

export const useManagerOnboardingStore = create<ManagerOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
