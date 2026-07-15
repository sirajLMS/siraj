import type { useAppTranslation } from "@/shared/locale/client";

type TranslationObject = ReturnType<typeof useAppTranslation<"dashboard.admin">>;

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
  const admin = t.admin;
  return {
    todayClassesTitle: admin.todayClasses,
    scheduleTitle: admin.scheduleOverview,
    todayLabel: admin.today,
    previousDayLabel: admin.previousDay,
    nextDayLabel: admin.nextDay,
    searchPlaceholder: admin.searchPlaceholder,
    dateLabel: admin.listOfClassesOn,
    teacherPlaceholder: admin.selectTeacher,
    submitLabel: admin.submit,
    detailsLabel: admin.details,
    emptyMessage: admin.noClasses,
    loadingLabel: admin.loading,
  };
}
