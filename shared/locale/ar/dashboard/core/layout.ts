import type { DashboardCoreLayoutLabels } from "@/shared/locale/types/dashboard/core";

export const dashboardCoreLayoutAr: DashboardCoreLayoutLabels = {
  // ─── Static strings ────────────────────────────────────────────────
  appTitle: "سراج LMS",
  notifications: "الإشعارات",
  comingSoon: "قريبًا...",
  studentTodayClasses: "حصص اليوم",
  studentSchedule: "جدولي",
  studentCredits: "رصيدي",
  studentHistory: "سجل الحصص",
  studentProfile: "ملفي",
  lessonReports: "تقارير الحصص",
  lessonReportDetail: "تفاصيل تقرير الحصة",
  supervisorHome: "لوحة التحكم",
  pendingReviews: "المراجعات المعلقة",
  teacherDues: "مستحقات المعلمين",
  monthlyReports: "التقارير الشهرية",
  supervisorProfile: "ملفي",
  pageNotFoundTitle: "الصفحة غير موجودة",
  pageNotFoundDescription: "الصفحة التي تبحث عنها غير موجودة أو قد لا تملك صلاحية الوصول إليها.",
  pageNotFoundBackToDashboard: "العودة إلى لوحة التحكم",
  customizeButton: "تخصيص",

  // ─── Interpolated → typed functions ────────────────────────────────
  welcomeUser: name => `مرحبًا ${name}`,
};
