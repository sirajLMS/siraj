import { create } from "zustand";
import type { ParentOnboardingResult } from "@/frontend/common/graphql/generated/gql/graphql-types";

interface ParentOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ParentOnboardingResult | null;
  readonly reset: () => void;
}

export const useParentOnboardingStore = create<ParentOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
