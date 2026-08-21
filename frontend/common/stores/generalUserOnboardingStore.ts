"use client";

import { create } from "zustand";
import type { CreateGeneralUserMutation_createGeneralUser } from "@/frontend/common/graphql/generated/gql/graphql";

interface GeneralUserOnboardingState {
  readonly result: CreateGeneralUserMutation_createGeneralUser | null;
  readonly setResult: (result: CreateGeneralUserMutation_createGeneralUser | null) => void;
  readonly reset: () => void;
}

export const useGeneralUserOnboardingStore = create<GeneralUserOnboardingState>(set => ({
  result: null,
  setResult: result => set({ result }),
  reset: () => set({ result: null }),
}));
