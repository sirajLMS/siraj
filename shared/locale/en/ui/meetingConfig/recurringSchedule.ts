export const uiMeetingConfigRecurringScheduleEn = {
  pageTitle: "Recurring Series Meeting",
  scheduleSummary: (student: string, teacher: string, duration: number | string, timezone: string) =>
    `${student} with ${teacher} · ${duration} min · ${timezone}`,
  invalidId: "Invalid schedule ID",
  breadcrumbDashboard: "Dashboard",
  breadcrumbClasses: "Classes",
  goToClass: "Go to class",
  rateSectionTitle: "Recurring Class Rate",
  hourlyRateLabel: "Hourly Rate",
  currencyLabel: "Currency",
  rateSaveLabel: "Save Rate",
  rateClearLabel: "Clear Rate",
  rateSuccessMessage: "Rate updated successfully",
  rateErrorMessage: "Failed to update rate",
};
