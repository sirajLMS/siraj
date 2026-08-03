import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherCreateRecurringClassAr: TeacherCreateRecurringClassLabels = {
  dialogTitle: "إضافة حصة",
  fields: {
    student: "الطالب",
    studentPlaceholder: "ابحث واختر طالباً...",
    teacher: "المعلم",
    teacherPlaceholder: "ابحث واختر معلماً...",
    subject: "المادة",
    subjectPlaceholder: "اختر مادة",
    time: "الوقت",
    duration: "المدة",
    durationMinutes: minutes => `${minutes} دقائق`,
    days: "الأيام المتكررة",
    timezone: "المنطقة الزمنية",
    classType: "نوع الحصة",
  },
  classTypes: {
    REGULAR: "عادي",
    TRIAL: "تجريبي",
    ADVANCE: "متقدم",
  },
  days: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
  },
  timeOverride: {
    addOverride: "إضافة وقت مخصص",
    removeOverride: "إزالة التخصيص",
    label: _day => `وقت مخصص`,
  },
  scheduling: {
    mode: "وضع الجدولة",
    quotaId: "معرف الحصة",
    earmarkedClasses: "الحصص المحجوزة",
    generationHorizon: "أفق التوليد (أسابيع)",
    ondemandNoCreditsOutcome: "نتيجة عدم توفر الرصيد عند الطلب",
    noMode: "بدون",
    ondemandNoCredits: {
      AutoCancel: "تخطي",
      AutoAbsentNoCredits: "توليد على أي حال",
      RemindOnly: "تذكير فقط",
    },
    modes: {
      NumberOfClasses: "جدولة ثابتة",
      OnDemand: "عند الطلب",
      Quota: "حصة",
    },
  },
  actions: {
    create: "إنشاء الحصة",
    cancel: "إلغاء",
    submitting: "جارٍ الإرسال...",
  },
  success: {
    title: "تم إنشاء الحصة",
    description: count => `تم إنشاء ${count} حصة بنجاح للجدول المتكرر.`,
  },
  errors: {
    noDaysSelected: "يرجى اختيار يوم واحد على الأقل للجدول المتكرر.",
    noStudentSelected: "يرجى اختيار طالب.",
    noSubjectSelected: "يرجى اختيار مادة.",
    creationFailed: "فشل إنشاء الحصة المتكررة. يرجى المحاولة مرة أخرى.",
    durationMustBePositive: "يجب أن تكون المدة أكبر من 0",
  },
};
