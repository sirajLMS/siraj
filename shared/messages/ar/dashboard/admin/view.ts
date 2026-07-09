import type { AdminViewLabels, ClassDetailsPerformanceLabels } from "@/shared/messages/types/dashboard/admin";

const performanceLabels: ClassDetailsPerformanceLabels = {
  livePerformanceOverview: "نظرة عامة على الأداء المباشر",
  last30Mins: "آخر 30 دقيقة",
  engagementScore: "درجة التفاعل",
  assessmentProgress: "تقدم التقييم",
  focusLevel: "مستوى التركيز",
  sessionHealth: "صحة الجلسة",
  noData: "لا تتوفر بيانات أداء لهذه الجلسة.",
};

export const adminView: AdminViewLabels = {
  timezone: {
    title: "تم اكتشاف تعارض في المنطقة الزمنية",
    description: "التوقيت المحلي للطالب ({timezone}) يختلف عن إعداد الخادم (UTC). قد يكون تسجيل الحضور متأخراً.",
  },
  adminActions: {
    administrativeActions: "الإجراءات الإدارية",
    generateLog: "إنشاء سجل",
    reschedule: "تعديل موعد الحصة",
    forceActivate: "فرض التفعيل",
    stopPause: "إيقاف/تعليق",
    deleteInstance: "حذف الحصة",
    disabledTooltips: {
      forceActivate: {
        activated: "لا يمكنك فرض التفعيل لأن الحصة مفعّلة بالفعل.",
        running: "لا يمكنك فرض التفعيل لأن الجلسة قيد التشغيل.",
        completed: "لا يمكنك فرض التفعيل لأن الحصة مكتملة.",
      },
      stop: {
        notActivated: "لا يمكنك الإيقاف لأن الحصة لم تُفعّل بعد.",
        activated: "لا يمكنك الإيقاف لأن الجلسة لم تبدأ بعد. ابدأ الجلسة أولاً.",
        completed: "لا يمكنك الإيقاف لأن الحصة مكتملة.",
      },
    },
  },
  classInfo: {
    liveInstance: "حصة مباشرة",
    activeConnection: "اتصال نشط",
    student: "الطالب",
    moduleInstructor: "مدرس الوحدة",
  },
  metadata: {
    metadata: "البيانات الوصفية",
    scheduledDate: "التاريخ المجدول",
    duration: "المدة",
    latency: "زمن الاستجابة",
    authorization: "التفويض",
    minutes: "دقيقة",
    optimal: "مثالي",
    unavailable: "—",
  },
  performance: performanceLabels,
  heatmap: {
    activityHeatmap: "خريطة النشاط الحراري",
    studentInput: "مدخلات الطالب",
    teacherResponse: "استجابة المعلم",
    noData: "لا تتوفر بيانات نشاط لهذه الجلسة.",
  },
};
