import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

export const dashboardAdminAr: AdminDashboardLabels = {
  // ─── Static strings ────────────────────────────────────────────────
  pageTitle: "لوحة التحكم",
  roleLabel: "لوحة تحكم المدير",
  todayClasses: "حصص اليوم",
  updatedJustNow: "تم التحديث الآن",
  scheduleOverview: "نظرة عامة على الجدول",
  searchPlaceholder: "البحث بالطالب أو اسم الحصة...",
  listOfClassesOn: "قائمة الحصص في",
  teacher: "المعلم",
  selectTeacher: "اختر المعلم",
  submit: "إرسال",
  classId: "رقم الحصة",
  className: "الحصة",
  student: "الطالب",
  time: "الوقت",
  yourTime: "وقتك",
  teacherTime: "وقت المعلم",
  studentTime: "وقت الطالب",
  duration: "المدة",
  status: "الحالة",
  actions: "الإجراءات",
  history: "السجل",
  details: "التفاصيل",
  joinVideo: "الانضمام للحصة",
  noClasses: "لا توجد حصص",
  loading: "جاري التحميل...",
  today: "اليوم",
  previousDay: "اليوم السابق",
  nextDay: "اليوم التالي",
  previousPage: "الصفحة السابقة",
  nextPage: "الصفحة التالية",
  goToPage: "انتقل إلى صفحة",
  dashboardOverview: "نظرة عامة على لوحة التحكم",
  viewAll: "عرض الكل",
  loadingTimeoutTitle: "انتهت مهلة الطلب",
  loadingTimeoutDesc: "استغرق الخادم وقتًا طويلاً للاستجابة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
  unauthenticatedTitle: "المستخدم غير مصرح له",
  unauthenticatedDesc: "يرجى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم.",
  loadingFailedTitle: "فشل تحميل لوحة التحكم",
  loadingFailedDesc: "حدث خطأ غير متوقع أثناء تحميل المخطط.",
  retryBtn: "إعادة محاولة التحميل",
  loginBtn: "الذهاب لتسجيل الدخول",

  timezoneOffsetDetail: {
    time: "الوقت",
    timezone: "المنطقة الزمنية",
    utcOffset: "إزاحة التوقيت العالمي",
    yourOffset: "إزاحتك",
  },

  // ─── Interpolated → typed functions ────────────────────────────────

  // "{from}-{to} من {total}"
  paginationRange: (from, to, total) => `${from}-${to} من ${total}`,

  // "صفحة {current} من {total}"
  pageOf: (current, total) => `صفحة ${current} من ${total}`,

  // "عرض {shown} من {total} حصة"
  showingOf: (shown, total) => `عرض ${shown} من ${total} حصة`,

  /**
   * Arabic plural rules (native TypeScript — no ICU needed):
   *   0 → لا دقائق
   *   1 → دقيقة واحدة
   *   2 → دقيقتان
   *   3-10 → X دقائق
   *   11+ → X دقيقة
   */
  updatedMinutesAgo: minutes => {
    if (minutes === 0) return "تم التحديث للتو";
    if (minutes === 1) return "تم التحديث منذ دقيقة واحدة";
    if (minutes === 2) return "تم التحديث منذ دقيقتان";
    if (minutes >= 3 && minutes <= 10) return `تم التحديث منذ ${minutes} دقائق`;
    return `تم التحديث منذ ${minutes} دقيقة`;
  },

  // ─── Nested objects ─────────────────────────────────────────────────
  metrics: {
    total: "الإجمالي",
    regular: "عادي",
    trial: "تجريبي",
    advance: "مسبق",
    rescheduled: "مُعاد جدولته",
    suspended: "معلّق",
    taken: "مأخوذ",
    pending: "قيد الانتظار",
    activated: "مفعّل",
    running: "جارٍ",
    absent: "غائب",
    leave: "إجازة",
  },
  statusLabels: {
    PENDING: "معلّق",
    TAKEN: "مأخوذ",
    ABSENT: "غائب",
    LEAVE: "إجازة",
    NOT_ACTIVATED: "غير مفعّل",
    ACTIVATED: "مفعّل",
    RUNNING: "جارٍ",
    COMPLETED: "مكتمل",
    ON_DEMAND_CONFLICT_HELD: "معلقة بسبب تعارض",
    ON_DEMAND_NO_CREDITS_ABSENT: "بدون رصيد (غائب)",
    ON_DEMAND_NO_CREDITS_CANCELLED: "بدون رصيد (ملغاة)",
    ON_DEMAND_PENDING_CREDITS: "في انتظار الرصيد",
  },
};
