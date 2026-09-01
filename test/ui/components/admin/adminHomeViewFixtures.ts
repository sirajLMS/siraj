import { mock } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { createDailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/scheduleFixture";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export const adminHomeLocale: AppLocale = "ar";
export const adminHomeLabels = readTranslation(Translation.Dashboard.Admin, adminHomeLocale);

function buildAdminHomeStatusLabels(): Record<ClassOutcome | ClassExecutionState, string> {
  return buildClassInstanceStatusLabels(adminHomeLabels.statusLabels);
}

function buildAdminHomeLabelsBySection(): AdminDashboardLabelsBySection {
  return {
    shell: {
      todayClasses: adminHomeLabels.todayClasses,
      scheduleOverview: adminHomeLabels.scheduleOverview,
      searchPlaceholder: adminHomeLabels.searchPlaceholder,
      noClasses: adminHomeLabels.noClasses,
      details: adminHomeLabels.details,
      loading: adminHomeLabels.loading,
    },
    filters: {
      listOfClassesOn: adminHomeLabels.listOfClassesOn,
      today: adminHomeLabels.today,
      previousDay: adminHomeLabels.previousDay,
      nextDay: adminHomeLabels.nextDay,
      selectTeacher: adminHomeLabels.selectTeacher,
      submit: adminHomeLabels.submit,
    },
    columns: {
      className: adminHomeLabels.className,
      student: adminHomeLabels.student,
      teacher: adminHomeLabels.teacher,
      time: adminHomeLabels.time,
      yourTime: adminHomeLabels.yourTime,
      teacherTime: adminHomeLabels.teacherTime,
      studentTime: adminHomeLabels.studentTime,
      duration: adminHomeLabels.duration,
      status: adminHomeLabels.status,
      actions: adminHomeLabels.actions,
      history: adminHomeLabels.history,
      joinVideo: adminHomeLabels.joinVideo,
    },
    status: buildAdminHomeStatusLabels(),
    metrics: adminHomeLabels.metrics,
  };
}

function createAdminHomeScheduleRow(id: string): DailyScheduleRow {
  return createDailyScheduleRow({
    id,
    yourTime: "10:00 AM",
    teacherTime: "11:00 AM",
    studentTime: "10:00 AM",
    duration: 60,
    scheduledStartAt: "2028-01-01T10:00:00.000Z",
    scheduledEndAt: "2028-01-01T11:00:00.000Z",
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    student: { id: "student-1", name: "Ahmed Hassan", avatarUrl: null },
    teacher: { id: "teacher-1", name: "Dr. Sarah", avatarUrl: null },
  });
}

export function buildAdminDashboardViewModel(
  overrides: Partial<AdminDashboardViewModel> = {}
): AdminDashboardViewModel {
  return {
    labelsBySection: buildAdminHomeLabelsBySection(),
    loading: false,
    lastUpdated: adminHomeLabels.loading,
    metrics: [],
    onMetricClick: mock(() => {}),
    selectedMetricLabel: null,
    searchValue: "",
    dateValue: "2026-08-29",
    selectedTeacher: null,
    rows: [createAdminHomeScheduleRow("row-1")],
    page: 0,
    totalCount: 40,
    onPageChange: mock(() => {}),
    onSearchChange: mock(() => {}),
    onDateChange: mock(() => {}),
    onTeacherChange: mock(() => {}),
    onSubmit: mock(() => {}),
    pageSize: 10,
    pageCount: 4,
    canDashboardSearch: false,
    canScheduleFilterAdvanced: false,
    canScheduleViewTimezones: false,
    ...overrides,
  };
}

export function buildScheduleOverviewViewModel(
  overrides: Partial<ScheduleOverviewViewModel> = {}
): ScheduleOverviewViewModel {
  const labelsBySection = buildAdminHomeLabelsBySection();
  return {
    labelsBySection: {
      shell: { title: adminHomeLabels.scheduleOverview, emptyMessage: adminHomeLabels.noClasses },
      filters: {
        searchPlaceholder: adminHomeLabels.searchPlaceholder,
        dateLabel: adminHomeLabels.listOfClassesOn,
        teacherPlaceholder: adminHomeLabels.selectTeacher,
        todayLabel: adminHomeLabels.today,
        previousDayLabel: adminHomeLabels.previousDay,
        nextDayLabel: adminHomeLabels.nextDay,
      },
      columns: labelsBySection.columns,
      status: labelsBySection.status,
      actions: { detailsLabel: adminHomeLabels.details },
    },
    searchValue: "",
    dateValue: "2026-08-29",
    selectedTeacher: null,
    selectedMetricLabel: null,
    rows: [createAdminHomeScheduleRow("row-1")],
    page: 0,
    pageSize: 10,
    totalCount: 40,
    loading: false,
    onPageChange: mock(() => {}),
    onSearchChange: mock(() => {}),
    onDateChange: mock(() => {}),
    onTeacherChange: mock(() => {}),
    onSubmit: mock(() => {}),
    pageCount: 4,
    showTimezones: false,
    locale: adminHomeLocale,
    canDashboardSearch: false,
    canScheduleFilterAdvanced: false,
    ...overrides,
  };
}
