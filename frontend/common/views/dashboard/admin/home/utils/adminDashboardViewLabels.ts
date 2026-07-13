import type { useTranslations } from "next-intl";

type TranslationFunction = ReturnType<typeof useTranslations<"dashboard">>;

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

export function buildAdminDashboardViewLabels(t: TranslationFunction): AdminDashboardViewLabels {
  return {
    todayClassesTitle: t("admin.todayClasses"),
    scheduleTitle: t("admin.scheduleOverview"),
    todayLabel: t("admin.today"),
    previousDayLabel: t("admin.previousDay"),
    nextDayLabel: t("admin.nextDay"),
    searchPlaceholder: t("admin.searchPlaceholder"),
    dateLabel: t("admin.listOfClassesOn"),
    teacherPlaceholder: t("admin.selectTeacher"),
    submitLabel: t("admin.submit"),
    detailsLabel: t("admin.details"),
    emptyMessage: t("admin.noClasses"),
    loadingLabel: t("admin.loading"),
  };
}
