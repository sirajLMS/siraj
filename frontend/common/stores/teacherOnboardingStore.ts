import { create } from "zustand";
import type { TeacherOnboarding } from "@/frontend/common/graphql/generated/gql/graphql-types";

interface TeacherOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: TeacherOnboarding | null;
  readonly reset: () => void;
}

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
