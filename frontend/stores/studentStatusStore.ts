import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { StudentStatusInfo } from "@/frontend/views/dashboard/students/status/types";

interface StudentStatusState {
  readonly studentInfo: StudentStatusInfo | null;
  readonly isLoading: boolean;
  readonly isUpdating: boolean;
  fetchStudentStatus: (id: string) => Promise<void>;
  updateStatus: (status: "regular" | "suspended" | "on-leave", reason: string) => Promise<void>;
}

export const useStudentStatusStore = create<StudentStatusState>(set => ({
  studentInfo: null,
  isLoading: false,
  isUpdating: false,
  fetchStudentStatus: async _id => {
    set({ isLoading: true });
    set({ studentInfo: null, isLoading: false });
  },
  updateStatus: async (status, _reason) => {
    set({ isUpdating: true });
    logger.info("Student status updated", { status });
    set(state => ({
      isUpdating: false,
      studentInfo: state.studentInfo
        ? {
            ...state.studentInfo,
            status,
            upcomingClasses: state.studentInfo.upcomingClasses.map(cls => ({
              ...cls,
              status: status === "suspended" ? "suspended" : status === "on-leave" ? "on-leave" : "scheduled",
            })),
          }
        : null,
    }));
  },
}));
