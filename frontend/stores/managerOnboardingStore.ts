import { create } from "zustand";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";

interface ManagerOnboardingState {
  readonly data: ManagerOnboardingFormData;
  readonly isSubmitting: boolean;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly reset: () => void;
}

const initialState: ManagerOnboardingFormData = {
  fullName: "",
  email: "",
  phone: "",
  skypeId: "",
  accountType: "manager",
  department: "academic",
};

export const useManagerOnboardingStore = create<ManagerOnboardingState>(set => ({
  data: initialState,
  isSubmitting: false,
  setSubmitting: isSubmitting => {
    set({ isSubmitting });
  },
  reset: () => {
    set({ data: initialState, isSubmitting: false });
  },
}));
