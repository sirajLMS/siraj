import { create } from "zustand";

export interface ParentOnboardingData {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly nationality: string;
  readonly address: string;
  readonly whatsapp: string;
  readonly facebook: string;
  readonly twitter: string;
  readonly skype: string;
  readonly zoomId: string;
  readonly invoiceType: "per_class" | "monthly" | "semester" | "";
  readonly feeAmount: string;
  readonly paymentMethod: "bank_transfer" | "credit_card" | "cash" | "paypal" | "";
  readonly currency: string;
}

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
