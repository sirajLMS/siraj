import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import type { MetricItem } from "@/frontend/common/types/shared.types";
import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type { ClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type {
  ClassDetailsContentProps,
  ClassDetailsMetricGridSlotProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);
const session = readTranslation(Translation.Session, locale);

const noop = () => {};
const noopAsync = () => Promise.resolve();

function makeInstance(): ClassInstance {
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

function makeProps(overrides: Partial<ClassDetailsContentProps>): ClassDetailsContentProps {
  return {
    instance: makeInstance(),
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
    onCloseDeleteDialog: noop,
    onConfirmDelete: noopAsync,
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

const HeaderStub = () => <div data-testid="header-stub" />;

function makeSpyGrid(captured: MetricItem[][], testId: string) {
  return function SpyMetricGrid({ metrics }: ClassDetailsMetricGridSlotProps) {
    captured.push([...metrics]);
    return <div data-testid={testId} />;
  };
}

function renderContent(overrides: Partial<ClassDetailsContentProps>) {
  const teacherCaptured: MetricItem[][] = [];
  const liveCaptured: MetricItem[][] = [];
  const result = renderWithWrapper(
    <ClassDetailsContentShared
      props={makeProps(overrides)}
      slots={{
        Header: HeaderStub,
        TeacherPerformanceMetricGrid: makeSpyGrid(teacherCaptured, "teacher-metric-grid"),
        LivePerformanceMetricGrid: makeSpyGrid(liveCaptured, "live-metric-grid"),
      }}
    />,
    { locale }
  );
  return { teacherCaptured, liveCaptured, result };
}

describe("ClassDetailsContentShared metric grid slots", () => {
  test("admin view renders the injected live performance grid with MetricItem[]", () => {
    const { teacherCaptured, liveCaptured } = renderContent({ canOverride: true });

    expect(liveCaptured.length).toBeGreaterThan(0);
    expect(liveCaptured[0]?.map(m => m.key)).toEqual(["engagement", "assessment", "focus", "health"]);
    expect(liveCaptured[0]?.map(m => m.count)).toEqual(["92", "60", "High", "Stable"]);
    expect(teacherCaptured).toHaveLength(0);
  });

  test("teacher view renders the injected performance overview grid with MetricItem[]", () => {
    const { teacherCaptured, liveCaptured } = renderContent({ canViewSessionDetails: true });

    expect(teacherCaptured.length).toBeGreaterThan(0);
    expect(teacherCaptured[0]?.map(m => m.key)).toEqual(["attendanceRate", "avgGrade", "lastClass"]);
    expect(teacherCaptured[0]?.map(m => m.count)).toEqual(["85%", "A", `3 ${t.performance.days}`]);
    expect(liveCaptured).toHaveLength(0);
  });

  test("student view renders no performance metric grids", () => {
    const { teacherCaptured, liveCaptured, result } = renderContent({ isStudentView: true });

    expect(teacherCaptured).toHaveLength(0);
    expect(liveCaptured).toHaveLength(0);
    expect(result.queryByTestId("teacher-metric-grid")).toBeNull();
    expect(result.queryByTestId("live-metric-grid")).toBeNull();
    expect(result.queryByText("85%")).toBeNull();
    expect(result.queryByText("92")).toBeNull();
  });
});
