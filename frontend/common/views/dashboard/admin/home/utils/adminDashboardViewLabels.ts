import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

type TranslationObject = AdminDashboardLabels;

export interface AdminDashboardViewLabels {
  readonly todayClassesTitle: string;
  readonly scheduleTitle: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly searchPlaceholder: string;
  readonly dateLabel: string;
  readonly teacherPlaceholder: string;
  readonly submitLabel: string;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly loadingLabel: string;
}

export function buildAdminDashboardViewLabels(t: TranslationObject): AdminDashboardViewLabels {
  return {
    todayClassesTitle: t.todayClasses,
    scheduleTitle: t.scheduleOverview,
    todayLabel: t.today,
    previousDayLabel: t.previousDay,
    nextDayLabel: t.nextDay,
    searchPlaceholder: t.searchPlaceholder,
    dateLabel: t.listOfClassesOn,
    teacherPlaceholder: t.selectTeacher,
    submitLabel: t.submit,
    detailsLabel: t.details,
    emptyMessage: t.noClasses,
    loadingLabel: t.loading,
  };
}
