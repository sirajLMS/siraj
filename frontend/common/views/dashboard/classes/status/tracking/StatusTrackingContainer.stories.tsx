import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import type { Meta, StoryObj } from "@storybook/react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import {
  ClassExecutionState,
  ClassOutcome,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import { StatusTrackingView } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusTrackingView";
import type { RawMetric, StatusTrackingRow } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { useAppTranslation } from "@/shared/locale/client";

interface StoryStatusTrackingState {
  readonly metrics: readonly RawMetric[];
  readonly rows: readonly StatusTrackingRow[];
  readonly totalSessions: number;
  activateSession: (id: string) => void;
  verifySession: (id: string) => void;
}

const STORY_METRICS: RawMetric[] = [
  {
    key: "regular",
    count: 1248,
    labelKey: "dashboard.statusTracking.metrics.regular",
    icon: CheckCircleOutlineOutlined,
  },
  { key: "pending", count: 84, labelKey: "dashboard.statusTracking.metrics.pending", icon: PendingActionsOutlined },
  {
    key: "suspended",
    count: 32,
    labelKey: "dashboard.statusTracking.metrics.suspended",
    icon: BlockOutlined,
    variant: "error",
  },
  { key: "on_leave", count: 15, labelKey: "dashboard.statusTracking.metrics.onLeave", icon: EventAvailableOutlined },
];

const STORY_ROWS: StatusTrackingRow[] = [
  {
    __typename: "StatusTrackingScheduleRow",
    id: "s1",
    studentId: "st1",
    studentName: "Zaid Al-Harbi",
    studentInitials: "ZA",
    studentStatus: StudentStatus.Regular,
    teacherId: "t1",
    teacherName: "Sheikh Omar Farouk",
    scheduledStartAt: "2026-06-22T10:30:00Z",
    scheduledEndAt: "2026-06-22T11:30:00Z",
    durationMinutes: 60,
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    avatarUrl: null,
    courseName: null,
    studentAvatarUrl: null,
    teacherAvatarUrl: null,
    isFrozen: false,
    meetingJoinUrl: null,
    effectiveMeeting: null,
  },
  {
    __typename: "StatusTrackingScheduleRow",
    id: "s2",
    studentId: "st2",
    studentName: "Maryam Khan",
    studentInitials: "MK",
    studentStatus: StudentStatus.Suspended,
    teacherId: "t2",
    teacherName: "Ustaza Fatima Ali",
    scheduledStartAt: "2026-06-22T11:00:00Z",
    scheduledEndAt: "2026-06-22T12:00:00Z",
    durationMinutes: 60,
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    avatarUrl: null,
    courseName: null,
    studentAvatarUrl: null,
    teacherAvatarUrl: null,
    isFrozen: true,
    meetingJoinUrl: null,
    effectiveMeeting: null,
  },
  {
    __typename: "StatusTrackingScheduleRow",
    id: "s3",
    studentId: "st3",
    studentName: "Sami Yusuf",
    studentInitials: "SY",
    studentStatus: StudentStatus.OnLeave,
    teacherId: "t3",
    teacherName: "Hafiz Abdul Rahman",
    scheduledStartAt: "2026-06-22T11:45:00Z",
    scheduledEndAt: "2026-06-22T13:00:00Z",
    durationMinutes: 75,
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    avatarUrl: null,
    courseName: null,
    studentAvatarUrl: null,
    teacherAvatarUrl: null,
    isFrozen: false,
    meetingJoinUrl: null,
    effectiveMeeting: null,
  },
  {
    __typename: "StatusTrackingScheduleRow",
    id: "s4",
    studentId: "st4",
    studentName: "Omar Saeed",
    studentInitials: "OS",
    studentStatus: StudentStatus.Regular,
    teacherId: "t4",
    teacherName: "Dr. Ibrahim Khalil",
    scheduledStartAt: "2026-06-22T14:00:00Z",
    scheduledEndAt: "2026-06-22T15:00:00Z",
    durationMinutes: 60,
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    avatarUrl: null,
    courseName: null,
    studentAvatarUrl: null,
    teacherAvatarUrl: null,
    isFrozen: true,
    meetingJoinUrl: null,
    effectiveMeeting: null,
  },
  {
    __typename: "StatusTrackingScheduleRow",
    id: "s5",
    studentId: "st5",
    studentName: "Noor Ahmed",
    studentInitials: "NA",
    studentStatus: StudentStatus.Regular,
    teacherId: "t5",
    teacherName: "Ustaza Sara Mansour",
    scheduledStartAt: "2026-06-22T15:30:00Z",
    scheduledEndAt: "2026-06-22T16:30:00Z",
    durationMinutes: 60,
    executionState: ClassExecutionState.NotActivated,
    outcome: ClassOutcome.Pending,
    avatarUrl: null,
    courseName: null,
    studentAvatarUrl: null,
    teacherAvatarUrl: null,
    isFrozen: false,
    meetingJoinUrl: null,
    effectiveMeeting: null,
  },
];

