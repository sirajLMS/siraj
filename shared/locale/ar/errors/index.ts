import type { ErrorsLabels } from "@/shared/locale/types/errors";

export const errors: ErrorsLabels = {
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
  },
  teacher: {
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
  },
  permissionGroup: {
    permissionGroupNotFound: "مجموعة الأذونات غير موجودة.",
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
  permissionGroupNotFound: "مجموعة الأذونات غير موجودة.",

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
};
