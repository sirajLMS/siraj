import type { RescheduleFormLabels } from "@/shared/messages/types/dashboard/classes";

export const rescheduleForm: RescheduleFormLabels = {
  pageTitle: "إعادة جدولة حصة",
  pageSubtitle: "عدّل توقيت الجلسة للمشاركين التاليين.",
  sections: {
    classDetails: "تفاصيل الحصة",
  },
  fields: {
    teacherName: "اسم المعلم",
    studentName: "اسم الطالب",
    newDate: "اختر التاريخ الجديد",
    newTime: "اختر الوقت الجديد",
  },
  warning: {
    description:
      "تحذير: يُحسب وقت الحصة بناءً على المنطقة الزمنية للمعلم ({timezone}). يرجى التأكد من صحة التحويلات المحلية.",
  },
  quickAdjust: {
    label: "تعديل سريع",
    oneHour: "+ ساعة واحدة",
    oneDay: "+ يوم واحد",
    oneWeek: "+ أسبوع واحد",
  },
  notificationPolicy: {
    title: "سياسة الإشعارات",
    description: "سيستلم المعلم والطالب إشعارات فورية عبر واتساب والبريد الإلكتروني عند التأكيد.",
  },
  actions: {
    submit: "إرسال",
    submitMobile: "إرسال إعادة الجدولة",
    processing: "جاري المعالجة...",
    cancel: "إلغاء",
    successMessage: "تمت إعادة جدولة الحصة بنجاح. تمت جدولة الإشعارات.",
  },
  validation: {
    dateRequired: "التاريخ الجديد مطلوب",
    timeRequired: "الوقت الجديد مطلوب",
  },
  classInstanceNotFound: "لم يتم العثور على الحصة.",
};
