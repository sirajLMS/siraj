export const recurringSchedule = {
  pageTitle: "Recurring Series Meeting",
  scheduleSummary: (student: string, teacher: string, duration: number | string, timezone: string) =>
    `${student} with ${teacher} · ${duration} min · ${timezone}`,
  invalidId: "Invalid schedule ID",
  breadcrumbDashboard: "Dashboard",
  breadcrumbClasses: "Classes",
  goToClass: "Go to class",
};
