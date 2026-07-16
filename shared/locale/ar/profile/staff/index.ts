import type { ProfileStaffLabels } from "@/shared/locale/types/profile";

export const profileStaffAr: ProfileStaffLabels = {
  ownSubtitle: "عرض وتحديث بيانات حسابك ومعلومات الاتصال.",
  subtitle: "إدارة الأدوار والصلاحيات على مستوى النظام للموظفين الإداريين.",
  adminBanner: "عرض إداري: الحالة والصلاحيات مرئية.",
  sections: {
    account: "معلومات الحساب",
    contact: "معلومات الاتصال",
    role: "معلومات الدور",
    compensation: "التعويض",
    permissions: "الصلاحيات الفعّالة",
  },
  fields: {
    fullName: "الاسم الكامل",
    primaryEmail: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    roleName: "الدور",
    roleSlug: "معرّف الدور",
    department: "القسم",
    status: "حالة الحساب",
    statusActive: "نشط",
    statusInactive: "غير نشط",
    displayCurrency: "عملة العرض",
    hourlyRate: "الأجر بالساعة",
    currency: "العملة",
  },
  permissions: {
    inheritedGroups: "مجموعات الصلاحيات",
    directOverrides: "التجاوزات المباشرة",
    empty: {
      title: "لا توجد مجموعات صلاحيات معيّنة",
      description: "لا يملك هذا الموظف مجموعات صلاحيات موروثة. عيّن المجموعات من إدارة الصلاحيات.",
      ownDescription: "ليس لديك أي مجموعات صلاحيات معيّنة بعد.",
    },
    columns: {
      resource: "المورد",
      action: "الإجراء",
      state: "الحالة",
    },
    states: {
      granted: "مسموح",
      denied: "مرفوض",
    },
  },
};
