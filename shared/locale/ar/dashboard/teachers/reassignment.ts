import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherReassignmentAr: TeacherReassignmentLabels = {
  pageTitle: "إعادة تعيين المعلم",
  pageSubtitle: "إعادة تعيين المعلم للطالب",
  breadcrumbs: {
    dashboard: "لوحة التحكم",
    parentManagement: "إدارة أولياء الأمور",
    teacherReassignment: "إعادة تعيين المعلم",
  },
  studentContext: {
    grade: grade => `الصف: ${grade}`,
    enrollment: "تاريخ التسجيل",
    active: "نشط",
  },
  currentTeacher: {
    title: "المعلم الحالي",
    unset: "غير محدد",
    notice: "قد تؤثر التغييرات على الجدولة وتوفر الحصص",
  },
  warning: "قد تؤثر إعادة التعيين على تقدم الطالب وجدوله.",
  controls: {
    title: "ضوابط إعادة التعيين",
    subtitle: "اختر معلمًا جديدًا وقم بالتأكيد",
    assignTeacher: "تعيين المعلم",
    assignTeacherPlaceholder: "اختر معلمًا جديدًا",
    teacherAvailabilityNotice: "المعلمون المتاحون في المنطقة الزمنية للطالب",
    statusUpdate: "تحديث الحالة",
    currentStatus: status => `الحالة الحالية: ${status}`,
    statusOptions: {
      REGULAR: "منتظم / نشط",
      SUSPENDED: "موقوف",
      ON_LEAVE: "في إجازة",
      ON_TRIAL: "في فترة تجريبية",
      DEACTIVATED: "معطّل",
    },
  },
  historyAndContact: {
    changeHistory: "سجل التغييرات",
    lastUpdated: date => `آخر تحديث: ${date}`,
    parentContact: "التواصل مع ولي الأمر",
    pendingNotifications: count => `الإشعارات المعلقة: ${count}`,
  },
  actions: {
    info: "معلومات",
    cancel: "إلغاء",
    submit: "إرسال",
    processing: "جاري المعالجة...",
    saved: "تم الحفظ",
    reassignSuccess: "تم إعادة تعيين المعلم بنجاح.",
    statusChangeSuccess: "تم تحديث الحالة بنجاح.",
  },
  errors: {
    invalidId: "معرّف الطالب غير صالح.",
  },
};
