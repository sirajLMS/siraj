// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";

export interface ParentInvoiceOption {
  readonly id: string;
  readonly name: string;
  readonly label: string;
}

interface AdminManualInvoiceState {
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  submitInvoice: (data: ManualInvoiceFormData, sendEmail: boolean) => void;
}

const MOCK_PARENT_OPTIONS: readonly ParentInvoiceOption[] = [
  { id: "4492", name: "Ahmed Khan", label: "Ahmed Khan (ID: 4492)" },
  { id: "1023", name: "Sara Alii", label: "Sara Alii (ID: 1023)" },
  { id: "8821", name: "John Smith", label: "John Smith (ID: 8821)" },
  { id: "3099", name: "Fatima Zayed", label: "Fatima Zayed (ID: 3099)" },
];

export const useAdminManualInvoiceStore = create<AdminManualInvoiceState>(set => ({
  parentOptions: MOCK_PARENT_OPTIONS,
  isSubmitting: false,
  showSuccess: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
  submitInvoice: (data, sendEmail) => {
    logger.info("Manual invoice submitted", { data, sendEmail });
    set({ showSuccess: true });
  },
}));
