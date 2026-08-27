import { mock } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RecurringScheduleListItem,
  RecurringSchedulesListViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export const recurringLocale: AppLocale = "ar";

export const recurringLabels = readTranslation(Translation.Dashboard.RecurringSchedulesList, recurringLocale);
export const commonLabels = readTranslation(Translation.Common, recurringLocale);
export const adminLabels = readTranslation(Translation.Dashboard.Admin, recurringLocale);

export function makeRecurringScheduleRow(
  overrides: Partial<RecurringScheduleListItem> = {}
): RecurringScheduleListItem {
  return {
    id: "schedule-1",
    studentId: "student-1",
    studentName: "أحمد محمد",
    teacherId: "teacher-1",
    teacherName: "سارة علي",
    durationMinutes: 60,
    defaultStartTime: "17:00",
    timezone: "Asia/Riyadh",
    hourlyRate: "150",
    rateCurrency: CurrencyCode.Sar,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

export function buildRecurringSchedulesViewModel(
  overrides: Partial<RecurringSchedulesListViewModel> = {}
): RecurringSchedulesListViewModel {
  return {
    labelsBySection: {
      shell: {
        pageTitle: recurringLabels.shell.pageTitle,
        subtitle: recurringLabels.shell.subtitle,
        breadcrumbs: [
          { label: recurringLabels.shell.breadcrumbDashboard, href: "/dashboard" },
          { label: recurringLabels.shell.breadcrumbClasses, href: "/classes" },
          { label: recurringLabels.shell.pageTitle },
        ],
        emptyMessage: recurringLabels.shell.emptyMessage,
        loadError: recurringLabels.shell.loadError,
        retryLabel: commonLabels.retry,
      },
      columns: recurringLabels.columns,
      actions: recurringLabels.actions,
      filters: recurringLabels.filters,
    },
    loading: false,
    error: null,
    rows: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    onPageChange: mock(() => {}),
    onSearchChange: mock(() => {}),
    searchValue: "",
    onRetry: mock(() => {}),
    ...overrides,
  };
}
