import { create } from "zustand";
import type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherScheduleRow,
} from "@/frontend/common/stores/teacherDashboardTypes";
import type { MetricItem } from "@/frontend/common/types/shared.types";

export type TeacherDashboardMode = "standard" | "active";
export type SnackbarSeverity = "success" | "error" | "info";
export type SupportRequestType = "COORDINATOR" | "SUPPORT";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Action handler registry. Each per-feature island registers its mutation
 * handlers here on mount; the coordinator reads them from the store and
 * threads them through the ViewModel tier props. Keeping functions out of
 * `JSON.stringify`-able state is safe because this store is in-memory only
 * (no `persist` middleware) — see frontend/common/stores/AGENTS.md.
 */
export interface TeacherDashboardHandlers {
  /**
   * Refetch the underlying dashboard query. Registered by the data island
   * (which owns `useQuery`) so mutation-bearing islands can request a refresh
   * without a direct Apollo client reference.
   */
  readonly refetch?: () => Promise<void> | void;
  readonly onActivate?: (id: string) => Promise<void> | void;
  readonly onStartSession?: (id: string) => Promise<void> | void;
  readonly onMarkAbsent?: (id: string) => Promise<void> | void;
  readonly onRequestLeave?: (id: string) => Promise<void> | void;
  readonly onManualEntryOpen?: () => void;
  readonly onNewSession?: () => void;
  readonly onManualEntryClose?: () => void;
  readonly onManualEntrySubmit?: (data: {
    readonly studentId: string;
    readonly subjectId: string;
    readonly scheduledStartAt: string;
    readonly scheduledEndAt: string;
    readonly durationMinutes: number;
    readonly classType: string;
  }) => Promise<void>;
  readonly onDownloadHandbook?: () => void;
  readonly onContactCoordinator?: () => void;
  readonly onSupport?: () => void;
  readonly onAbsentDialogConfirm?: () => Promise<void> | void;
}

/**
 * Dashboard query result slice. The data island populates this with values
 * derived from `useQuery(teacherDashboardQueryDocument)`; the coordinator
 * reads it to assemble the ViewModel. Apollo cache lives outside the store —
 * only the derived, render-ready snapshot is mirrored here so the tier
 * switcher can restore identical view content unmounted/mounted under the
 * mobile/desktop boundary.
 */
export interface TeacherDashboardDataSlice {
  readonly loading: boolean;
  readonly metricItems: readonly MetricItem[];
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly missedAlert: MissedClassAlert | null;
  readonly totalCount: number;
  readonly dashboardId: string;
  readonly teacherId: string;
  readonly lastUpdated: string;
  readonly activationError: string | null;
}

export interface TeacherDashboardUIState {
  readonly mode: TeacherDashboardMode;
  readonly filterDate: string;
  readonly page: number;
  readonly pageSize: number;
  readonly setMode: (mode: TeacherDashboardMode) => void;
  readonly setFilterDate: (date: string) => void;
  readonly setPage: (page: number) => void;
  // Lifted `absentDialogOpen` from teacherActiveSessionControls.{mobile,desktop}.tsx
  // so the dialog state is owned by the TeacherDashboard Zustand store and flows
  // down via Container → ViewModel → tier props. The single shared dialog
  // captures `absentDialogClassInstanceId` so confirm dispatches to the right row.
  readonly absentDialogOpen: boolean;
  readonly absentDialogClassInstanceId: string | null;
  readonly setAbsentDialogOpen: (open: boolean) => void;
  readonly openAbsentDialogForClass: (classInstanceId: string) => void;
  // Aggregated `has*` permission booleans lifted from per-tier
  // <RequirePermission> wrappers and computed once by the coordinator.
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
  /**
   * Manual-class-entry dialog state owned by the store so the modal survives
   * tier switching. The submit mutation itself lives in the manual entry
   * island; only the open flag + default-active mode are tracked here.
   */
  readonly manualEntryOpen: boolean;
  readonly manualEntryDefaultActive: boolean;
  readonly setManualEntryOpen: (open: boolean) => void;
  readonly setManualEntryDefaultActive: (active: boolean) => void;
  /**
   * Shared snackbar slice so any island (handbook, manual entry, support)
   * can surface feedback. The snackbar island renders from these fields.
   */
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  readonly setSnackbarOpen: (open: boolean) => void;
  /**
   * Data + handler registries populated by feature islands. The coordinator
   * pulls from here to compose the ViewModel tier props.
   */
  readonly data: TeacherDashboardDataSlice;
  readonly setData: (data: Partial<TeacherDashboardDataSlice>) => void;
  readonly handlers: TeacherDashboardHandlers;
  readonly setHandlers: (handlers: Partial<TeacherDashboardHandlers>) => void;
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
  absentDialogOpen: false,
  absentDialogClassInstanceId: null,
  setAbsentDialogOpen: open => set({ absentDialogOpen: open }),
  openAbsentDialogForClass: classInstanceId =>
    set({ absentDialogOpen: true, absentDialogClassInstanceId: classInstanceId }),
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
  manualEntryOpen: false,
  manualEntryDefaultActive: false,
  setManualEntryOpen: open => set({ manualEntryOpen: open }),
  setManualEntryDefaultActive: active => set({ manualEntryDefaultActive: active }),
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "info",
  showSnackbar: (message, severity = "info") =>
    set({ snackbarOpen: true, snackbarMessage: message, snackbarSeverity: severity }),
  setSnackbarOpen: open => set({ snackbarOpen: open }),
  data: {
    loading: true,
    metricItems: [],
    scheduleRows: [],
    progressFeed: [],
    missedAlert: null,
    totalCount: 0,
    dashboardId: "",
    teacherId: "",
    lastUpdated: "",
    activationError: null,
  },
  setData: partial => set(state => ({ data: { ...state.data, ...partial } })),
  handlers: {},
  setHandlers: partial => set(state => ({ handlers: { ...state.handlers, ...partial } })),
}));
