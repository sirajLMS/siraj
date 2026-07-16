import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export const profileNotificationsAr: ProfileNotificationsLabels = {
  title: "تفضيلات الإشعارات",
  description: "اختر كيفية استلام التحديثات لكل نوع حدث وقناة.",
  saved: "تم حفظ تفضيلات الإشعارات.",
  errorLoading: "تعذر تحميل تفضيلات الإشعارات.",
  errorSaving: "تعذر حفظ تفضيلات الإشعارات.",
  channels: {
    EMAIL: "البريد الإلكتروني",
    SMS: "رسائل SMS",
    PUSH: "إشعارات الدفع",
    ON_APP: "داخل التطبيق",
  },
  events: {
    CLASS_REMINDER: "تذكيرات الحصص",
    INVOICE_GENERATED: "إنشاء الفواتير",
    COMPLAINT_RESPONSE: "ردود الشكاوى",
    PAYMENT_METHOD_CHANGED: "تغيير طريقة الدفع",
    NEW_COMPLAINT: "شكاوى جديدة",
    NEW_SUGGESTION: "اقتراحات جديدة",
    SUGGESTION_ACKNOWLEDGED: "تأكيد استلام الاقتراح",
    SUGGESTION_DUPLICATE_MARKED: "اقتراح مكرر",
  },
};
