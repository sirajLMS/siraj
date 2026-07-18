import { create } from "zustand";

export type TeacherDashboardMode = "standard" | "active";

const DEFAULT_PAGE_SIZE = 10;

export interface TeacherDashboardUIState {
  readonly mode: TeacherDashboardMode;
  readonly filterDate: string;
  readonly page: number;
  readonly pageSize: number;
  readonly setMode: (mode: TeacherDashboardMode) => void;
  readonly setFilterDate: (date: string) => void;
  readonly setPage: (page: number) => void;
  // NEW FOR PLAN v5: lifted `absentDialogOpen` from teacherActiveSessionControls.{mobile,desktop}.tsx
  // so the dialog state is owned by the TeacherDashboard Zustand store per specs.md §3 N7 + §6.4
  // (state lives in common stores and flows down via Container → ViewModel → tier props).
  readonly absentDialogOpen: boolean;
  readonly absentDialogClassInstanceId: string | null;
  readonly setAbsentDialogOpen: (open: boolean) => void;
  // NEW FOR PLAN v5: opens the absent dialog capturing the row's
  // classInstanceId so the shared dialog confirm can route to the right row.
  // Without this, the lifted single-dialog would lose the row identity
  // originally captured by per-instance `useState` closures.
  readonly openAbsentDialogForClass: (classInstanceId: string) => void;
  // NEW FOR PLAN v5: aggregated `has*` permission booleans lifted from
  // <RequirePermission> wrappers that previously lived inside
  // teacherActiveSessionControls.{mobile,desktop}.tsx and
  // teacherScheduleStatusContent.mobile.tsx /
  // teacherScheduleSessionActionsCell.desktop.tsx per specs.md §3 N3 + §6.4
  // (permission gating lives in the common Container, NEVER in a tier view).
  readonly hasSessionUpdateStatusStart: boolean;
  readonly hasSessionUpdateStatusAbsent: boolean;
  readonly hasSessionUpdateStatusLeave: boolean;
  readonly hasSessionActivateClass: boolean;
  readonly setSessionPermissionBooleans: (booleans: {
    readonly hasSessionUpdateStatusStart: boolean;
    readonly hasSessionUpdateStatusAbsent: boolean;
    readonly hasSessionUpdateStatusLeave: boolean;
    readonly hasSessionActivateClass: boolean;
  }) => void;
}

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const useTeacherDashboardStore = create<TeacherDashboardUIState>(set => ({
  mode: "standard",
  filterDate: getTodayString(),
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setMode: mode => set({ mode }),
  setFilterDate: filterDate => set({ filterDate, page: 0 }),
  setPage: page => set({ page }),
  // NEW FOR PLAN v5: absentDialog dialog state defaults to closed.
  absentDialogOpen: false,
  absentDialogClassInstanceId: null,
  setAbsentDialogOpen: open => set({ absentDialogOpen: open }),
  openAbsentDialogForClass: classInstanceId =>
    set({ absentDialogOpen: true, absentDialogClassInstanceId: classInstanceId }),
  // NEW FOR PLAN v5: default to false until the Container computes & pushes
  // the actual derived permission booleans on first render.
  hasSessionUpdateStatusStart: false,
  hasSessionUpdateStatusAbsent: false,
  hasSessionUpdateStatusLeave: false,
  hasSessionActivateClass: false,
  setSessionPermissionBooleans: booleans =>
    set({
      hasSessionUpdateStatusStart: booleans.hasSessionUpdateStatusStart,
      hasSessionUpdateStatusAbsent: booleans.hasSessionUpdateStatusAbsent,
      hasSessionUpdateStatusLeave: booleans.hasSessionUpdateStatusLeave,
      hasSessionActivateClass: booleans.hasSessionActivateClass,
    }),
}));
