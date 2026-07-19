import { create } from "zustand";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";

interface PendingLessonReviewsState {
  readonly selectedTeacher: PersonOption | null;
  readonly studentFilter: PersonOption | null;
  readonly selectedReportId: string | null;
  readonly rejectDialogOpen: boolean;
  readonly rejectReason: string;
  readonly page: number;
  readonly pageSize: number;
  readonly setSelectedTeacher: (value: PersonOption | null) => void;
  readonly setStudentFilter: (value: PersonOption | null) => void;
  readonly setSelectedReportId: (id: string | null) => void;
  readonly setRejectDialogOpen: (open: boolean) => void;
  readonly setRejectReason: (reason: string) => void;
  readonly resetRejectDialog: () => void;
  readonly setPage: (page: number) => void;
}

export const usePendingLessonReviewsStore = create<PendingLessonReviewsState>((set, get) => ({
  selectedTeacher: null,
  studentFilter: null,
  selectedReportId: null,
  rejectDialogOpen: false,
  rejectReason: "",
  page: 0,
  pageSize: 25,
  setSelectedTeacher: value => set({ selectedTeacher: value, page: 0 }),
  setStudentFilter: value => set({ studentFilter: value, page: 0 }),
  setSelectedReportId: id => set({ selectedReportId: id }),
  setRejectDialogOpen: open => set({ rejectDialogOpen: open }),
  setRejectReason: reason => set({ rejectReason: reason }),
  resetRejectDialog: () => set({ rejectDialogOpen: false, rejectReason: "", selectedReportId: get().selectedReportId }),
  setPage: page => set({ page }),
}));
