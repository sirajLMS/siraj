import { create } from "zustand";
import type { StudentDashboardState } from "@/frontend/common/stores/studentDashboardTypes";

const DEFAULT_PAGE_SIZE = 5;

export const useStudentDashboardStore = create<StudentDashboardState>(set => ({
  reflectionDialogOpen: false,
  selectedReportId: null,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  reportsTotalCount: 0,
  setReflectionDialogOpen: reflectionDialogOpen => set({ reflectionDialogOpen }),
  setSelectedReportId: selectedReportId => set({ selectedReportId }),
  setPage: page => set({ page }),
  setReportsTotalCount: reportsTotalCount => set({ reportsTotalCount }),
}));
