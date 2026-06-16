import type { TeacherDashboardLabels } from "../../../types/dashboard/teachers";

export const dashboard: TeacherDashboardLabels = {
  pageTitle: "حصص اليوم",
  pageSubtitle: "نظرة عامة على جدول التدريس اليومي وتفعيل الحصص.",
  overviewTitle: "نظرة عامة",
  todayChip: "اليوم",
  metrics: {
    totalClasses: "إجمالي الحصص",
    missedSlots: "الحصص الفائتة",
    completed: "المكتملة",
    studentsToday: "طلاب اليوم",
  },
  activeMetrics: {
    totalClasses: "إجمالي الحصص",
    activeSessions: "الحصص النشطة",
    missedSlots: "الحصص الفائتة",
    completed: "المكتملة",
  },
  activeWelcome: {
    title: "مرحباً بعودتك، {name}",
    subtitle: "اليوم {date}. لديك {count} حصة مجدولة.",
    overviewLabel: "نظرة عامة على لوحة التحكم",
    mobileSummary: "{date} • {count} حصة نشطة",
  },
  schedule: {
    title: "الحصص الحالية",
    titleToday: "جدول حصص اليوم",
    rowNumber: "#",
    classId: "رقم الحصة",
    student: "الطالب",
    time: "الوقت",
    status: "الحالة",
    contact: "التواصل",
    actions: "الإجراءات",
    showing: "عرض {shown} من {total} حصة مجدولة لليوم.",
    noEntries: "لا توجد حصص مجدولة لليوم",
    sessionEnded: "انتهت الحصة",
    duration: "المدة",
    durationValue: "{minutes} دقيقة",
    current: "الحالية",
    viewAll: "عرض الكل",
  },
  status: {
    missed: "فائتة",
    pending: "قيد الانتظار",
    upcoming: "قادمة",
    completed: "مكتملة",
    active: "نشطة",
    connecting: "جاري الاتصال",
    activated: "مفعّلة",
  },
  actions: {
    activate: "تفعيل",
    activateSession: "تفعيل الحصة",
    connecting: "جاري الاتصال",
    printSchedule: "طباعة الجدول",
    manualEntry: "إدخال يدوي",
    newSession: "حصة جديدة",
    joinVideo: "انضم للحصة المرئية",
    downloadHandbook: "تحميل الدليل",
    contactCoordinator: "تواصل مع المنسق",
  },
  activeControls: {
    liveNow: "مباشر الآن",
    sessionControls: "التحكم بالحصة",
    startSession: "بدء الحصة",
    markAbsent: "تسجيل غياب",
    requestLeave: "طلب إجازة",
  },
  progressFeed: {
    title: "موجز تقدم الطلاب",
  },
  alert: {
    title: "فاتتك وقت الحصة",
    description: "كانت الحصة {classId} مجدولة الساعة {time}. يرجى التواصل مع الإدارة لإعادة الجدولة.",
  },
  policy: {
    title: "سياسة التفعيل",
    description:
      'يرجى تفعيل حصصك قبل 5 دقائق على الأقل من وقت البدء المجدول. التفعيل المبكر يُرسل إشعارات للطلاب للانضمام في الوقت. عدم التفعيل خلال 10 دقائق من وقت البدء سيؤدي إلى حالة "فائتة".',
    descriptionMobile:
      'لا يمكن تفعيل الحصص إلا قبل 5 دقائق من وقت البدء المجدول. إذا فاتتك نافذة التفعيل بأكثر من 15 دقيقة، ستُسجل الحصة كـ "فائتة".',
  },
  support: {
    liveSupport: "الدعم المباشر",
  },
};
