import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

export const dashboardDstMigrationAr: DstMigrationLabels = {
  pageTitle: "تعديل التوقيت الصيفي",
  pageSubtitle:
    "أداة ترحيل جماعية لضبط الجداول المؤسسية لتغييرات التوقيت الموسمية القادمة. تدقق هذه الأداة جميع الحصص النشطة وتزيح أوقات البدء والانتهاء المحلية بمقدار 60 دقيقة للحفاظ على التزامن العالمي.",
  actions: {
    updateSchedules: "تحديث الجداول",
    migrating: "جارٍ الترحيل...",
    migrationComplete: "اكتمل الترحيل",
    successMessage: "اكتمل ترحيل التوقيت الصيفي بنجاح. تم تعديل جميع الجداول المؤهلة.",
  },
  errors: {
    mutationFailed: "فشل ترحيل التوقيت الصيفي. يرجى المحاولة مرة أخرى.",
    noDstTransitionDetected: "لم يتم اكتشاف انتقال للتوقيت الصيفي. النظام خارج فترة تعديل التوقيت الصيفي.",
  },
  sections: {
    updated: "محدَّث",
    errors: "خطأ",
    checkedEmpty: "تم التحقق / فارغ",
    conflictsDetected: "تعارضات مكتشفة",
    successfullyUpdated: "تم التحديث بنجاح",
    inactiveVerified: "غير نشط / تم التحقق",
  },
  metrics: {
    totalAudited: "إجمالي المدقَّق",
    successful: "ناجح",
    conflicts: "تعارضات",
    unchanged: "دون تغيير",
  },
  table: {
    studentName: "اسم الطالب",
    from: "من",
    to: "إلى",
    sessionsCount: count => (count === 1 ? "حصة واحدة" : `${count} حصص`),
  },
  conflicts: {
    teacherLabel: name => `المعلم: ${name}`,
  },
  checkedEmpty: {
    inactiveNote: "بقيت 30 جدولًا دون تغيير. إما أنها مقفلة بتجاوزات يدوية أو تخص نوادٍ لا تتبع التوقيت الصيفي المؤسسي.",
  },
};
