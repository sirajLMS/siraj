import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core";

export const parentDashboard: ParentDashboardLabels = {
  pageTitle: "لوحة التحكم",
  welcome: name => `مرحباً، ${name}`,
  welcomeBack: "مرحباً بعودتك،",
  pendingMessages: count => `${count} رسائل معلقة من المعلمين`,
  metrics: {
    totalStudents: "إجمالي الطلاب",
    todaysClasses: "حصص اليوم",
    pendingInvoices: "فواتير معلقة",
    performanceAvg: "متوسط الأداء",
  },
  schedule: {
    title: "جدول حصص اليوم",
    titleMobile: "جدول اليوم",
    filter: "تصفية",
    viewFullWeek: "عرض الأسبوع كاملاً",
    viewAll: "عرض الكل",
    rowNumber: "#",
    classTime: "وقت الحصة",
    studentName: "اسم الطالب",
    teacherName: "اسم المعلم",
    history: "السجل",
    status: "الحالة",
    contact: "التواصل",
    classStatus: "حالة الحصة",
    duration: minutes => `المدة: ${minutes} دقيقة`,
    teacherLabel: name => `المعلم: ${name}`,
    joinVideo: "الانضمام للجلسة المرئية",
    frozen: "مجمّد",
    contactAdmin: "تواصل مع المشرف (تجميد)",
    noEntries: "لا توجد حصص مجدولة لليوم",
  },
  bookingStatus: {
    confirmed: "مؤكد",
    rescheduled: "معاد جدولته",
  },
  liveClassStatus: {
    startingSoon: "تبدأ قريباً",
    pending: "معلقة",
    scheduled: "مجدولة",
  },
  progress: {
    title: "ملخص التقدم الأكاديمي",
    subtitle: "نظرة أسبوعية لكلا الطالبين",
    completion: percent => `${percent}% إنجاز`,
    downloadReport: "تحميل التقرير الكامل",
  },
  workshop: {
    badge: "تحديثات",
    learnMore: "اعرف المزيد",
  },
  support: {
    liveSupport: "دعم مباشر",
  },
};
