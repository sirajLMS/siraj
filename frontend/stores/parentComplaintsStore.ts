import { create } from "zustand";
import type { ParentStudentOption } from "@/frontend/views/dashboard/complaints/types/complaints.types";

interface ParentComplaintsState {
  readonly studentOptions: readonly ParentStudentOption[];
  readonly selectedStudentId: string;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setStudentOptions: (options: readonly ParentStudentOption[]) => void;
  setSelectedStudentId: (id: string) => void;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
}

export const useParentComplaintsStore = create<ParentComplaintsState>(set => ({
  studentOptions: [],
  selectedStudentId: "",
  isSubmitting: false,
  showSuccess: false,
  setStudentOptions: options => {
    set({ studentOptions: options });
  },
  setSelectedStudentId: id => {
    set({ selectedStudentId: id });
  },
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
}));
