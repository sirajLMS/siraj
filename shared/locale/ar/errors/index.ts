import type { ErrorsLabels } from "@/shared/locale/types/errors";

export const errorsAr: ErrorsLabels = {
  auth: {
    // ─── No-param strings ────────────────────────────────────────────
    invalidRoleTab: "علامة التبويب المحددة للدور غير صالحة.",
    passwordMinLength: "يجب أن تكون كلمة المرور ٨ أحرف على الأقل.",
    passwordRequiresUppercase: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل.",
    passwordRequiresLowercase: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل.",
    passwordRequiresDigit: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.",
    passwordRequiresSpecialChar: "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (!@#$%^&*()_+-=[]{}|;:',.<>?/).",
    tooManyLoginAttempts: "عدد محاولات تسجيل الدخول كثيرة جداً. يرجى المحاولة لاحقاً.",
    serviceUnavailable: "خدمة المصادقة غير متاحة مؤقتاً",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صالحة",
    currentPasswordInvalid: "كلمة المرور الحالية غير صحيحة.",
    passwordsDoNotMatch: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين.",
    accountDeactivated: "تم إلغاء تفعيل هذا الحساب. يرجى التواصل مع الدعم.",
    accountLocked: "عدد محاولات تسجيل الدخول كثيرة جداً. تم قفل حسابك مؤقتاً.",
    demoLoginNotEnabled: "تسجيل الدخول التجريبي غير مفعل",
    demoLoginFailed: "فشل تسجيل الدخول التجريبي",
    impersonationNotAllowed: "غير مسموح لك بانتحال هوية المستخدمين",
    cannotImpersonateSelf: "لا يمكنك انتحال هويتك",
    cannotImpersonateSuperAdmin: "لا يمكنك انتحال هوية مسؤول نظام آخر",
    impersonationTargetNotFound: "المستخدم المراد انتحال هويته غير موجود",
    impersonationTargetInactive: "المستخدم المراد انتحال هويته غير نشط أو محذوف",
    impersonationSessionInvalid: "جلستك غير صالحة لانتحال الهوية",
    impersonationNotActive: "لا توجد جلسة انتحال هوية نشطة",
    impersonationExpired: "انتهت جلسة انتحال الهوية",
    impersonationNotAllowedDuringSession: "هذا الإجراء غير مسموح أثناء انتحال هوية مستخدم",
    groupSimulationNotAllowed: "غير مسموح لك بمحاكاة مجموعات الأذونات",
    groupSimulationSessionInvalid: "جلستك غير صالحة لمحاكاة مجموعة الأذونات",
    groupSimulationNotActive: "لا توجد محاكاة نشطة لمجموعة أذونات",
    groupSimulationNotAllowedDuringSession: "هذا الإجراء غير مسموح أثناء محاكاة مجموعة أذونات",
    groupSimulationNotAllowedWhileImpersonating: "أنهِ انتحال الهوية قبل محاكاة مجموعة أذونات",
    groupSimulationAlreadyHasGroup: "لديك هذه المجموعة بالفعل؛ اختر مجموعة أخرى للمحاكاة",
    insufficientPermissions: "ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.",
    impersonationNotAllowedWhileImpersonating: "لا يمكنك انتحال هوية أثناء انتحال هوية أخرى.",
    cannotResetOwnPasswordViaAdmin: "لا يمكنك إعادة تعيين كلمة مرورك الخاصة عبر مسار الإدارة.",
    // ─── Functions (were {param} strings) ────────────────────────────
    demoGroupNotFound: (groupSlug: string) => `مجموعة العرض غير موجودة: ${groupSlug}`,
    demoGroupNoUser: (groupSlug: string) => `لم يتم العثور على مستخدم لمجموعة العرض: ${groupSlug}`,
  },
  permissionManagement: {
    unauthorized: "ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.",
    userNotFound: (id: string) => `المستخدم غير موجود: ${id}`,
    permissionGroupNotFound: (id: string) => `مجموعة الأذونات غير موجودة: ${id}`,
    permissionGroupNameRequired: "اسم المجموعة مطلوب.",
    permissionGroupNameTooLong: "اسم المجموعة طويل جداً (255 حرف كحد أقصى).",
    permissionGroupInvalidName: "اسم المجموعة غير صالح.",
    cannotModifySuperAdmin: "لا يمكن تعديل المستخدم المسؤول الأعلى.",
    cannotModifySystemPermissionGroup: "لا يمكن تعديل الخصائص الأساسية لمجموعات صلاحيات النظام",
    cannotDeleteSystemPermissionGroup: "لا يمكن حذف صلاحية أو مجموعة تابعة للنظام",
  },
  billing: {
    invoiceNotFound: (id: string) => `الفاتورة غير موجودة: ${id}`,
    invoiceNotPendingReview: (id: string) => `الفاتورة ليست في حالة انتظار المراجعة: ${id}`,
    invoicePaymentProofNotFound: (id: string) => `إثبات الدفع للفاتورة ${id} غير موجود`,
    invoiceAlreadyPaid: ({ id, status }: { id: string; status: string }) =>
      `الفاتورة ${id} بالفعل في حالة ${status.toLowerCase()}.`,
    paymentProofRequired: "إثبات الدفع مطلوب.",
    cannotDeletePaidInvoice: (id: string) => `لا يمكن حذف الفاتورة ${id} لأنها مدفوعة.`,
    invalidParentId: "معرف ولي الأمر غير صالح.",
    invalidInvoiceAmount: "مبلغ الفاتورة غير صالح.",
    parentNotFound: "ولي الأمر غير موجود.",
    invoiceVersionMismatch: ({
      id,
      expectedVersion,
      gotVersion,
    }: {
      id: string;
      expectedVersion: number;
      gotVersion: number;
    }) => `عدم تطابق في إصدار الفاتورة ${id}: المتوقع ${expectedVersion}، الفعلي ${gotVersion}.`,
    exchangeRateStale: ({ fromCurrency, toCurrency }: { fromCurrency: string; toCurrency: string }) =>
      `سعر الصرف لـ ${fromCurrency} إلى ${toCurrency} قديم (أقدم من 24 ساعة)`,
  },
  credit: {
    duplicatePurchase: "تمت معالجة عملية شراء الرصيد هذه بالفعل.",
    insufficientBalance: ({ studentId, remaining }: { studentId: string; remaining: number }) =>
      `رصيد الطالب ${studentId} غير كافٍ. المتبقي: ${remaining}`,
    invalidInput: "إدخال غير صالح.",
  },
  file: {
    recordNotFound: ({ tableName, entityId }: { tableName: string; entityId: string }) =>
      `${tableName} غير موجود: ${entityId}`,
    invalidFileType: "نوع الملف غير صالح. يُسمح فقط بملفات PDF و JPG و PNG و HEIC.",
    invoicePaymentProofPending: "لدى هذه الفاتورة إثبات دفع قيد المراجعة بالفعل.",
  },
  meetingProvider: {
    meetingProviderInactive: "موفر الاجتماعات غير نشط.",
    meetingConfigNotFound: (id: string) => `تكوين الاجتماع غير موجود: ${id}`,
    meetingConfigCreateFailed: "فشل إنشاء تكوين الاجتماع.",
    meetingConfigUpdateFailed: "فشل تحديث تكوين الاجتماع.",
    meetingProviderNotFound: (id: string) => `موفر الاجتماعات غير موجود: ${id}`,
    meetingProviderCreateFailed: "فشل إنشاء موفر الاجتماعات.",
    meetingProviderUpdateFailed: "فشل تحديث موفر الاجتماعات.",
    meetingProviderInUse: "موفر الاجتماعات قيد الاستخدام ولا يمكن حذفه.",
    invalidReturnPath: "مسار الإرجاع غير صالح. يجب أن يكون مسار الإرجاع ارتباطاً نسبياً.",
    missingSubject: "مطلوب موضوع الانتحال لتفويض النطاق الكامل",
    dwdNotEnabled: "تفويض النطاق الكامل غير مفعّل لحساب الخدمة هذا. اتصل بمسؤول Google Workspace لديك.",
  },
  parent: {
    alreadyExists: "ملف ولي الأمر لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء ملف ولي الأمر.",
  },
  staff: {
    alreadyExists: "ملف الموظف لهذا المستخدم موجود بالفعل.",
  },
  teacher: {
    alreadyExists: "ملف المعلم لهذا المستخدم موجود بالفعل.",
    teacherNotFound: (id: string) => `المعلم غير موجود: ${id}`,
    staffProfileNotFound: "ملف الموظف غير موجود.",
    quotaMustBeNonNegative: "الحصة يجب أن تكون رقمًا غير سالب.",
    quotaExceedsTotal: ({ requested, total }: { requested: number; total: number }) =>
      `الحصة (${requested}) تتجاوز الإجمالي (${total}).`,
  },
  student: {
    studentNotFound: (id: string) => `الطالب غير موجود: ${id}`,
    studentCreateFailed: "فشل إنشاء الطالب.",
    studentUpdateFailed: (id: string) => `فشل تحديث الطالب (المعرف: ${id}).`,
    studentVersionMismatch: ({
      id,
      expectedVersion,
      gotVersion,
    }: {
      id: string;
      expectedVersion: number;
      gotVersion: number;
    }) => `عدم تطابق في إصدار الطالب ${id}: المتوقع ${expectedVersion}، الفعلي ${gotVersion}.`,
    insufficientClasses: ({ id, remaining, required }: { id: string; remaining: number; required: number }) =>
      `رصيد الحصص غير كافٍ للطالب ${id}: متبقٍ ${remaining}، مطلوب ${required}.`,
    invalidStatusTransition: ({ currentStatus, newStatus }: { currentStatus: string; newStatus: string }) =>
      `انتقال حالة غير صالح: ${currentStatus} -> ${newStatus}.`,
    studentEmailRequired: "بريد الطالب الإلكتروني مطلوب.",
    studentPasswordRequired: "كلمة مرور الطالب مطلوبة.",
  },
  category: {
    categoryNotFound: (id: string) => `الفئة غير موجودة: ${id}`,
    categoryCreateFailed: "فشل إنشاء فئة الحصة.",
    categoryHasSubjects: "لا يمكن حذف الفئة لأن لديها مواد مرتبطة بها.",
  },
  user: {
    userNotFound: (id: string) => `المستخدم غير موجود: ${id}`,
    userEmailExists: "مستخدم بهذا البريد الإلكتروني موجود بالفعل.",
    cannotModifyBankingFields: "لا يمكن تعديل الحقول المصرفية.",
    parentNotFound: "ولي الأمر غير موجود.",
  },
  scheduling: {
    cannotRescheduleToSelf: "لا يمكن إعادة الجدولة للذات.",
    cannotRescheduleCompleted: "لا يمكن إعادة جدولة جلسة مكتملة.",
    cannotRescheduleAlreadyRescheduled: "لا يمكن إعادة جدولة جلسة تم إعادة جدولتها بالفعل.",
    outOfQuota: "نفدت الحصة.",
    leaveQuotaExceeded: ({ maxLeaves }: { maxLeaves: string }) =>
      `تم تجاوز حصة الإجازة: الحد الأقصى ${maxLeaves} إجازات مسموح بها.`,
    classInstanceNotFound: ({ id }: { id: string }) => `مثيل الفصل غير موجود: ${id}`,
    originalClassNotFound: "الفصل الأصلي غير موجود.",
    invalidTransition: "انتقال غير صالح.",
    teacherNotAssigned: ({
      teacherId,
      studentId,
      startTime,
    }: {
      teacherId: string;
      studentId: string;
      startTime: string;
    }) => `المعلم ${teacherId} غير معين للطالب ${studentId} في ${startTime}.`,
    teacherBooked: "المعلم محجوز بالفعل في هذا الوقت.",
    studentBooked: "الطالب محجوز بالفعل في هذا الوقت.",
    meetingUrlInUse: "رابط الاجتماع مستخدم بالفعل.",
    sessionNotActivated: "الجلسة غير مفعلة.",
    missedClassTime: "لقد فات وقت الحصة.",
  },
  permissionGroup: {
    permissionGroupNotFound: "مجموعة الأذونات غير موجودة.",
  },
  sessionConfig: {
    roleNameRequired: "اسم الدور مطلوب.",
    ttlOutOfRange: "يجب أن تكون مدة الجلسة بين 60 و 2,419,200 ثانية.",
    maxConcurrentOutOfRange: "يجب أن يكون الحد الأقصى للجلسات المتزامنة بين 1 و 50.",
  },
  quota: {
    insufficientRemaining: (requested: number, available: number) => `المتبقي ${available} حصة فقط — طُلب ${requested}`,
    exceedsCreditBalance: (requested: number, available: number) =>
      `رصيد غير كافٍ. المتاح: ${available}، المطلوب: ${requested}`,
    periodicRefreshFailed: (quotaName: string, reason: string) => `فشل تحديث الحصة الدورية ${quotaName}: ${reason}`,
    invalidPeriod: (quotaName: string) => `الحصة ${quotaName} منتهية الصلاحية أو فترتها غير صالحة`,
    alreadyExpired: (quotaName: string) => `الحصة ${quotaName} منتهية الصلاحية بالفعل`,
    earmarkExceedsRemaining: (requested: number, available: number) =>
      `حجز ${requested} يتجاوز الحصة المتبقية (${available})`,
    slotConflict: (startTime: string, endTime: string) => `الفترة الزمنية ${startTime}–${endTime} تتعارض مع حجز قائم`,
    onDemandNoCredits: (studentName: string) => `لا توجد أرصدة كافية للحجز الفوري لـ ${studentName}`,
  },
  // ─── Top-level API-facing strings ──────────────────────────────────
  rateLimitExceeded: "طلبات كثيرة جداً. يرجى المحاولة لاحقاً.",
  duplicateRequest: "طلب مكرر. هذه العملية تمت معالجتها بالفعل.",
  internalServerError: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
  insufficientPermissions: "ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.",
  unauthorized: "يجب تسجيل الدخول أولاً.",
  unauthorizedAction: "غير مصرح لك بتنفيذ هذا الإجراء.",
  unauthorizedViewList: "غير مصرح لك بعرض هذه القائمة.",
  unauthorizedSearch: "غير مصرح لك بالبحث.",
  unauthorizedViewMetrics: "غير مصرح لك بعرض المقاييس.",
  notFound: "المورد المطلوب غير موجود.",
  unknownName: "غير معروف",
  invalidInput: "إدخال غير صالح.",
  invalidNationalId: "الرقم القومي غير صالح للجنسية المحددة.",
  permissionGroupNotFound: "مجموعة الأذونات غير موجودة.",

  // ─── Lesson Report errors ─────────────────────────────────────────
  rejectedReportsRequireReason: "يجب أن تتضمن التقارير المرفوضة سبب الرفض.",
  approvedReportsNoRejectionReason: "لا يجب أن تتضمن التقارير المعتمدة سبب رفض.",

  // ─── FX Display Currency messages (used by buildFxDisplayMessages) ────
  displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `عرض العملة غير محدد. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `عرض العملة قديم. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `عملات عرض مختلطة. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,

  // ─── Flattened error properties for backward compatibility ───────────
  categoryNotFound: (id: string) => `الفئة غير موجودة: ${id}`,
  categoryCreateFailed: "فشل إنشاء فئة الحصة.",
  categoryHasSubjects: "لا يمكن حذف الفئة لأن لديها مواد مرتبطة بها.",
  meetingProviderNotFound: (id: string) => `موفر الاجتماعات غير موجود: ${id}`,
  meetingProviderCreateFailed: "فشل إنشاء موفر الاجتماعات.",
  meetingProviderUpdateFailed: "فشل تحديث موفر الاجتماعات.",
  meetingProviderInUse: "موفر الاجتماعات قيد الاستخدام ولا يمكن حذفه.",
  meetingProviderInactive: "موفر الاجتماعات غير نشط.",
  meetingConfigNotFound: (id: string) => `تكوين الاجتماع غير موجود: ${id}`,
  meetingConfigCreateFailed: "فشل إنشاء تكوين الاجتماع.",
  meetingConfigUpdateFailed: "فشل تحديث تكوين الاجتماع.",
  studentNotFound: (id: string) => `الطالب غير موجود: ${id}`,
  studentCreateFailed: "فشل في إنشاء الطالب.",
  studentUpdateFailed: (id: string) => `فشل في تحديث الطالب (المعرف: ${id}).`,
  studentVersionMismatch: ({
    id,
    expectedVersion,
    gotVersion,
  }: {
    id: string;
    expectedVersion: number;
    gotVersion: number;
  }) => `عدم تطابق في إصدار الطالب ${id}: المتوقع ${expectedVersion}، الفعلي ${gotVersion}.`,
  insufficientClasses: ({ id, remaining, required }: { id: string; remaining: number; required: number }) =>
    `رصيد الحصص غير كافٍ للطالب ${id}: متبقٍ ${remaining}، مطلوب ${required}.`,
  invalidStatusTransition: ({ currentStatus, newStatus }: { currentStatus: string; newStatus: string }) =>
    `انتقال حالة غير صالح: ${currentStatus} -> ${newStatus}.`,
  studentEmailRequired: "بريد الطالب الإلكتروني مطلوب.",
  studentPasswordRequired: "كلمة مرور الطالب مطلوبة.",
  teacherNotFound: (id: string) => `المعلم غير موجود: ${id}`,
  staffProfileNotFound: "ملف الموظف غير موجود.",
  quotaMustBeNonNegative: "الحصة يجب أن تكون رقمًا غير سالب.",
  quotaExceedsTotal: ({ requested, total }: { requested: number; total: number }) =>
    `الحصة (${requested}) تتجاوز الإجمالي (${total}).`,
  userNotFound: (id: string) => `المستخدم غير موجود: ${id}`,
  userEmailExists: "مستخدم بهذا البريد الإلكتروني موجود بالفعل.",
  cannotModifyBankingFields: "لا يمكن تعديل الحقول المصرفية.",
  parentNotFound: "ولي الأمر غير موجود.",
  parentAlreadyDeactivated: "حساب ولي الأمر معطل بالفعل.",
  parentAlreadyActivated: "حساب ولي الأمر مفعّل بالفعل.",
  exchangeRateStale: ({ fromCurrency, toCurrency }: { fromCurrency: string; toCurrency: string }) =>
    `سعر الصرف لـ ${fromCurrency} إلى ${toCurrency} قديم (أقدم من 24 ساعة)`,
  cannotRescheduleToSelf: "لا يمكن إعادة الجدولة للذات.",
  cannotRescheduleCompleted: "لا يمكن إعادة جدولة جلسة مكتملة.",
  cannotRescheduleAlreadyRescheduled: "لا يمكن إعادة جدولة جلسة تم إعادة جدولتها بالفعل.",
  outOfQuota: "نفدت الحصة.",
  quotaExpired: "انتهت صلاحية الحصة.",
  quotaNotFound: "الحصة غير موجودة.",
  invalidQuotaState: "حالة الحصة غير صالحة.",
  leaveQuotaExceeded: ({ maxLeaves }: { maxLeaves: string }) =>
    `تم تجاوز حصة الإجازة: الحد الأقصى ${maxLeaves} إجازات مسموح بها.`,
  classInstanceNotFound: ({ id }: { id: string }) => `مثيل الفصل غير موجود: ${id}`,
  originalClassNotFound: "الفصل الأصلي غير موجود.",
  invalidTransition: "انتقال غير صالح.",
  teacherNotAssigned: ({
    teacherId,
    studentId,
    startTime,
  }: {
    teacherId: string;
    studentId: string;
    startTime: string;
  }) => `المعلم ${teacherId} غير معين للطالب ${studentId} في ${startTime}.`,
  teacherBooked: "المعلم محجوز بالفعل في هذا الوقت.",
  studentBooked: "الطالب محجوز بالفعل في هذا الوقت.",
  meetingUrlInUse: "رابط الاجتماع مستخدم بالفعل.",
  sessionNotActivated: "الجلسة غير مفعلة.",
  outsideAvailability: "الحجز خارج نوافذ توفر المعلم.",
  teacherUnavailabilityConflict: "الحجز محظور بسبب نمط عدم التفرغ المتكرر.",
  teacherOnVacation: "الحجز محظور بسبب إجازة معتمدة.",
  resourceNotFound: "مورد التعلم غير موجود.",
  currencyInUse:
    "لا يمكن إلغاء تفعيل هذه العملة لأنها مستخدمة حالياً في الفواتير أو المدفوعات أو أسعار الصرف أو ملفات المستخدمين.",

  // ─── Cron errors ──────────────────────────────────────────────────
  invalidRunStatus: (status: string, runId: string) =>
    `لا يمكن إعادة محاولة تشغيل بحالة ${status} (معرف التشغيل: ${runId}).`,

  // ─── Communication / suggestion / complaint errors ─────────────────────
  complaintNotFound: "الشكوى غير موجودة.",
  suggestionNotFound: "الاقتراح غير موجود.",
  complaintTooManyFiles: (maxFiles: number) => `يمكنك رفع ${maxFiles} ملفات كحد أقصى لكل شكوى.`,
  complaintFileTooLarge: (maxSizeMb: number) => `يجب ألا يتجاوز حجم الملف ${maxSizeMb} ميجابايت.`,
  suggestionCannotMarkSelfAsDuplicate: "لا يمكن وضع علامة على الاقتراح كنسخة مكررة من نفسه.",
  suggestionCircularDuplicate: "لا يمكن إنشاء سلسلة نسخ مكررة دائرية.",
  suggestionTargetIsAlreadyDuplicate: "الاقتراح الهدف مُعلَّم بالفعل كنسخة مكررة لاقتراح آخر.",

  // ─── Communication dispatch errors ──────────────────────────────────────
  unknownCommunicationChannel: (channel: string) => `قناة تواصل غير معروفة: ${channel}`,
  unknownError: "حدث خطأ غير معروف.",
  unknownDispatchError: "حدث خطأ غير معروف أثناء الإرسال.",
  whatsappTemplateMissing: "تكوين قالب واتساب مفقود لهذا الإشعار.",

  // ─── WhatsApp account management errors ─────────────────────────────────
  whatsappAccountNotFound: (id: string) => `حساب واتساب غير موجود: ${id}`,
  whatsappAccessTokenNotConfigured: "رمز الوصول لواتساب غير مُهيأ.",
  whatsappWabaIdNotConfigured: "معرف حساب واتساب التجاري غير مُهيأ.",

  // ─── Delivery failure messages ───────────────────────────────────────────
  emailChannelLabel: "البريد الإلكتروني",
  smsChannelLabel: "رسائل SMS",
  pushChannelLabel: "إشعارات الدفع",
  whatsappChannelLabel: "واتساب",
  onAppChannelLabel: "داخل التطبيق",
  deliveryFailed: (channelLabel: string) => `فشل تسليم ${channelLabel}. يرجى المحاولة مرة أخرى لاحقاً.`,

  // Quota errors accessible via quota.* — see QuotaErrors

  // ─── Offline resolver / notification fallbacks ──────────────────────
  studentNameFallback: "طالب",
};
