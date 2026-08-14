import { create } from "zustand";
import type { GeneralUserCreateResult } from "@/frontend/common/graphql/generated/gql/graphql-types";

interface GeneralUserOnboardingState {
  readonly result: GeneralUserCreateResult | null;
  readonly setResult: (result: GeneralUserCreateResult | null) => void;
  readonly reset: () => void;
}

export const useGeneralUserOnboardingStore = create<GeneralUserOnboardingState>(set => ({
  result: null,
  setResult: result => set({ result }),
  reset: () => set({ result: null }),
}));