const useStoryStatusTrackingStore = create<StoryStatusTrackingState>(set => ({
  metrics: STORY_METRICS,
  rows: STORY_ROWS,
  totalSessions: 142,

  activateSession: (id: string) => {
    set(state => ({
      rows: state.rows.map(row =>
        row.id === id
          ? {
              ...row,
              studentStatus: StudentStatus.Regular,
              isFrozen: false,
              executionState: ClassExecutionState.Activated,
            }
          : row
      ),
    }));
  },

  verifySession: (id: string) => {
    set(state => ({
      rows: state.rows.map(row =>
        row.id === id
          ? {
              ...row,
              studentStatus: StudentStatus.Regular,
              isFrozen: false,
              executionState: ClassExecutionState.Activated,
            }
          : row
      ),
    }));
  },
}));

function StoryStatusTrackingContainer() {
  const t = useAppTranslation("dashboard.core.statusTracking");
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);

  const rawMetrics = useStoryStatusTrackingStore(state => state.metrics);
  const rows = useStoryStatusTrackingStore(state => state.rows);
  const totalSessions = useStoryStatusTrackingStore(state => state.totalSessions);
  const activateSession = useStoryStatusTrackingStore(state => state.activateSession);
  const verifySession = useStoryStatusTrackingStore(state => state.verifySession);

  const suspendedCount = Number(rawMetrics.find(m => m.key === "suspended")?.count ?? 0);

  const subLabelMap: Record<string, string> = {
    regular: t.subLabels.regular,
    pending: t.subLabels.pending,
    suspended: t.subLabels.suspended,
    on_leave: t.subLabels.onLeave,
  };

  const metrics: readonly RawMetric[] = rawMetrics.map(m => ({
    ...m,
    subLabel: subLabelMap[m.key],
  }));

  const labels = {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    filters: t.filters,
    newReport: t.newReport,
    todaysClassSchedule: t.todaysClassSchedule,
    totalSessions: t.totalSessions,
    studentClass: t.table.studentClass,
    teacher: t.table.teacher,
    schedule: t.table.schedule,
    status: t.table.status,
    actions: t.table.actions,
    showingOf: t.showingOf,
    previous: t.previous,
    next: t.next,
    joinSession: t.actions.joinSession,
    activate: t.actions.activate,
    reschedule: t.actions.reschedule,
    verifyDocuments: t.actions.verifyDocuments,
    sessionLocked: t.actions.sessionLocked,
    sessionEnded: t.actions.sessionEnded,
    administrativeHold: t.administrativeHold,
    holdDescription: t.holdDescription,
    seeAll: t.seeAll,
    todaysSchedule: t.todaysSchedule,
    regular: t.status.regular,
    suspendedPending: t.status.suspendedPending,
    onLeave: t.status.onLeave,
    pendingVerification: t.status.pendingVerification,
    regularSubLabel: t.subLabels.regular,
    pendingSubLabel: t.subLabels.pending,
    suspendedSubLabel: t.subLabels.suspended,
    onLeaveSubLabel: t.subLabels.onLeave,
    suspensionAnalytics: t.analytics.title,
    analyticsNote: t.analytics.note,
    urgentTask: t.analytics.urgentTask,
    accountsLocked: t.analytics.accountsLocked,
    auditDescription: t.analytics.auditDescription,
    openAuditLogs: t.analytics.openAuditLogs,
    noEntries: t.noEntries,
    errorNoStudentId: t.errors.noStudentId,
    errorAuditLogsComingSoon: t.errors.auditLogsComingSoon,
    errorFailedToLoad: t.errors.failedToLoad,
    days: [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun] as const,
  };

  const handleNewReport = () => {
    router.push("/classes/new");
  };

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName ?? "",
        studentName: row.studentName ?? "",
        teacherTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    router.push("/reschedule");
  };

  const handleOpenAuditLogs = () => {};

  const handleSeeAll = () => {};

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={totalSessions}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={activateSession}
      onReschedule={handleReschedule}
      onVerify={verifySession}
      onNewReport={handleNewReport}
      onOpenAuditLogs={handleOpenAuditLogs}
      onSeeAll={handleSeeAll}
    />
  );
}

const meta: Meta<typeof StoryStatusTrackingContainer> = {
  title: "Views/dashboard/classes/status/tracking/StatusTrackingContainer",
  component: StoryStatusTrackingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
