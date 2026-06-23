import { create } from "zustand";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";

export type { TeacherOnboardingFormData };
export type TeacherOnboardingData = TeacherOnboardingFormData;

interface TeacherOnboardingState {
  readonly data: TeacherOnboardingData;
  readonly isSubmitting: boolean;
  readonly setField: <K extends keyof TeacherOnboardingData>(field: K, value: TeacherOnboardingData[K]) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly reset: () => void;
}

const initialState: TeacherOnboardingData = {
  fullName: "",
  email: "",
  nationality: "",
  nationalId: "",
  phone: "",
  age: "",
  gender: "",
  address: "",
  qualifications: "",
  skypeId: "",
  zoomLink: "",
  country: "Egypt",
  zoomUsername: "",
  zoomPassword: "",
  timezone: "(GMT+02:00) Cairo",
  salaryAmount: "",
  currency: "USD",
  beneficiaryName: "",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
  swiftBic: "",
  iban: "",
};

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
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
