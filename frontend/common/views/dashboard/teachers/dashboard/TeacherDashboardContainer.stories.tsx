import type { Meta, StoryObj } from "@storybook/react";
import { create } from "zustand";
import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  StudentProgressFeedItem,
  TeacherDashboardState,
  TeacherScheduleRow,
} from "@/frontend/common/stores/teacherDashboardTypes";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getTodayScheduleFilterDate } from "@/frontend/common/utils/scheduleFilterDate";
import { TeacherDashboardView } from "@/frontend/common/views/dashboard/teachers/dashboard/teacherDashboardView";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardMetrics";
import { useAppTranslation } from "@/shared/locale/client";

const INITIAL_ROWS: TeacherScheduleRow[] = [
  {
    id: "teacher-active-live",
    rowNumber: 1,
    classId: "SLMS-4412",
    studentName: "Laila Mansour",
    studentInitials: "LM",
    timeRange: "10:00 AM",
    courseTitle: "Advanced Data Structures",
    locationLabel: "Batch A-2023 \u2022 Room 402",
    durationMinutes: 60,
    status: "activated",
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    videoEnabled: true,
    activateEnabled: false,
    isLive: true,
    isCurrent: true,
  },
  {
    id: "teacher-session-1",
    rowNumber: 2,
    classId: "SLMS-9821",
    studentName: "Zaid Salman",
    studentInitials: "ZS",
    timeRange: "08:00 AM - 09:00 AM",
    durationMinutes: 60,
    status: "missed",
    executionState: ClassExecutionState.NotActivated,
    outcome: ClassOutcome.Absent,
    videoEnabled: true,
    activateEnabled: false,
  },
  {
    id: "teacher-active-upcoming",
    rowNumber: 3,
    classId: "SLMS-3390",
    studentName: "Omar Abbas",
    studentInitials: "OA",
    timeRange: "11:30 AM",
    courseTitle: "Discrete Mathematics",
    locationLabel: "Batch B-2023 \u2022 Room 105",
    durationMinutes: 90,
    status: "pending",
    executionState: ClassExecutionState.NotActivated,
    outcome: ClassOutcome.Pending,
    videoEnabled: true,
    activateEnabled: true,
  },
  {
    id: "teacher-session-4",
    rowNumber: 4,
    classId: "SLMS-1102",
    studentName: "Fatima Hadi",
    studentInitials: "FH",
    timeRange: "02:30 PM - 03:30 PM",
    durationMinutes: 60,
    status: "completed",
    executionState: ClassExecutionState.Completed,
    outcome: ClassOutcome.Taken,
    videoEnabled: false,
    activateEnabled: false,
  },
];

const PROGRESS_FEED: StudentProgressFeedItem[] = [
  {
    id: "feed-1",
    studentId: "student-1",
    studentName: "Zaid Salman",
    studentInitials: "ZS",
    summary: "Missed class · 8:00 AM · 60 min",
    scheduledTime: "8:00 AM",
    durationMinutes: 60,
    eventKind: "auto_missed",
    occurredAt: new Date(Date.now() - 2 * 60_000),
    timeAgo: "2m ago",
    infoTooltip: "Class automatically marked as missed after the activation grace period.",
  },
  {
    id: "feed-2",
    studentId: "student-2",
    studentName: "Fatima Hadi",
    studentInitials: "FH",
    summary: "Session completed · 2:30 PM · 60 min",
    scheduledTime: "2:30 PM",
    durationMinutes: 60,
    eventKind: "completed",
    occurredAt: new Date(Date.now() - 15 * 60_000),
    timeAgo: "15m ago",
    infoTooltip: null,
  },
  {
    id: "feed-3",
    studentId: "student-3",
    studentName: "Omar Abbas",
    studentInitials: "OA",
    summary: "Session activated · 11:30 AM · 90 min",
    scheduledTime: "11:30 AM",
    durationMinutes: 90,
    eventKind: "activated",
    occurredAt: new Date(Date.now() - 60 * 60_000),
    timeAgo: "1h ago",
    infoTooltip: null,
  },
];

const MOCK_RAW_METRICS = {
  total: 8,
  running: 1,
  absent: 1,
  taken: 1,
  regular: null,
  trial: null,
  advance: null,
  rescheduled: null,
  suspended: null,
  pending: null,
  activated: null,
  leave: null,
};

function applyConnectingState(rows: readonly TeacherScheduleRow[], id: string): TeacherScheduleRow[] {
  return rows.map(row => {
    if (row.id === id && row.status === "pending") {
      return { ...row, status: "connecting", activateEnabled: false };
    }
    return row;
  });
}

