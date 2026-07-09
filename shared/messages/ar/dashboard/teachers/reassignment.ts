import type { TeacherReassignmentLabels } from "@/shared/messages/types/dashboard/teachers";

export const reassignment: TeacherReassignmentLabels = {
  pageTitle: "إعادة تعيين المعلم",
  pageSubtitle: "تحديث المعلم الأساسي والحالة الإدارية للطالب المختار.",
  breadcrumbs: {
    dashboard: "لوحة التحكم",
    parentManagement: "إدارة أولياء الأمور",
    teacherReassignment: "إعادة تعيين المعلم",
  },
  studentContext: {
    studentId: "معرف الطالب: #{id}",
    grade: "الصف",
    enrollment: "التسجيل",
    active: "نشط",
  },
  currentTeacher: {
    title: "المعلم الحالي",
    unset: "غير محدد",
    notice: "تم إيقاف الإشعارات التلقائية لملف الطالب هذا مؤقتًا حتى يتم تعيين معلم جديد.",
  },
  warning: "ملاحظة: لا تنسَ إضافة جدول للطالب إذا تم إلغاء تعيين المعلم.",
  controls: {
    title: "ضوابط الإدارة",
    subtitle: "تحديث المعلم الأساسي والحالة الإدارية للطالب المختار.",
    assignTeacher: "تعيين معلم جديد",
    assignTeacherPlaceholder: "اختر معلمًا من الدليل...",
    teacherAvailabilityNotice: "يتم سرد المعلمين المتاحين فقط في المنطقة الزمنية للطالب أعلاه.",
    statusUpdate: "تحديث حالة الطالب",
    currentStatus: "الحالي: {status}",
  },
  historyAndContact: {
    changeHistory: "سجل التغييرات",
    lastUpdated: "آخر تحديث بواسطة المسؤول في {date}",
    parentContact: "الاتصال بولي الأمر",
    pendingNotifications: "{count} إشعارات معلقة في قائمة الانتظار",
  },
  actions: {
    info: "التغييرات تدخل حيز التنفيذ فورًا.",
    cancel: "إلغاء",
    submit: "إرسال",
    processing: "جاري المعالجة...",
    saved: "تم الحفظ",
    reassignSuccess: "تم إعادة تعيين المعلم بنجاح",
    statusChangeSuccess: "تم تغيير حالة الطالب بنجاح",
  },
  errors: {
    invalidId: "معرف الطالب غير صالح.",
  },
};
