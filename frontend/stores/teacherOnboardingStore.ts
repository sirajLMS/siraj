import { create } from "zustand";

export interface TeacherOnboardingData {
  readonly fullName: string;
  readonly email: string;
  readonly nationality: string;
  readonly nationalId: string;
  readonly phone: string;
  readonly age: string;
  readonly gender: "male" | "female" | "";
  readonly address: string;
  readonly qualifications: string;
  readonly skypeId: string;
  readonly zoomLink: string;
  readonly country: string;
  readonly zoomUsername: string;
  readonly zoomPassword: string;
  readonly timezone: string;
  readonly salaryAmount: string;
  readonly currency: string;
  readonly beneficiaryName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly routingNumber: string;
  readonly swiftBic: string;
  readonly iban: string;
}

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