function applyActivatedState(rows: readonly TeacherScheduleRow[], id: string): TeacherScheduleRow[] {
  return rows.map(row => {
    if (row.id === id && row.status === "connecting") {
      return {
        ...row,
        status: "activated",
        activateEnabled: false,
        videoEnabled: true,
        isLive: true,
        isCurrent: true,
      };
    }
    return row;
  });
}

interface TeacherDashboardStoryState extends TeacherDashboardState {
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly welcomeDateSummary: string;
  readonly activateSession: (id: string) => void;
}

const useTeacherDashboardStore = create<TeacherDashboardStoryState>(set => ({
  metrics: {
    totalClasses: 8,
    activeSessions: 1,
    missedSlots: 1,
    completed: 1,
    studentsToday: 4,
  },
  scheduleRows: INITIAL_ROWS,
  missedAlert: {
    classId: "SLMS-9821",
    scheduledTime: "08:00 AM",
  },
  scheduleDateLabel: "Monday, October 23, 2023",
  totalScheduledToday: 8,
  welcomeDateSummary: "Monday, October 23, 2023",
  progressFeed: PROGRESS_FEED,
  activateSession: (id: string) => {
    set(state => ({
      scheduleRows: applyConnectingState(state.scheduleRows, id),
    }));

    setTimeout(() => {
      set(state => ({
        scheduleRows: applyActivatedState(state.scheduleRows, id),
      }));
    }, 1500);
  },
}));

export function MockTeacherDashboardContainer() {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const dashboardT = useAppTranslation().dashboardTranslations.admin;
  const tJoin = useAppTranslation().uiTranslations.meetingConfigJoin;
  const lessonReportI18n = useAppTranslation().dashboardTranslations.lmsLessonReports;
  const userName = useUserStore(state => state.name);
  const store = useTeacherDashboardStore();
  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin.emptyTeacher);
  const metricItems = buildTeacherActiveMetricItems(MOCK_RAW_METRICS, labels.activeMetrics);
  const lessonReportLabels = {
    attendanceEvaluation: lessonReportI18n.attendanceEvaluation,
    durationMinutes: lessonReportI18n.durationMinutes,
    completionPercentage: lessonReportI18n.completionPercentage,
    teacherNotes: lessonReportI18n.teacherNotes,
    present: lessonReportI18n.present,
    absent: lessonReportI18n.absent,
    late: lessonReportI18n.late,
    submit: lessonReportI18n.submit,
    dialogTitle: lessonReportI18n.dialogTitle,
    cancel: lessonReportI18n.cancel,
    submitting: lessonReportI18n.submitting,
    submitFailed: lessonReportI18n.submitFailed,
    attendanceRequired: lessonReportI18n.attendanceRequired,
    durationMin: lessonReportI18n.durationMin,
    durationMax: lessonReportI18n.durationMax,
    completionMin: lessonReportI18n.completionMin,
    completionMax: lessonReportI18n.completionMax,
  };

  return (
    <TeacherDashboardView
      userName={userName}
      metricItems={metricItems}
      scheduleRows={store.scheduleRows}
      progressFeed={store.progressFeed}
      missedAlert={store.missedAlert}
      welcomeDateSummary={store.welcomeDateSummary}
      activeSessionsCount={MOCK_RAW_METRICS.running ?? 0}
      labels={labels}
      lastUpdated="Updated just now"
      activationError={null}
      canActivate={true}
      canManualEntry={true}
      canPrintSchedule={true}
      onPrintSchedule={() => globalThis.print()}
      onManualEntry={() => alert("Manual entry clicked")}
      onNewSession={() => alert("New session clicked")}
      onActivate={id => store.activateSession(id)}
      onStartSession={id => alert(`Start session ${id}`)}
      onMarkAbsent={id => alert(`Mark absent ${id}`)}
      onRequestLeave={id => alert(`Request leave ${id}`)}
      onViewAll={() => alert("View all clicked")}
      onDownloadHandbook={() => alert("Download handbook clicked")}
      onContactCoordinator={() => alert("Contact coordinator clicked")}
      onSupport={() => alert("Live support clicked")}
      dateValue={getTodayScheduleFilterDate()}
      onDateChange={() => {}}
      lessonReportDialogOpen={false}
      lessonReportSelectedClassInstanceId={null}
      lessonReportLabels={lessonReportLabels}
      onLessonReportDialogClose={() => {}}
      onLessonReportSubmit={async () => {}}
    />
  );
}

const meta: Meta<typeof MockTeacherDashboardContainer> = {
  title: "Views/dashboard/teachers/dashboard/TeacherDashboardContainer",
  component: MockTeacherDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockTeacherDashboardContainer>;

export const Default: Story = {};
