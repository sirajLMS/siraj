import { create } from "zustand";

interface PendingLessonReviewsState {
  readonly teacherFilter: string;
  readonly studentFilter: string;
  readonly selectedReportId: string | null;
  readonly rejectDialogOpen: boolean;
  readonly rejectReason: string;
  readonly page: number;
  readonly pageSize: number;
  readonly setTeacherFilter: (value: string) => void;
  readonly setStudentFilter: (value: string) => void;
  readonly setSelectedReportId: (id: string | null) => void;
  readonly setRejectDialogOpen: (open: boolean) => void;
  readonly setRejectReason: (reason: string) => void;
  readonly resetRejectDialog: () => void;
  readonly setPage: (page: number) => void;
}

export const usePendingLessonReviewsStore = create<PendingLessonReviewsState>((set, get) => ({
  teacherFilter: "",
  studentFilter: "",
  selectedReportId: null,
  rejectDialogOpen: false,
  rejectReason: "",
  page: 0,
  pageSize: 25,
  setTeacherFilter: value => set({ teacherFilter: value, page: 0 }),
  setStudentFilter: value => set({ studentFilter: value, page: 0 }),
  setSelectedReportId: id => set({ selectedReportId: id }),
  setRejectDialogOpen: open => set({ rejectDialogOpen: open }),
  setRejectReason: reason => set({ rejectReason: reason }),
  resetRejectDialog: () => set({ rejectDialogOpen: false, rejectReason: "", selectedReportId: get().selectedReportId }),
  setPage: page => set({ page }),
}));
