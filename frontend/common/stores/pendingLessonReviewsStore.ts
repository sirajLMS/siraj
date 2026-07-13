import { create } from "zustand";

interface PendingLessonReviewsState {
  readonly teacherFilter: string;
  readonly studentFilter: string;
  readonly selectedReportId: string | null;
  readonly rejectDialogOpen: boolean;
  readonly rejectReason: string;
  readonly setTeacherFilter: (value: string) => void;
  readonly setStudentFilter: (value: string) => void;
  readonly setSelectedReportId: (id: string | null) => void;
  readonly setRejectDialogOpen: (open: boolean) => void;
  readonly setRejectReason: (reason: string) => void;
  readonly resetRejectDialog: () => void;
}

export const usePendingLessonReviewsStore = create<PendingLessonReviewsState>((set, get) => ({
  teacherFilter: "",
  studentFilter: "",
  selectedReportId: null,
  rejectDialogOpen: false,
  rejectReason: "",
  setTeacherFilter: value => set({ teacherFilter: value }),
  setStudentFilter: value => set({ studentFilter: value }),
  setSelectedReportId: id => set({ selectedReportId: id }),
  setRejectDialogOpen: open => set({ rejectDialogOpen: open }),
  setRejectReason: reason => set({ rejectReason: reason }),
  resetRejectDialog: () => set({ rejectDialogOpen: false, rejectReason: "", selectedReportId: get().selectedReportId }),
}));
