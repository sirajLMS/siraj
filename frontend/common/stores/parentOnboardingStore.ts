"use client";

import { create } from "zustand";
import type { CreateParentMutation_createParent } from "@/frontend/common/graphql/generated/gql/graphql";

interface ParentOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: CreateParentMutation_createParent | null;
  readonly reset: () => void;
}

export const useParentOnboardingStore = create<ParentOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));
