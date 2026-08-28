import { afterEach, describe, expect, mock, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale: AppLocale = "ar";
const teacherDashboardT = readTranslation(Translation.Dashboard.TeacherDashboard, locale);
const adminDashboardT = readTranslation(Translation.Dashboard.Admin, locale);
const meetingConfigT = readTranslation(Translation.Ui.MeetingConfig, locale);
const lessonReportT = readTranslation(Translation.Dashboard.LmsLessonReports, locale);

const USER_NAME = "أحمد";
const DATE_VALUE = "2026-08-28";
// Custom override strings passed as props — intentionally not translations.
const LAST_UPDATED = "last-updated-marker";
const ACTIVATION_ERROR = "activation-error-marker";

await mockNextNavigation("/");

// Child sections own their data concerns; this suite targets the desktop
// error presentation primitive and the page header, not child content.
await mock.module("@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog", () => ({
  ManualClassEntryDialog: () => <div data-testid="manual-class-entry-dialog" />,
}));
await mock.module("@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop", () => ({
  ParentSupportFabDesktop: () => <div data-testid="parent-support-fab" />,
}));
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop",
  () => ({
    ActivationPolicyPanelDesktop: () => <div data-testid="activation-policy-panel" />,
  })
);
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.desktop",
  () => ({
    ManualClassEntryStudentSelectDesktop: () => <div data-testid="manual-entry-student-select" />,
  })
);
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.desktop",
  () => ({
    MissedClassAlertBannerDesktop: () => <div data-testid="missed-alert-banner" />,
  })
);
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/studentProgressFeed.desktop",
  () => ({
    StudentProgressFeedDesktop: () => <div data-testid="student-progress-feed" />,
  })
);
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherDailyScheduleSection.desktop",
  () => ({
    TeacherDailyScheduleSectionDesktop: () => <div data-testid="teacher-daily-schedule-section" />,
  })
);

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";

expect.extend(matchers);

import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildLessonReportLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildLessonReportLabels";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { TeacherDashboardDesktopView } from "@/frontend/desktop/views/dashboard/teachers/dashboard/teacherDashboard.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const labels = buildTeacherDashboardLabels(teacherDashboardT, adminDashboardT, meetingConfigT.join.emptyTeacher);
const lessonReportLabels = buildLessonReportLabels(lessonReportT);
const WELCOME_SUMMARY = labels.activeWelcome.mobileSummary(DATE_VALUE, 0);

const noop = () => {};
const noopManualEntrySubmit: TeacherDashboardViewModel["onManualEntrySubmit"] = async () => {};
const noopLessonReportSubmit: TeacherDashboardViewModel["onLessonReportSubmit"] = async () => {};

function makeViewModel(overrides: Partial<TeacherDashboardViewModel> = {}): TeacherDashboardViewModel {
  return {
    userName: USER_NAME,
    metricItems: [],
    scheduleRows: [],
    progressFeed: [],
    missedAlert: null,
    welcomeDateSummary: DATE_VALUE,
    activeSessionsCount: 0,
    labels,
    lastUpdated: LAST_UPDATED,
    activationError: null,
    canActivate: false,
    canManualEntry: false,
    canPrintSchedule: false,
    loading: false,
    lessonReportDialogOpen: false,
    lessonReportSelectedClassInstanceId: null,
    lessonReportLabels,
    onPrintSchedule: noop,
    onManualEntry: noop,
    onNewSession: noop,
    manualEntryOpen: false,
    manualEntryDefaultActive: false,
    teacherId: "teacher-1",
    subjects: [],
    subjectsLoading: false,
    onManualEntryClose: noop,
    onManualEntrySubmit: noopManualEntrySubmit,
    onDownloadHandbook: noop,
    onContactCoordinator: noop,
    onSupport: noop,
    hasSessionUpdateStatusStart: false,
    hasSessionUpdateStatusAbsent: false,
    hasSessionUpdateStatusLeave: false,
    hasSessionActivateClass: false,
    absentDialogOpen: false,
    onAbsentDialogOpen: noop,
    onAbsentDialogOpenForClass: noop,
    onAbsentDialogClose: noop,
    onAbsentDialogConfirm: noop,
    onLessonReportDialogClose: noop,
    onLessonReportSubmit: noopLessonReportSubmit,
    dateValue: DATE_VALUE,
    onDateChange: noop,
    pageCount: 0,
    welcomeMobileSummary: WELCOME_SUMMARY,
    ...overrides,
  };
}

function renderView(overrides: Partial<TeacherDashboardViewModel> = {}) {
  return renderWithWrapper(<TeacherDashboardDesktopView {...makeViewModel(overrides)} />, { locale });
}

afterEach(() => {
  cleanup();
});

describe("TeacherDashboardDesktopView error presentation", () => {
  test("activation error renders through the shared form error snackbar, not a raw Alert", () => {
    const { container } = renderView({ activationError: ACTIVATION_ERROR });

    const snackbar = container.querySelector(".MuiSnackbar-root");
    if (!snackbar) throw new Error("error snackbar not found");
    expect(snackbar.textContent).toContain(ACTIVATION_ERROR);
    expect(snackbar.querySelector("[data-testid='ErrorOutlinedIcon']")).not.toBeNull();

    // No raw MUI Alert and no mobile gutter wrapper on the desktop tier.
    expect(container.querySelector(".MuiAlert-root")).toBeNull();
    expect(within(container).queryByText(ACTIVATION_ERROR)).toBeVisible();
  });

  test("renders no snackbar when there is no activation error", () => {
    const { container } = renderView();
    expect(container.querySelector(".MuiSnackbar-root")).toBeNull();
  });
});

describe("TeacherDashboardDesktopView header", () => {
  test("renders the welcome title and last-updated subtitle through the shared page header", () => {
    const { container } = renderView();
    const page = within(container);

    const title = page.getByText(labels.activeWelcome.title(USER_NAME));
    expect(title).toBeVisible();
    expect(title.className).toContain("MuiTypography-headlineLg");

    expect(page.getByText(LAST_UPDATED)).toBeVisible();
  });
});
