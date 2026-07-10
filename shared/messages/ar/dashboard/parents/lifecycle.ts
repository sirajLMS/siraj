import type { ParentLifecycleLabels } from "@/shared/messages/types/dashboard/parents/lifecycle";

export const lifecycle: ParentLifecycleLabels = {
  pageTitle: "دورة حياة ولي الأمر",
  parentId: "معرف ولي الأمر: {id}",
  breadcrumbs: {
    parents: "أولياء الأمور",
    lifecycle: "دورة الحياة",
  },
  sections: {
    adminControls: "ضوابط دورة الحياة",
    policyOverview: "نظرة عامة على السياسات",
  },
  fields: {
    lifecycleStatus: "حالة دورة الحياة",
    reason: "السبب (اختياري)",
    reasonPlaceholder: "أدخل سبباً لملاحظات التدقيق",
  },
  statusOptions: {
    REGULAR: "عادي",
    SUSPENDED: "موقوف",
    ON_LEAVE: "في إجازة",
    ON_TRIAL: "تجريبي",
  },
  policies: {
    lifecycleTitle: "دورة الحياة مقابل حالة الحساب",
    lifecycleDesc:
      "حالة دورة الحياة تتحكم في ميزات الفوترة وحالة الاشتراك. لا تلغي صلاحية الدخول — استخدم إجراءات الحساب في الملف الشخصي لذلك.",
    accountTitle: "صلاحية الدخول",
    accountDesc: "لإلغاء أو استعادة صلاحية الدخول، استخدم إلغاء/استعادة صلاحية الدخول في ملف ولي الأمر.",
  },
  actions: {
    applyChange: "تطبيق تغيير دورة الحياة",
    viewProfile: "عرض الملف الشخصي",
  },
  successMessage: "تم تحديث حالة دورة حياة ولي الأمر بنجاح.",
  errors: {
    invalidId: "معرف ولي أمر غير صالح.",
  },
};
