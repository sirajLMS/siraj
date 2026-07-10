import type { MeetingProvidersLabels } from "@/shared/messages/types/dashboard/meeting-providers";

export const meetingProviders: MeetingProvidersLabels = {
  pageTitle: "مزودو الاجتماعات",
  pageSubtitle: "إدارة كتالوج منصات الاجتماعات المستخدمة في إعدادات المستخدم.",
  addProvider: "إضافة مزود",
  createTitle: "إنشاء مزود اجتماع",
  editTitle: "تعديل مزود الاجتماع",
  deleteTitle: "حذف مزود الاجتماع",
  deleteConfirm: "حذف المزود",
  active: "نشط",
  inactive: "غير نشط",
  cancel: "إلغاء",
  save: "حفظ",
  edit: "تعديل",
  delete: "حذف",
  columns: {
    slug: "المعرّف",
    name: "الاسم",
    active: "الحالة",
    actions: "الإجراءات",
  },
  fields: {
    slug: "المعرّف",
    name: "الاسم",
    urlAllowlist: "قائمة المضيفات المسموحة",
    urlAllowlistHelp: "أنماط مضيف مفصولة بفواصل",
    urlExample: "مثال على الرابط",
    isActive: "نشط",
    supportsUsername: "يدعم اسم المستخدم",
    supportsPassword: "يدعم كلمة المرور",
    supportsTenantId: "يدعم معرف المستأجر",
  },
};
