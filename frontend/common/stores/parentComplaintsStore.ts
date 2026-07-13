import { create } from "zustand";
import type { ParentStudentOption } from "@/frontend/common/types/shared.types";

const DEFAULT_PAGE_SIZE = 10;

interface ParentComplaintsState {
  readonly studentOptions: readonly ParentStudentOption[];
  readonly selectedStudentId: string;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly page: number;
  readonly pageSize: number;
  setStudentOptions: (options: readonly ParentStudentOption[]) => void;
  setSelectedStudentId: (id: string) => void;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  setPage: (page: number) => void;
}

export const useParentComplaintsStore = create<ParentComplaintsState>(set => ({
  studentOptions: [],
  selectedStudentId: "",
  isSubmitting: false,
  showSuccess: false,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
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
  setPage: page => {
    set({ page });
  },
}));
