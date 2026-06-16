import type { ClassDetailsLabels } from "../../../types/dashboard/classes";

export const classDetails: ClassDetailsLabels = {
  pageSubtitleAdmin: "مراقبة مقاييس الحصة المباشرة والضوابط الإدارية",
  pageSubtitleTeacher: "عرض تفاصيل الحصة وإدارة الإجراءات",
  breadcrumbs: {
    dashboard: "لوحة التحكم",
    classes: "الحصص",
  },
  timezone: {
    title: "تم اكتشاف تعارض في المنطقة الزمنية",
    description: "التوقيت المحلي للطالب ({timezone}) يختلف عن إعداد الخادم (UTC). قد يكون تسجيل الحضور متأخراً.",
  },
  adminActions: {
    administrativeActions: "الإجراءات الإدارية",
    generateLog: "إنشاء سجل",
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
  },
  performance: {
    livePerformanceOverview: "نظرة عامة على الأداء المباشر",
    last30Mins: "آخر 30 دقيقة",
    engagementScore: "درجة التفاعل",
    assessmentProgress: "تقدم التقييم",
    focusLevel: "مستوى التركيز",
    sessionHealth: "صحة الجلسة",
    previousPerformanceOverview: "نظرة عامة على الأداء السابق",
    attendanceRate: "نسبة الحضور",
    avgGrade: "متوسط الدرجة",
    lastClass: "آخر حصة",
    days: "أيام",
  },
  heatmap: {
    activityHeatmap: "خريطة النشاط الحراري",
    studentInput: "مدخلات الطالب",
    teacherResponse: "استجابة المعلم",
  },
  instanceDetails: {
    classInstanceDetails: "تفاصيل الحصة",
    studentName: "اسم الطالب",
    courseModule: "وحدة المقرر",
    startTime: "وقت البداية",
    endTime: "وقت النهاية",
    duration: "المدة",
    status: "الحالة",
  },
  remarks: {
    remarksTitle: "الملاحظات / التعليمات الخاصة",
  },
  actions: {
    actions: "الإجراءات",
    activate: "تفعيل",
    stopPause: "إيقاف/تعليق",
    infoEdit: "معلومات/تعديل",
    delete: "حذف",
    contextualHelp: "تفعيل هذه الحصة سيُرسل إشعاراً للمعلم والطالب. إجراء الحذف دائم ولا يمكن التراجع عنه.",
  },
  studentProfile: {
    studentLevel: "مستوى الطالب",
    viewFullProfile: "عرض الملف الكامل",
  },
  status: {
    active: "نشط",
    scheduled: "مجدول",
    pending: "مجدول / معلّق",
    completed: "مكتمل",
    cancelled: "ملغى",
  },
};
