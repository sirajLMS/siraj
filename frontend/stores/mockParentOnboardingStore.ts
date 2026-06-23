import { create } from "zustand";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/parents/onboarding/types";

export type { ParentOnboardingFormData };
export type ParentOnboardingData = ParentOnboardingFormData;

interface ParentOnboardingState {
  readonly data: ParentOnboardingData;
  readonly isSubmitting: boolean;
  readonly setField: <K extends keyof ParentOnboardingData>(field: K, value: ParentOnboardingData[K]) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly reset: () => void;
}

const initialState: ParentOnboardingData = {
  fullName: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  skype: "",
  zoomId: "",
  invoiceType: "",
  feeAmount: "",
  paymentMethod: "",
  currency: "USD",
};

export const useParentOnboardingStore = create<ParentOnboardingState>(set => ({
  data: initialState,
  isSubmitting: false,
  setField: (field, value) => {
    set(state => ({
      data: { ...state.data, [field]: value },
    }));
  },
  setSubmitting: isSubmitting => {
    set({ isSubmitting });
  },
  reset: () => {
    set({ data: initialState, isSubmitting: false });
  },
}));
