/**
 * Shared fixtures for class-details component tests.
 *
 * Used by:
 * - test/ui/components/classDetailsContentSlots.test.tsx
 * - test/ui/components/classes/classDetailsActionWiring.test.tsx
 */

import type { ClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type {
  ClassDetailsContentProps,
  ClassDetailsMetricGridSlotProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { ClassDetailsLabels, SessionLabels } from "@/shared/locale";

const noop = () => {};
const noopAsync = () => Promise.resolve();

export function makeClassDetailsInstance(): ClassInstance {
  return {
    id: "ci-1",
    courseName: "Math",
    classType: null,
    instanceId: "inst-1",
    scheduledDate: "2026-08-20",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: null,
    remarks: null,
    hasTimezoneMismatch: false,
    studentTimezone: null,
    teacherTimezone: null,
    recurringScheduleId: null,
    payrollCredited: false,
    isRescheduled: false,
    isFrozen: false,
    executionState: null,
    outcome: null,
    avatarUrl: null,
    subjectId: "sub-1",
    subjectName: "Mathematics",
    subjectAvatarUrl: null,
    rateAmount: null,
    rateCurrency: null,
    isRateOverridden: false,
    rateSource: null,
    effectiveMeeting: null,
    student: { id: "student-1", name: "Student One", grade: null, level: null, avatarUrl: null },
    teacher: { id: "teacher-1", name: "Teacher One", title: null, avatarUrl: null },
    performance: {
      id: "perf-1",
      engagementScore: 92,
      assessmentProgress: 60,
      assessmentTotal: 5,
      focusLevel: "High",
      sessionHealth: "Stable",
      heatmapData: null,
      latencyMs: null,
      authorizationLabel: null,
      attendanceRate: 85,
      avgGrade: "A",
      lastClassDaysAgo: 3,
    },
  };
}

export function ClassDetailsHeaderStub() {
  return <div data-testid="header-stub" />;
}

/** Silent slot for the tier-injected metric grids when grid output is not under test. */
export function ClassDetailsStubMetricGrid(_props: Readonly<ClassDetailsMetricGridSlotProps>) {
  return <div data-testid="stub-metric-grid" />;
}

export function buildClassDetailsContentProps(
  t: ClassDetailsLabels,
  session: SessionLabels,
  overrides: Partial<ClassDetailsContentProps>
): ClassDetailsContentProps {
  return {
    instance: makeClassDetailsInstance(),
    canOverride: false,
    isParentView: false,
    isStudentView: false,
    canViewSessionDetails: false,
    isWarningDismissed: true,
    onDismissWarning: noop,
    handlers: {
      handleForceActivate: noopAsync,
      handleStop: noopAsync,
      handleActivate: noopAsync,
      handleDeleteConfirm: noopAsync,
      handleReschedule: noop,
      handleInfoEdit: noop,
      handleOverrideRate: noopAsync,
    },
    sessionActionProps: {
      onStart: noopAsync,
      onAbsent: noopAsync,
      onLeave: noopAsync,
      onReset: noopAsync,
      isStarting: false,
      isMarkingAbsent: false,
      isProcessingLeave: false,
      isResetting: false,
      error: null,
    },
    feedbackState: null,
    deleteDialogOpen: false,
    onOpenDeleteDialog: noop,
    onCloseDeleteDialog: noop,
    onConfirmDelete: noopAsync,
    onGenerateLog: noop,
    overrideRateDialog: {
      open: false,
      amount: "",
      currency: null,
      onOpen: noop,
      onClose: noop,
      onAmountChange: noop,
      onCurrencyChange: noop,
      onSubmit: noopAsync,
    },
    t,
    headerLabels: {
      pageSubtitleAdmin: t.pageSubtitleAdmin,
      pageSubtitleTeacher: t.pageSubtitleTeacher,
      pageSubtitleStudent: t.pageSubtitleStudent,
      classTypes: session.classTypes,
      breadcrumbs: { dashboard: t.breadcrumbs.dashboard, classes: t.breadcrumbs.classes },
    },
    formattedScheduledDate: "2026-08-20",
    formattedStartTime: "10:00",
    formattedEndTime: "11:00",
    ...overrides,
  };
}
