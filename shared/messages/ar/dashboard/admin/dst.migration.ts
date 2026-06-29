import type { DstMigrationLabels } from "../../../types/dashboard/admin";

export const dstMigration: DstMigrationLabels = {
  pageTitle: "التوقيت الصيفي",
  pageSubtitle:
    "أداة ترحيل جماعية لضبط الجداول المؤسسية لتغييرات التوقيت الموسمية القادمة. تدقق هذه الأداة جميع الحصص النشطة وتزيح أوقات البدء والانتهاء المحلية بمقدار 60 دقيقة للحفاظ على التزامن العالمي.",
  actions: {
    updateSchedules: "تحديث الجداول",
    migrating: "جاري الترحيل...",
    migrationComplete: "اكتمل الترحيل",
    successMessage: "اكتمل ترحيل التوقيت الصيفي بنجاح. تم تحويل جميع الجداول المؤهلة.",
  },
  errors: {
    mutationFailed: "فشل ترحيل التوقيت الصيفي. يرجى المحاولة مرة أخرى.",
  },
  sections: {
    updated: "محدّث",
    errors: "خطأ",
    checkedEmpty: "تم التحقق / فارغ",
    conflictsDetected: "تعارضات مكتشفة",
    successfullyUpdated: "تم التحديث بنجاح",
    inactiveVerified: "غير نشط / تم التحقق",
  },
  metrics: {
    totalAudited: "إجمالي المدقق",
    successful: "ناجح",
    conflicts: "تعارضات",
    unchanged: "بدون تغيير",
  },
  table: {
    studentName: "اسم الطالب",
    from: "من",
    to: "إلى",
    sessionsCount: "{count} حصة",
  },
  conflicts: {
    teacherLabel: "المعلم: {name}",
  },
  checkedEmpty: {
    inactiveNote: "بقي 30 جدولاً دون تغيير. إما أنها مقفلة بتجاوز يدوي أو تخص نوادٍ لا تتبع التوقيت الصيفي المؤسسي.",
  },
};
