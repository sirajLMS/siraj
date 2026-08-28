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

// Child sections own their data concerns; this suite targets the page
// header primitive, the date-summary chip, and MobileContentInset gutter
// ownership around the alert wrappers.
await mock.module("@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog", () => ({
  ManualClassEntryDialog: () => <div data-testid="manual-class-entry-dialog" />,
}));
await mock.module("@/frontend/mobile/components/ui/filter", () => ({
  DateNavigatorMobile: () => <div data-testid="date-navigator" />,
}));
await mock.module(
  "@/frontend/mobile/views/dashboard/teachers/dashboard/components/activationPolicyPanel.mobile",
  () => ({
    ActivationPolicyPanelMobile: () => <div data-testid="activation-policy-panel" />,
  })
);
await mock.module(
  "@/frontend/mobile/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.mobile",
  () => ({
    ManualClassEntryStudentSelectMobile: () => <div data-testid="manual-entry-student-select" />,
  })
);
await mock.module(
  "@/frontend/mobile/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.mobile",
  () => ({
    MissedClassAlertBannerMobile: () => <div data-testid="missed-alert-banner" />,
  })
);
await mock.module("@/frontend/mobile/views/dashboard/teachers/dashboard/components/studentProgressFeed.mobile", () => ({
  StudentProgressFeedMobile: () => <div data-testid="student-progress-feed" />,
}));
await mock.module("@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleCard.mobile", () => ({
  TeacherScheduleCardMobile: () => <div data-testid="teacher-schedule-card" />,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";

expect.extend(matchers);

import type { MissedClassAlert } from "@/frontend/common/types/shared.types";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildLessonReportLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildLessonReportLabels";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { TeacherDashboardMobileView } from "@/frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile";
import { getEmotionStylesForElement } from "@/test/ui/components/helpers/emotionStyles";
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
  return renderWithWrapper(<TeacherDashboardMobileView {...makeViewModel(overrides)} />, { locale });
}

function findInsetWrapper(element: Element | null): Element {
  if (!element?.parentElement) throw new Error("content wrapper not found");
  return element.parentElement;
}

function expectUnconditionedGutter(element: Element): void {
  const rules = getEmotionStylesForElement(element);
  expect(rules).toContain("padding-inline: 16px");
  expect(rules).not.toContain("@media");
}

afterEach(() => {
  cleanup();
});

describe("TeacherDashboardMobileView header", () => {
  test("renders the welcome title and last-updated subtitle through the MobilePageHeader primitive", () => {
    const { container } = renderView();
    const page = within(container);

    const title = page.getByText(labels.activeWelcome.title(USER_NAME));
    expect(title).toBeVisible();
    expect(title.className).toContain("MuiTypography-headlineMd");

    const subtitle = page.getByText(LAST_UPDATED);
    expect(subtitle).toBeVisible();
    // The shared header indents the subtitle (margin-inline-start); the old
    // hand-built welcome stack had no such rule.
    expect(getEmotionStylesForElement(subtitle)).toContain("margin-inline-start: 16px");
  });

  test("renders the date summary as a chip with the calendar icon", () => {
    const { container } = renderView();
    const summaryText = within(container).getByText(WELCOME_SUMMARY);

    const chip = summaryText.closest(".MuiChip-root");
    if (!chip) throw new Error("date summary chip not found");
    expect(chip.querySelector("[data-testid='CalendarMonthOutlinedIcon']")).not.toBeNull();
  });
});

describe("TeacherDashboardMobileView alert gutters", () => {
  test("missed-class alert banner sits inside the shared content inset (no manual media-scoped gutter)", () => {
    const missedAlert: MissedClassAlert = { classId: "class-1", scheduledTime: "10:00" };
    const { container } = renderView({ missedAlert });

    const banner = within(container).getByTestId("missed-alert-banner");
    expectUnconditionedGutter(findInsetWrapper(banner));
  });

  test("activation error alert keeps error severity and sits inside the shared content inset", () => {
    const { container } = renderView({ activationError: ACTIVATION_ERROR });
    const page = within(container);

    const alert = container.querySelector(".MuiAlert-root");
    if (!alert) throw new Error("activation error alert not found");
    expect(alert.className).toContain("MuiAlert-colorError");
    expect(page.getByText(ACTIVATION_ERROR)).toBeVisible();
    expectUnconditionedGutter(findInsetWrapper(alert));
  });
});
