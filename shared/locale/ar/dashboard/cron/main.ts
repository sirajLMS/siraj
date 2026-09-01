/** Cron management dashboard labels — Arabic. */
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export const dashboardCronAr: CronLabels = {
  pageTitle: "إدارة المهام المجدولة",
  pageSubtitle: "إدارة المهام المجدولة (كرون) ومراقبة تنفيذها.",
  // Table headers
  colName: "الاسم",
  colExpression: "تعبير كرون",
  colJobKind: "نوع المهمة",
  colStatus: "الحالة",
  colNextRun: "التشغيل التالي",
  colLastRun: "آخر تشغيل",
  colConcurrencyPolicy: "التزامن",
  colActions: "الإجراءات",
  colTriggerSource: "مصدر التشغيل",
  colAttempt: "المحاولة",
  colDuration: "المدة",
  colErrorMessage: "رسالة الخطأ",
  colStartedAt: "وقت البدء",
  // Status labels
  statusActive: "نشط",
  statusPaused: "متوقف مؤقتاً",
  statusDisabled: "معطل",
  // Actions
  actionCreate: "إنشاء جدولة",
  actionEdit: "تعديل",
  actionPause: "إيقاف مؤقت",
  actionResume: "استئناف",
  actionDelete: "حذف",
  actionTrigger: "تشغيل الآن",
  actionConfirm: "تأكيد",
  actionCancel: "إلغاء",
  // Dialog
  dialogCreateTitle: "إنشاء جدولة كرون",
  dialogEditTitle: "تعديل جدولة كرون",
  dialogRunsTitle: name => `عمليات تشغيل ${name}`,
  // Form fields
  fieldName: "الاسم",
  fieldDescription: "الوصف",
  fieldCronExpression: "تعبير كرون",
  fieldJobKind: "نوع المهمة",
  fieldPayload: "الحمولة (JSON)",
  fieldTimezone: "المنطقة الزمنية",
  fieldConcurrencyPolicy: "سياسة التزامن",
  fieldMaxRetries: "أقصى عدد لإعادة المحاولة",
  fieldRetryBackoffSeconds: "تأخير إعادة المحاولة (ثواني)",
  fieldTimeoutSeconds: "مهلة التنفيذ (ثواني)",
  jobKindNoop: "بدون عملية",
  concurrencyAllow: "سماح",
  concurrencySkip: "تخطي",
  concurrencyReplace: "استبدال",
  // Preview
  previewNextRuns: "معاينة التشغيلات القادمة",
  // Queue stats
  queueStatsTitle: "إحصائيات قائمة الانتظار",
  queueStatsPending: "قيد الانتظار",
  queueStatsInFlight: "قيد التنفيذ",
  queueStatsFailed: "فشل",
  // Run history
  runsTitle: "سجل التشغيلات",
  runsCount: count => {
    if (count === 0) return "لا توجد تشغيلات";
    if (count === 1) return "تشغيل واحد";
    if (count === 2) return "تشغيلان";
    if (count >= 3 && count <= 10) return `${count} تشغيلات`;
    return `${count} تشغيل`;
  },
  statusPending: "قيد الانتظار",
  statusRunning: "قيد التنفيذ",
  statusCompleted: "مكتمل",
  statusFailed: "فشل",
  statusRetrying: "إعادة المحاولة",
  statusTimeout: "انتهت المهلة",
  statusCancelled: "ملغي",
  // Trigger source labels
  triggerSourceVercelTicker: "مؤقت Vercel",
  triggerSourceVercelExplicit: "Vercel صريح",
  triggerSourceExternal: "خارجي",
  triggerSourceWorkerRetry: "إعادة محاولة العامل",
  triggerSourceManual: "يدوي",
  // Queue backend labels
  pgBoss: "pg-boss",
  bullmqPostgres: "BullMQ (PostgreSQL)",
  customSql: "SQL مخصص",
  queueBackendStub: "وهمي (تطوير)",
  bullmqRedis: "BullMQ (Redis)",
  // Additional run status
  statusSkipped: "تم تخطيه",
  // Empty state
  emptyMessage: 'لا توجد جدولات كرون. انقر على "إنشاء جدولة" لإضافة واحدة.',
  // Manual trigger confirm dialog
  manualTriggerConfirmTitle: "تشغيل الجدولة",
  manualTriggerConfirmMessage: name => `هل أنت متأكد من أنك تريد تشغيل "${name}" يدوياً؟`,
  manualTriggerConfirmButton: "تشغيل الآن",
  manualTriggerCancel: "إلغاء",
  // Loading indicator
  loading: "جاري التحميل…",
  // Success messages
  scheduleCreated: "تم إنشاء الجدولة بنجاح",
  scheduleUpdated: "تم تحديث الجدولة بنجاح",
  scheduleDeleted: "تم حذف الجدولة بنجاح",
  schedulePaused: "تم إيقاف الجدولة مؤقتاً بنجاح",
  scheduleResumed: "تم استئناف الجدولة بنجاح",
  scheduleTriggered: "تم تشغيل الجدولة بنجاح",
  triggerSkipped: "تم تخطي التشغيل — الجدولة قيد التنفيذ بالفعل",
  // Errors
  errors: {
    invalidCronExpression: expr => `تعبير كرون غير صالح: ${expr}`,
    scheduleNameTaken: name => `الجدولة باسم "${name}" موجودة بالفعل`,
    scheduleNotFound: id => `الجدولة غير موجودة: ${id}`,
    scheduleInactive: "الجدولة غير نشطة",
    scheduleNotActive: "الجدولة غير نشطة — قد تكون متوقفة مؤقتاً أو معطلة بالفعل",
    scheduleNotPaused: "الجدولة غير متوقفة مؤقتاً — لا يمكن استئناف جدولة غير متوقفة حالياً",
    concurrencyConflict: "هناك تشغيل قيد التنفيذ لهذه الجدولة بالفعل",
    queueBackendNotAvailable: "الواجهة الخلفية لقائمة الانتظار المكوَّنة غير متاحة",
    permissionDenied: "ليس لديك صلاحية إدارة جدولات كرون",
    invalidTimezone: tz => `منطقة زمنية غير صالحة: ${tz}`,
    runNotFound: id => `التشغيل غير موجود: ${id}`,
    manualTriggerConflict: "هناك تشغيل قيد التنفيذ لهذه الجدولة بالفعل",
    dispatchSendFailed: id => `فشل إرسال تشغيل للجدولة "${id}" — تعذر الوصول إلى محول قائمة الانتظار`,
    enqueueRetryFailed: id =>
      `فشلت إضافة إعادة محاولة التشغيل "${id}" إلى قائمة الانتظار — تعذر الوصول إلى محول قائمة الانتظار`,
    queueBackendUnknown: backend => `خلفية قائمة انتظار غير معروفة: ${backend}`,
    genericError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    // API route-level errors
    missingScheduleId: "معامل scheduleId مفقود في الاستعلام",
    invalidScheduleIdFormat: "صيغة scheduleId غير صالحة",
    tickerFailed: "فشل المؤقت",
    classRemindersFailed: "فشل تذكيرات الحصص",
    userContextRequired: "يلزم وجود سياق مستخدم مصادق عليه لتنفيذ هذا الإجراء",
    // Cron auth errors (machine-to-machine API responses)
    unauthorized: "غير مصرح",
    methodNotAllowed: "الطريقة غير مسموحة",
    serverMisconfigured: "إعداد الخادم غير صحيح",
  },
};
