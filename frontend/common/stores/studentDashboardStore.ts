import { create } from "zustand";
import type { StudentDashboardState } from "@/frontend/common/stores/studentDashboardTypes";

export const useStudentDashboardStore = create<StudentDashboardState>(set => ({
  reflectionDialogOpen: false,
  selectedReportId: null,
  setReflectionDialogOpen: reflectionDialogOpen => set({ reflectionDialogOpen }),
  setSelectedReportId: selectedReportId => set({ selectedReportId }),
}));
