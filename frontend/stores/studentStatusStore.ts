import { create } from "zustand";
import type { StudentStatus } from "@/shared/lib/enum";

interface StudentStatusState {
  readonly selectedStatus: StudentStatus | null;
  setSelectedStatus: (status: StudentStatus | null) => void;
}

export const useStudentStatusStore = create<StudentStatusState>(set => ({
  selectedStatus: null,

  setSelectedStatus: status => {
    set({ selectedStatus: status });
  },
}));
