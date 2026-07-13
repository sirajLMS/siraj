import { create } from "zustand";
import type { TeacherOnboardingCreateResult } from "@/frontend/views/dashboard/teachers/onboarding/types";

interface TeacherOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: TeacherOnboardingCreateResult | null;
  readonly reset: () => void;
}

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
