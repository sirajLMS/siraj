import type { PermissionsLabels } from "../../../types/dashboard/permissions";

export const permissions: PermissionsLabels = {
  title: "إدارة الصلاحيات",
  subtitle: "تهيئة التحكم بالوصول المستند إلى الأدوار، وإدارة مجموعات الصلاحيات، وتحديد استثناءات المستخدمين.",
  groupsTab: "مجموعات الصلاحيات",
  catalogTab: "فهرس الصلاحيات",
  overridesTab: "تخصيص الصلاحيات للمستخدم",
  currentPermissions: "الصلاحيات الحالية",
  addPermissions: "إضافة صلاحيات",
  assignedUsers: "المستخدمون المعينون",
  corePermissionTooltip: "هذه صلاحية أساسية للنظام لا يمكن إلغاؤها.",
  systemGroupBadge: "نظام",
  explicitGrant: "منح صريح",
  explicitDeny: "حظر صريح",
  removeUsersConfirmTitle: "إلغاء تعيين المستخدمين من المجموعة",
  removeUsersConfirmBody: "هل أنت متأكد من إلغاء صلاحية المجموعة للمستخدمين المحددين؟",
  effectivePermissions: "الصلاحيات الفعلية",
  editOverrides: "تعديل تخصيصات المستخدم",
  inheritDefault: "موروث تلقائي (بدون تخصيص)",
};
