// NEW FOR PLAN v5 (newly created for the migration wave): Lifted the
// teachers-dashboard shared component-props interfaces from the byte-identical
// `(Mobile|Desktop)Props` pairs that previously lived inline in the tier files
// per specs.md §4.1 Class B (UNIFIED ORIGINAL). Every interface declared here
// has a byte-identical twin in the mobile + desktop tier directories; lifting
// collapses them into ONE shared `XxxProps` (no tier suffix) imported by BOTH
// tiers.

import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MissedClassAlert, TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { StudentProgressFeedItem } from "@/frontend/common/types/shared.types";
import type {
  TeacherDashboardLabels,
  TeacherDashboardViewLabels,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

// NEW FOR PLAN v5: SessionActivateButtonProps — byte-identical pair lifted
// from the mobile + desktop `sessionActivateButton.*` tier files.
export interface SessionActivateButtonProps {
  readonly disabled: boolean;
  readonly isConnecting: boolean;
  readonly activateLabel: string;
  readonly connectingLabel: string;
  readonly tooltip: string;
  readonly onActivate: () => void;
  readonly fullWidth?: boolean;
}

// NEW FOR PLAN v5: MissedClassAlertBannerProps — byte-identical pair lifted
// from the mobile + desktop `missedClassAlertBanner.*` tier files.
export interface MissedClassAlertBannerProps {
  readonly alert: MissedClassAlert;
  readonly labels: TeacherDashboardLabels["alert"];
  readonly fixed?: boolean;
}

// NEW FOR PLAN v5: ActivationPolicyPanelProps — byte-identical pair lifted
// from the mobile + desktop `activationPolicyPanel.*` tier files.
export interface ActivationPolicyPanelProps {
  readonly labels: TeacherDashboardLabels["policy"];
  readonly compact?: boolean;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly actionLabels: TeacherDashboardLabels["actions"];
}

// NEW FOR PLAN v5: StudentProgressFeedProps — byte-identical pair lifted from
// the mobile + desktop `studentProgressFeed.*` tier files.
export interface StudentProgressFeedProps {
  readonly items: readonly StudentProgressFeedItem[];
  readonly title: string;
  readonly labels: TeacherDashboardLabels["progressFeed"];
}

// NEW FOR PLAN v5: TeacherActiveSessionControlsProps — byte-identical pair
// lifted from the mobile + desktop `teacherActiveSessionControls.*` tier
// files. Per specs.md §3 N3 + N7 + §6.4, the `RequirePermission` wrappers and
// the `absentDialogOpen` useState were lifted out of the tier files: the
// Container computes `has*` permission booleans from `useUserStore` and
// pushes them through the ViewModel, and the dialog open state lives in the
// TeacherDashboard Zustand store, also flowing down via props.
export interface TeacherActiveSessionControlsProps {
  readonly labels: TeacherDashboardLabels["activeControls"];
  readonly showStart?: boolean;
  readonly showMarkAbsent?: boolean;
  readonly showRequestLeave?: boolean;
  readonly startTooltip?: string;
  readonly markAbsentTooltip?: string;
  readonly requestLeaveTooltip?: string;
  readonly markAbsentDisabled?: boolean;
  readonly onStart: () => void;
  readonly onMarkAbsent: () => void;
  readonly onRequestLeave: () => void;
  // NEW FOR PLAN v5: lifted permission booleans (Container-owned). Optional
  // so the unwired-up parent schedule cards keep type-checking while the
  // prop is being threaded through the intermediate layer — see CROSS-FILE
  // DEPENDENCY report: the schedule cards need to forward these props and
  // the dashboard store's `has*` booleans (or the Container-supplied props).
  readonly hasSessionUpdateStatusStart?: boolean;
  readonly hasSessionUpdateStatusAbsent?: boolean;
  readonly hasSessionUpdateStatusLeave?: boolean;
  // NEW FOR PLAN v5: lifted dialog state (Zustand-owned). The opener is
  // a no-arg callback — the calling schedule-row card binds the row's
  // classInstanceId to the store's `openAbsentDialogForClass` at the call
  // site (so the shared dialog confirm routes to the correct row, preserving
  // the row identity originally captured by per-instance `useState` closures).
  readonly absentDialogOpen?: boolean;
  readonly onAbsentDialogOpen?: () => void;
  readonly onAbsentDialogClose?: () => void;
  // NEW FOR PLAN v5: dialog-confirm handler — bound by the Container to the
  // underlying `updateSessionStatusAbsent` mutation, dispatched with the
  // captured `absentDialogClassInstanceId`.
  readonly onAbsentDialogConfirm?: () => void;
}

// NEW FOR PLAN v5: TeacherScheduleStatusContentProps — single-tier (mobile
// only has a desktop counterpart only via the actions cell renderer variant).
// Lifted here so the mobile variant has a stable shared contract. Per
// specs.md §3 N3 + §6.4, the `RequirePermission` wrap was lifted to the
// Container, exposing the `hasSessionActivateClass` boolean as a prop.
export interface TeacherScheduleStatusContentProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  // NEW FOR PLAN v5: lifted permission boolean (Container-owned). Optional
  // pending the prop threading through the schedule cards (see CROSS-FILE
  // DEPENDENCY).
  readonly hasSessionActivateClass?: boolean;
}

// NEW FOR PLAN v5: TeacherScheduleSessionActionsCellProps — single-tier
// (desktop only). Lifted here for a stable shared contract. Per specs.md §3
// N3 + §6.4, the `RequirePermission` wraps were lifted to the Container,
// exposing `has*` booleans as props. Optional pending the prop threading
// through the schedule cards (see CROSS-FILE DEPENDENCY).
export interface TeacherScheduleSessionActionsCellProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly hasSessionActivateClass?: boolean;
  readonly hasSessionUpdateStatusStart?: boolean;
  readonly hasSessionUpdateStatusAbsent?: boolean;
  readonly hasSessionUpdateStatusLeave?: boolean;
}

// NEW FOR PLAN v5: TeacherDailyScheduleSectionProps — single-tier (desktop
// only has no twin). Lifted here per specs.md §4.1 (single-tier interfaces
// belong in the common types folder, not duplicated inline) and the
// renaming-without-`Desktop`-suffix directive from the NS-3 SCOPE prompt.
export interface TeacherDailyScheduleSectionProps {
  readonly title: string;
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel: string;
  readonly onDateChange: (date: string) => void;
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly canActivate: boolean;
  readonly loading?: boolean;
  readonly emptyMessage: string;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

// NEW FOR PLAN v5: TeacherScheduleDataGridProps — single-tier (desktop only).
// Lifted here per specs.md §4.1 so the contract lives alongside its sibling
// schedule-* props.
export interface TeacherScheduleDataGridProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}
