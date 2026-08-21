"use client";

import { create } from "zustand";
import type { CreateTeacherMutation_createTeacher } from "@/frontend/common/graphql/generated/gql/graphql";

interface TeacherOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: CreateTeacherMutation_createTeacher | null;
  readonly reset: () => void;
}

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
