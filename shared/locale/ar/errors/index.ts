import type { ErrorsLabels } from "@/shared/locale/types/errors";

const student = {
  studentNotFound: (id: string) => `الطالب غير موجود: ${id}`,
  studentCreateFailed: "فشل إنشاء الطالب.",
  studentUpdateFailed: (id: string) => `فشل تحديث الطالب (المعرّف: ${id}).`,
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
  upsertFailed: "فشل عملية إدراج/تحديث الطالب.",
} as const;

const category = {
  categoryNotFound: (id: string) => `الفئة غير موجودة: ${id}`,
  categoryCreateFailed: "فشل إنشاء فئة الحصة.",
  categoryHasSubjects: "لا يمكن حذف الفئة لأن لديها مواد مرتبطة بها.",
} as const;

const user = {
  userNotFound: (id: string) => `المستخدم غير موجود: ${id}`,
  userEmailExists: "مستخدم بهذا البريد الإلكتروني موجود بالفعل.",
  cannotModifyBankingFields: "لا يمكن تعديل الحقول المصرفية.",
  parentNotFound: "ولي الأمر غير موجود.",
  userCreateFailed: (email: string) => `فشل إنشاء مستخدم بالبريد الإلكتروني: ${email}`,
} as const;

const scheduling = {
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
  absentTooEarly: ({ waitingMinutes }: { waitingMinutes: string }) =>
    `لا يمكن وضع علامة الغياب بعد. يرجى الانتظار ${waitingMinutes} دقيقة بعد وقت البدء المجدول.`,
  vacationStartBeforeEnd: "يجب أن يكون تاريخ بداية الإجازة قبل تاريخ النهاية",
  startTimeBeforeEndTime: "يجب أن يكون وقت البداية قبل وقت النهاية",
  dateRangeExceedsMax: (maxDays: number) => `لا يمكن أن يتجاوز نطاق التاريخ ${maxDays} يومًا`,
  vacationRequestNotPending: (id: string) => `طلب الإجازة ${id} ليس في حالة الانتظار`,
  vacationRequestAlreadyCancelled: (id: string) => `طلب الإجازة ${id} تم إلغاؤه بالفعل`,
  recurringClassDaysRequired: () => "يوم واحد على الأقل مطلوب.",
  invalidDuration: () => "يجب أن تكون المدة أكبر من صفر.",
  subjectRequired: () => "المادة مطلوبة.",
} as const;

const permissionGroup = {
  permissionGroupNotFound: "مجموعة الأذونات غير موجودة.",
} as const;

const teacher = {
  alreadyExists: "ملف المعلم لهذا المستخدم موجود بالفعل.",
  teacherNotFound: (id: string) => `المعلم غير موجود: ${id}`,
  staffProfileNotFound: "ملف الموظف غير موجود.",
  quotaMustBeNonNegative: "الحصة يجب أن تكون رقمًا غير سالب.",
  quotaExceedsTotal: ({ requested, total }: { requested: number; total: number }) =>
    `الحصة (${requested}) تتجاوز الإجمالي (${total}).`,
  vacationRequestNotFound: (id: string) => `طلب الإجازة غير موجود: ${id}`,
  createFailed: "فشل إنشاء ملف المعلم.",
  upsertFailed: "فشل عملية إدراج/تحديث المعلم.",
  noteNotFound: (id: string) => `الملاحظة غير موجودة: ${id}`,
  noteCreateFailed: "فشل إنشاء ملاحظة المعلم.",
  staffProfileCreateFailed: "فشل إنشاء ملف الموظف.",
  staffProfileUpdateFailed: "فشل تحديث ملف الموظف.",
  availabilityUpdateFailed: "فشل تحديث نافذة التوفر.",
  availabilityInsertFailed: "فشل إدراج نافذة التوفر.",
  recurringUnavailabilityInsertFailed: "فشل إدراج عدم التوفر المتكرر.",
  vacationInsertFailed: "فشل إدراج طلب الإجازة.",
} as const;

const teacherDue = {
  hoursMustBePositive: "يجب أن تكون الساعات أكبر من 0.",
  amountMustBeNonNegative: "المبلغ يجب أن يكون غير سالب.",
  insertFailed: "فشل إدراج صف مستحقات المعلم.",
} as const;

const payroll = {
  notTerminal: "لا يمكن احتساب الراتب إلا للجلسات في حالة نهائية.",
  alreadyPaid: "تم صرف الراتب؛ لا يمكن التجاوز.",
  awaitingSettlement: "الراتب قيد التسوية ولا يمكن تجاوزه دون تفعيل التجاوز الإجباري.",
  invalidTargetStatus: "حالة التجاوز المستهدفة غير صالحة.",
  partialRequiresPercentage: "يتطلب التجاوز الجزئي تحديد نسبة بين 0 و100.",
} as const;

const carryover = {
  notFound: (id: string) => `رصيد الترحيل غير موجود: ${id}`,
  noInstances: "حدد جلسة واحدة على الأقل للترحيل.",
  sessionNotAudited: "واحدة أو أكثر من الجلسات غير مدققة.",
  sessionAlreadyLinked: "واحدة أو أكثر من الجلسات مرتبطة بالفعل برصيد ترحيل.",
  fxRateMissing: "سعر الصرف مفقود للتجميع متعدد العملات.",
  paymentDateRequired: "تاريخ الدفع مطلوب.",
  expenseDateInvalid: "يجب أن يكون تاريخ المصروف بصيغة YYYY-MM.",
  noCarryovers: "حدد رصيد ترحيل واحدًا على الأقل.",
  alreadyPaid: "واحد أو أكثر من أرصدة الترحيل مدفوعة بالفعل.",
  notPaid: "رصيد الترحيل غير مدفوع.",
  paidCannotDelete: "لا يمكن حذف رصيد ترحيل مدفوع. ألغِ الدفع أولاً.",
  paidCannotEdit: "لا يمكن تعديل رصيد ترحيل مدفوع. ألغِ الدفع أولاً.",
  teacherImmutable: "لا يمكن تغيير معلم رصيد الترحيل؛ احذف السجل وأعد إنشاءه بدلاً من ذلك.",
  toExpenseFailed: "فشل تحويل رصيد الترحيل إلى مصروف.",
} as const;

const expenses = {
  notFound: "المصروف غير موجود.",
  alreadyDeleted: "المصروف محذوف بالفعل.",
  deleteViaUnpay: "يجب حذف مصروف الراتب هذا عبر تدفق إلغاء دفع الترحيل.",
  typeImmutableForSalaries: "النوع للقراءة فقط لمصروفات الرواتب.",
  valueImmutableForSalaries: "القيمة للقراءة فقط لمصروفات الرواتب.",
  salariesViaCarryoverOnly: "تُنشأ مصروفات الرواتب عبر تدفق تسوية الترحيل.",
  titleRequired: "العنوان مطلوب.",
  valueRequired: "قيمة المصروف مطلوبة.",
  valueInvalid: "يجب أن تكون قيمة المصروف مبلغًا صالحًا غير سالب.",
  valueNegative: "لا يمكن أن تكون قيمة المصروف سالبة.",
  currencyRequired: "العملة مطلوبة.",
  paymentDateInvalid: "يجب أن يكون تاريخ الدفع تاريخًا صالحًا بصيغة YYYY-MM-DD.",
  expenseDateInvalid: "يجب أن يكون شهر المصروف بصيغة YYYY-MM.",
  createFailed: "فشل حفظ سجل المصروف.",
} as const;

const classSubject = {
  createFailed: "فشل إنشاء مادة الفصل.",
  notFound: (id: string) => `المادة غير موجودة: ${id}`,
} as const;

const leaveQuota = {
  updateFailed: "فشل تحديث حصة الإجازة.",
  insertFailed: "فشل إدراج حصة الإجازة.",
} as const;

const classInstance = {
  idempotencyKeyRequired: "تتطلب عملية إدراج/تحديث مثيل الفصل مفتاح idempotency.",
} as const;

export const errorsAr: ErrorsLabels = {
  auth: {
    // ─── No-param strings ────────────────────────────────────────────
    invalidRoleTab: "علامة التبويب المحددة للدور غير صالحة.",
    passwordMinLength: "يجب أن تكون كلمة المرور 12 حرفاً على الأقل.",
    passwordWeakComplexity: "يجب أن تحتوي كلمة المرور على فئتين على الأقل من: أحرف صغيرة، أحرف كبيرة، أرقام، رموز",
    passwordRequiresUppercase: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل.",
    passwordRequiresLowercase: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل.",
    passwordRequiresDigit: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.",
    passwordRequiresSpecialChar: "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (!@#$%^&*()_+-=[]{}|;:',.<>?/).",
    tooManyLoginAttempts: "عدد محاولات تسجيل الدخول كثير جداً. يرجى المحاولة لاحقاً.",
    serviceUnavailable: "خدمة المصادقة غير متاحة مؤقتاً",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    currentPasswordInvalid: "كلمة المرور الحالية غير صحيحة.",
    passwordsDoNotMatch: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين.",
    accountDeactivated: "تم إلغاء تفعيل هذا الحساب. يرجى التواصل مع الدعم.",
    accountLocked: "عدد محاولات تسجيل الدخول كثير جداً. تم قفل حسابك مؤقتاً.",
    demoLoginNotEnabled: "تسجيل الدخول التجريبي غير مفعل",
    demoLoginFailed: "فشل تسجيل الدخول التجريبي",
    impersonationNotAllowed: "غير مسموح لك بانتحال هوية المستخدمين",
    cannotImpersonateSelf: "لا يمكنك انتحال هويتك",
    cannotImpersonateSuperAdmin: "لا يمكنك انتحال هوية مدير نظام آخر",
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
    permissionGroupNameTooLong: "اسم المجموعة طويل جداً (255 حرفاً كحد أقصى).",
    permissionGroupInvalidName: "اسم المجموعة غير صالح.",
    cannotModifySuperAdmin: "لا يمكن تعديل مستخدم مدير النظام.",
    cannotModifySelf: "لا يمكن تعديل صلاحياتك الخاصة.",
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
    invalidParentId: "معرّف ولي الأمر غير صالح.",
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
    quotaReleaseReservationFailed: "فشل تحرير حجز الحصة: الحصص المحجوزة غير كافية",
    quotaReleaseConcurrentModification: "فشل تحرير الحصة: لم تعد الحصة نشطة بعد تعديل متزامن",
    quotaRefreshConcurrentWrite: "فشل تحديث الحصة بسبب تعديل متزامن",
    quotaResetConcurrentModification: "فشل إعادة تعيين فترة الحصة بسبب تعديل متزامن",
    paymentMethodCreateFailed: "فشل إنشاء طريقة دفع المستخدم.",
    paymentMethodNotFound: (id: string) => `طريقة الدفع غير موجودة (المعرّف: ${id}).`,
    currencyHedgeCreateFailed: "فشل إنشاء تحوّط العملة.",
    fxRefreshRateLimitExceeded: "تم تجاوز حد تحديث أسعار صرف العملات. يرجى المحاولة مرة أخرى لاحقاً.",
  },
  credit: {
    duplicatePurchase: "تمت معالجة عملية شراء الرصيد هذه بالفعل.",
    insufficientBalance: ({ studentId, remaining }: { studentId: string; remaining: number }) =>
      `رصيد الطالب ${studentId} غير كافٍ. المتبقي: ${remaining}`,
    invalidInput: "إدخال غير صالح.",
    insufficientHours: ({
      studentId,
      remaining,
      required,
    }: {
      studentId: string;
      remaining: number;
      required: number;
    }) => `ساعات معتمدة غير كافية للطالب ${studentId}. المتبقي: ${remaining}، المطلوب: ${required}`,
  },
  package: {
    codenameAlreadyExists: (codename: string) => `توجد باقة بالاسم المميز "${codename}" بالفعل.`,
    invalidInput: "إدخال الباقة غير صالح.",
    planArchived: (id: string) => `الباقة ${id} مؤرشفة.`,
  },
  file: {
    recordNotFound: ({ tableName, entityId }: { tableName: string; entityId: string }) =>
      `${tableName} غير موجود: ${entityId}`,
    invalidFileType:
      "نوع الملف غير صالح. يُسمح فقط بملفات PDF و JPG و PNG و GIF و WebP و BMP و DOC و DOCX و XLS و XLSX و PPT و PPTX.",
    invalidFileId: "معرّف الملف غير صالح.",
    invoicePaymentProofPending: "يوجد إثبات دفع قيد المراجعة بالفعل لهذه الفاتورة.",
    fileUsageRegistered: "تم تسجيل استخدام الملف بنجاح",
    fileUsageRegisterFailed: (error: string) => `فشل تسجيل استخدام الملف: ${error}`,
    fileUsageRegisterFailedGeneric: "فشل تسجيل استخدام الملف.",
    fileCurrentlyInUse: "الملف قيد الاستخدام حاليًا",
    unableToCheckFileUsage: "تعذر التحقق من استخدام الملف",
    directoryNotFound: "الدليل غير موجود",
    directoryPermissionsUpdated: "تم تحديث أذونات الدليل بنجاح",
    directoryPermissionsUpdateFailed: "فشل تحديث أذونات الدليل",
    permissionsUpdateFailed: (error: string) => `فشل تحديث الأذونات: ${error}`,
    permissionsUpdateFailedGeneric: "فشل تحديث الأذونات.",
    fileProtectionUpdated: "تم تحديث حماية الملف بنجاح",
    fileProtectionUpdateFailed: "فشل تحديث حماية الملف",
    directoryProtectionUpdated: "تم تحديث حماية الدليل بنجاح",
    directoryProtectionUpdateFailed: "فشل تحديث حماية الدليل",
    fileOrDirectoryNotFound: "الملف أو الدليل غير موجود",
    protectionUpdateFailed: (error: string) => `فشل تعيين الحماية: ${error}`,
    protectionUpdateFailedGeneric: "فشل تعيين الحماية.",
    sha256HashMismatch: "عدم تطابق في بصمة SHA-256",
    invalidUploadRequestBody: "نص طلب الرفع غير صالح",
    forbidden: "ممنوع",
    uploadsNotAllowedInDirectory: "الرفع غير مسموح في هذا الدليل",
    fileSizeExceedsMaximum: (maxSizeMb: number) => `حجم الملف يتجاوز الحد الأقصى المسموح (${maxSizeMb} ميجابايت)`,
    contentTypeRequired: "نوع المحتوى مطلوب",
    contentTypeMismatch: (expected: string) => `عدم تطابق في نوع المحتوى. المتوقع: ${expected}`,
    contentLengthRequired: "رأس Content-Length مطلوب",
    contentLengthExceedsSize: (size: string) => `يتجاوز Content-Length الحجم المعلن وهو ${size} بايت`,
    contentMd5Required: "رأس Content-MD5 مطلوب",
    contentMd5Mismatch: "عدم تطابق في Content-MD5",
    failedToCreateFileRecord: "فشل في إنشاء سجل الملف",
    invalidOrExpiredToken: "رمز غير صالح أو منتهي الصلاحية أو مستخدم بالفعل",
    invalidFilePath: "مسار الملف غير صالح",
    requestBodyRequired: "نص الطلب مطلوب",
    failedToWriteFile: "فشل في كتابة الملف",
    filePathRequired: "مسار الملف مطلوب",
    fileNotFound: "الملف غير موجود",
    authenticationRequired: "المصادقة مطلوبة",
    missingPathname: "مسار الملف مفقود في طلب الرفع",
    missingUploadSessionId: "معرّف جلسة الرفع مفقود",
    invalidFileSize: "حجم الملف غير صالح في طلب الرفع",
    missingContentType: "نوع المحتوى مفقود في طلب الرفع",
    invalidUploadSession: "جلسة الرفع غير صالحة",
    uploadSessionAlreadyUsed: "جلسة الرفع مستخدمة بالفعل",
    uploadSessionExpired: "جلسة الرفع منتهية الصلاحية",
    filePathMismatch: "عدم تطابق في مسار الملف",
    fileDeletedSuccessfully: "تم حذف الملف بنجاح",
    failedToDeleteFile: (error: string) => `فشل حذف الملف: ${error}`,
    itemProtectedFromDeletion: "العنصر محمي من الحذف",
    fileProtectedFromDeletion: "الملف محمي من الحذف",
    deletionNotAllowedInParentDirectory: "الحذف غير مسموح في الدليل الأصل",
    deletionNotAllowedInParentDirectoryWithPath: (path: string) => `الحذف غير مسموح في الدليل الأصل: ${path}`,
    fileDeletionNotAllowedInDirectory: "حذف الملف غير مسموح في هذا الدليل",
    sourcePathNotFound: "مسار المصدر غير موجود",
    uploadsNotAllowedToDestination: "الرفع غير مسموح إلى الدليل الوجهة",
    allItemsProcessedSuccessfully: (operationName: string) => `تمت معالجة جميع العناصر ${operationName} بنجاح`,
    itemsProcessedWithFailures: (successCount: number, failureCount: number, operationName: string) =>
      `تمت معالجة ${successCount} عناصر ${operationName}، فشل ${failureCount}`,
    creatingSubdirectoriesNotAllowed: "إنشاء الأدلة الفرعية غير مسموح في الدليل الأصل",
    folderCreatedSuccessfully: "تم إنشاء المجلد بنجاح",
    failedToCreateFolder: (error: string) => `فشل إنشاء المجلد: ${error}`,
    fileUploadedSuccessfully: "تم رفع الملف بنجاح",
    failedToUploadFile: (error: string) => `فشل رفع الملف: ${error}`,
    moveNotAllowedFromDirectory: (sourceDir: string) => `النقل غير مسموح من الدليل: ${sourceDir}`,
    fileRenamedSuccessfully: "تمت إعادة تسمية الملف بنجاح",
    failedToRenameFile: (error: string) => `فشل إعادة تسمية الملف: ${error}`,
    fileIsInUse: "الملف قيد الاستخدام",
    itemNotFound: (path: string) => `العنصر غير موجود: ${path}`,
    itemNotFoundInBucket: "العنصر غير موجود في المخزن",
    directoryDoesNotExist: "الدليل غير موجود",
    unknownError: "خطأ غير معروف",
    failedToRetrieveMovedItemInfo: "فشل استرداد معلومات العنصر المنقول",
  },
  meetingProvider: {
    meetingProviderInactive: "موفر الاجتماعات غير نشط.",
    meetingConfigNotFound: (id: string) => `تكوين الاجتماع غير موجود: ${id}`,
    meetingConfigCreateFailed: "فشل إنشاء تكوين الاجتماع.",
    meetingConfigUpdateFailed: "فشل تحديث تكوين الاجتماع.",
    meetingProviderNotFound: (id: string) => `موفر الاجتماعات غير موجود: ${id}`,
    meetingProviderCreateFailed: "فشل إنشاء مزوّد الاجتماعات.",
    meetingProviderUpdateFailed: "فشل تحديث مزوّد الاجتماعات.",
    meetingProviderInUse: "مزوّد الاجتماعات قيد الاستخدام ولا يمكن حذفه.",
    invalidReturnPath: "مسار الإرجاع غير صالح. يجب أن يكون مسار الإرجاع رابطاً نسبياً.",
    missingSubject: "موضوع الانتحال مطلوب لتفويض النطاق الكامل.",
    dwdNotEnabled: "تفويض النطاق الكامل غير مفعّل لحساب الخدمة هذا. اتصل بمسؤول Google Workspace لديك.",
    slugIsRequired: "المعرّف الفريد (slug) مطلوب",
    urlAllowlistIsRequired: "قائمة عناوين URL المسموح بها مطلوبة",
    fieldSchemaIsRequired: "مخطط الحقل (fieldSchema) مطلوب",
    providerIdIsRequired: "معرّف المزوّد (providerId) مطلوب",
    isDefaultIsRequired: "القيمة الافتراضية (isDefault) مطلوبة",
    detailsIsRequired: "التفاصيل (details) مطلوبة",
    channelRateLimited: "تم تجاوز حد الطلبات لمزوّد الاجتماعات. يرجى المحاولة مرة أخرى لاحقاً.",
    channelPermissionDenied: "تم رفض الإذن من قبل مزوّد الاجتماعات.",
    channelProviderUnavailable: "مزوّد الاجتماعات غير متاح حالياً.",
    channelProviderReauthRequired: "مطلوب إعادة المصادقة لمزوّد الاجتماعات.",
    channelUnsupportedProviderKind: "هذا المزوّد لا يدعم إنشاء روابط الاجتماعات تلقائياً.",
    channelInsufficientScopes: "صلاحيات غير كافية لمزوّد الاجتماعات.",
    channelInvalidServiceAccountJson: "تكوين حساب الخدمة غير صالح.",
    channelMissingImpersonationSubject: "موضوع الانتحال لمزوّد الاجتماعات غير مُعدّ.",
    channelNoOrgCredentialsNoUserToken: "لا توجد بيانات اعتماد لمزوّد الاجتماعات.",
    channelNoAppAccessPolicy: "لا توجد سياسة وصول للتطبيق لمزوّد الاجتماعات.",
    channelProviderErrorOccurred: "حدث خطأ في مزوّد الاجتماعات.",
  },
  parent: {
    alreadyExists: "ملف ولي الأمر لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء ملف ولي الأمر.",
    suggestionSubmitFailed: "فشل إرسال الاقتراح.",
    upsertFailed: "فشل حفظ بيانات ولي الأمر.",
  },
  staff: {
    alreadyExists: "ملف الموظف لهذا المستخدم موجود بالفعل.",
  },
  lessonReport: {
    notEligibleForReview: "هذه الحصة غير مؤهلة لمراجعة تقرير الدرس.",
    alreadyExists: "يوجد بالفعل تقرير درس لهذه الحصة.",
    createFailed: "فشل إنشاء تقرير الدرس.",
    notFound: "تقرير الدرس غير موجود.",
    alreadyReviewed: "تمت مراجعة تقرير الدرس هذا بالفعل.",
  },
  resource: {
    bookDeleteFailed: "فشل حذف الكتاب.",
    resourceDeleteFailed: "فشل حذف مورد التعلم.",
    permissionDenied: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    seedCreateFailed: "فشل إنشاء مورد التعلم الأولي.",
    createFailed: "فشل إنشاء مورد التعلم.",
    handbookUploadFailed: "فشل رفع ملف الدليل. يرجى المحاولة مرة أخرى.",
  },
  notification: {
    deliveryNotFound: (id: string) => `تسليم الإشعار غير موجود: ${id}`,
  },
  fx: {
    syncAlreadyRunning: "جاري مزامنة أسعار الصرف. يرجى المحاولة لاحقاً.",
    syncFailed: "فشلت مزامنة أسعار الصرف. يرجى المحاولة لاحقاً.",
  },
  complaint: {
    responseCreateFailed: "فشل إنشاء رد على الشكوى.",
    createFailed: "فشل إنشاء الشكوى.",
  },
  subjectResource: {
    attachFailed: "فشل إرفاق المورد بالمادة.",
    linkNotFound: "رابط المورد غير موجود.",
    notFound: "مورد المادة غير موجود.",
  },
  meetingConfig: {
    requiresInstanceOrSchedule: "يتطلب تكوين اجتماع الحصة معرّف مثيل الحصة أو معرّف الجدولة المتكررة.",
  },
  meeting: {
    providerTokenUpdateFailed: "فشل تحديث رمز موفر الاجتماعات.",
    providerTokenInsertFailed: "فشل إدراج رمز موفر الاجتماعات.",
  },
  session: {
    userIdRequired: "معرّف المستخدم (userId) مطلوب.",
  },
  appearance: {
    saveDraftFailed: "فشل حفظ مسودة المظهر.",
    publishFailed: "فشل نشر إعدادات المظهر.",
    resetFailed: "فشل إعادة تعيين مسودة المظهر.",
    unauthorized: "ليس لديك صلاحية لإدارة مظهر الموقع.",
  },
  serviceOutage: {
    title: "تعذّر الوصول إلى خوادمنا حالياً",
    description: "الخدمة غير متاحة مؤقتاً. عادةً ما يُحل ذلك خلال لحظات — سنحاول تلقائياً، أو يمكنك المحاولة الآن.",
    autoRetryHint: "جارٍ فحص الاتصال تلقائياً…",
    genericTitle: "حدث خطأ ما",
    genericDescription: "حدث خطأ غير متوقع أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.",
    retry: "حاول مرة أخرى",
    retrying: "جارٍ إعادة المحاولة…",
  },
  classSubject,
  leaveQuota,
  classInstance,
  teacher,
  teacherDue,
  payroll,
  carryover,
  expenses,
  student,
  category,
  user,
  scheduling,
  permissionGroup,
  sessionConfig: {
    roleNameRequired: "اسم الدور مطلوب.",
    ttlOutOfRange: "يجب أن تكون مدة الجلسة بين 60 و 2,419,200 ثانية.",
    maxConcurrentOutOfRange: "يجب أن يكون الحد الأقصى للجلسات المتزامنة بين 1 و 50.",
  },
  quota: {
    insufficientRemaining: (requested: number, available: number) => `المتبقي ${available} حصة فقط — طُلب ${requested}`,
    exceedsCreditBalance: (requested: number, available: number) =>
      `الرصيد غير كافٍ. المتاح: ${available}، المطلوب: ${requested}`,
    periodicRefreshFailed: (quotaName: string, reason: string) => `فشل تحديث الحصة الدورية ${quotaName}: ${reason}`,
    invalidPeriod: (quotaName: string) => `الحصة ${quotaName} منتهية الصلاحية أو فترتها غير صالحة`,
    alreadyExpired: (quotaName: string) => `الحصة ${quotaName} منتهية الصلاحية بالفعل`,
    earmarkExceedsRemaining: (requested: number, available: number) =>
      `حجز ${requested} يتجاوز الحصة المتبقية (${available})`,
    slotConflict: (startTime: string, endTime: string) => `الفترة الزمنية ${startTime}–${endTime} تتعارض مع حجز قائم`,
    onDemandNoCredits: (studentName: string) => `لا يوجد رصيد كافٍ للحجز الفوري لـ ${studentName}`,
    cannotRefreshNonPeriodic: "لا يمكن تحديث حصة غير دورية",
    noValidPeriodDays: "الحصة لا تحتوي على أيام صالحة للفترة المحددة",
  },
  // ─── Top-level API-facing strings ──────────────────────────────────
  rateLimitExceeded: "طلبات كثيرة جداً. يرجى المحاولة لاحقاً.",
  duplicateRequest: "طلب مكرر. هذه العملية تمت معالجتها بالفعل.",
  internalServerError: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
  requestTooLarge: "حجم الطلب كبير جداً.",
  insufficientPermissions: "ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.",
  unauthorized: "يجب تسجيل الدخول أولاً.",
  unauthorizedAction: "غير مصرح لك بتنفيذ هذا الإجراء.",
  unauthorizedViewList: "غير مصرح لك بعرض هذه القائمة.",
  unauthorizedSearch: "غير مصرح لك بالبحث.",
  unauthorizedViewMetrics: "غير مصرح لك بعرض المقاييس.",
  notFound: "المورد المطلوب غير موجود.",
  unknownName: "غير معروف",
  invalidInput: "إدخال غير صالح.",
  tooLong: "الإدخال يتجاوز الحد الأقصى المسموح به للطول.",
  invalidNationalId: "الرقم القومي غير صالح للجنسية المحددة.",

  // ─── General user creation errors ──────────────────────────────────
  specializedGroupNotAllowed:
    "لا يمكن تعيين مجموعة متخصصة (طالب أو معلم أو ولي أمر) لمستخدم عام. استخدم مسار الإلحاق المخصص لنوع المستخدم هذا بدلاً من ذلك.",

  // ─── Lesson Report errors ─────────────────────────────────────────
  rejectedReportsRequireReason: "يجب أن تتضمن التقارير المرفوضة سبب الرفض.",
  approvedReportsNoRejectionReason: "لا يجب أن تتضمن التقارير المعتمدة سبب رفض.",

  // ─── FX Display Currency messages (used by buildFxDisplayMessages) ────
  displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `عملة العرض غير محددة. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `عملة العرض غير محدثة. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `تم اكتشاف عملات عرض مختلطة. المبلغ المقفل: ${values.lockedAmount} ${values.lockedCurrency}`,

  // ─── Flattened error properties for backward compatibility ───────────
  // Spread the nested sub-objects to provide flat top-level keys
  // (avoids re-declaring ~30 identical properties; also fixes an ar-string
  // inconsistency where flat and nested student strings differed).
  ...student,
  ...category,
  ...user,
  ...scheduling,
  ...permissionGroup,
  ...teacher,
  meetingProviderNotFound: (id: string) => `مزود الاجتماعات غير موجود: ${id}`,
  meetingProviderCreateFailed: "فشل إنشاء مزود الاجتماعات.",
  meetingProviderUpdateFailed: "فشل تحديث مزود الاجتماعات.",
  meetingProviderInUse: "مزود الاجتماعات قيد الاستخدام ولا يمكن حذفه.",
  meetingProviderInactive: "مزود الاجتماعات غير نشط.",
  meetingConfigNotFound: (id: string) => `تكوين الاجتماع غير موجود: ${id}`,
  meetingConfigCreateFailed: "فشل إنشاء تكوين الاجتماع.",
  meetingConfigUpdateFailed: "فشل تحديث تكوين الاجتماع.",
  parentAlreadyDeactivated: "حساب ولي الأمر معطل بالفعل.",
  parentAlreadyActivated: "حساب ولي الأمر مفعّل بالفعل.",
  exchangeRateStale: ({ fromCurrency, toCurrency }: { fromCurrency: string; toCurrency: string }) =>
    `سعر الصرف من ${fromCurrency} إلى ${toCurrency} قديم (أقدم من 24 ساعة)`,
  quotaExpired: "انتهت صلاحية الحصة.",
  quotaNotFound: "الحصة غير موجودة.",
  invalidQuotaState: "حالة الحصة غير صالحة.",
  outsideAvailability: "الحجز خارج نوافذ توفر المعلم.",
  teacherUnavailabilityConflict: "الحجز محظور بسبب نمط عدم التوفر المتكرر.",
  teacherOnVacation: "الحجز محظور بسبب فترة إجازة معتمدة.",
  resourceNotFound: "مورد التعلم غير موجود.",
  currencyInUse:
    "لا يمكن إلغاء تفعيل هذه العملة لأنها مستخدمة حالياً في الفواتير أو المدفوعات أو أسعار الصرف أو ملفات المستخدمين.",

  // ─── Cron errors ──────────────────────────────────────────────────
  invalidRunStatus: (status: string, runId: string) =>
    `لا يمكن إعادة محاولة تشغيل بحالة ${status} (معرّف التشغيل: ${runId}).`,

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
  whatsappNoSenderForPurpose: "لا يوجد حساب مرسِل واتساب نشط متاح لهذا الإشعار.",

  // ─── WhatsApp account management errors ─────────────────────────────────
  whatsappAccountNotFound: (id: string) => `حساب واتساب غير موجود: ${id}`,
  whatsappAccessTokenNotConfigured: "رمز الوصول لواتساب غير مُهيأ.",
  whatsappWabaIdNotConfigured: "معرّف حساب واتساب التجاري غير مُهيأ.",
  whatsappEmbeddedSignupFailed: "فشل الاتصال بتطبيق واتساب للأعمال. يُرجى المحاولة مرة أخرى.",
  whatsappPurposeRequiresActive: "لا يمكن تعيين الغرض إلا لأرقام واتساب النشطة. فعّل الرقم أولًا.",
  whatsappAccountOffboarded: "تم فصل رقم واتساب هذا بواسطة Meta ولم يعد بإمكانه إرسال الرسائل.",
  whatsappCoexistenceTakenByOtherPartner: "يُدار التواجد المشترك لهذا الرقم بواسطة مزود برمجيات آخر. افصله هناك أولًا.",
  whatsappSyncDeadlineExpired:
    "لم يُكمل تطبيق واتساب للأعمال المزامنة خلال ٢٤ ساعة. أعد تشغيل عملية الربط للمحاولة مرة أخرى.",
  whatsappHistoryDeclined:
    "تم رفض مشاركة سجل المحادثات على الجهاز المقترن. تمت مزامنة جهات الاتصال فقط؛ السجل غير متاح.",
  whatsappWebhookProcessingFailed: "تعذّرت معالجة أحد أحداث webhook من واتساب وتم إيقافه للمراجعة.",
  whatsappPhoneNumberIdNotConfigured: "معرّف رقم الهاتف لواتساب غير مُهيأ.",
  whatsappConnectionTestSucceeded: "تم الاتصال بواجهة WhatsApp Cloud API بنجاح.",
  whatsappConnectionTestFailed: "تعذّر الوصول إلى واجهة WhatsApp Cloud API. تحقق من بيانات الاعتماد وحاول مرة أخرى.",

  // ─── WhatsApp conversations errors ────────────────────────────────────────
  whatsappRecipientNotAllowed:
    "هذا الرقم رقم اختباري من Meta، ولا يمكنه مراسلة سوى المستلمين المعتمدين في لوحة Meta App Dashboard. أضف المستلم وتحقق منه أولًا.",
  whatsappRecipientNotAllowedFromMeta:
    "رفضت Meta المستلم: الرقم غير مدرج في قائمة المسموح لهم للرقم الاختباري. افتح لوحة Meta App Dashboard لاعتماده، ثم حاول مرة أخرى.",
  whatsappOutsideServiceWindow:
    "لا يمكن إرسال ردود نصية حرة إلا خلال ٢٤ ساعة من آخر رسالة وردت من العميل. أرسل رسالة قالب بدلًا من ذلك.",
  whatsappConversationSendFailed: "تعذّر إرسال الرسالة. تحقق من المستلم ومن الاتصال بالشبكة، ثم حاول مرة أخرى.",
  whatsappRecipientLimitReached: "تدعم أرقام Meta الاختبارية خمسة مستلمين كحد أقصى. احذف مستلمًا قبل إضافة آخر.",
  whatsappRecipientConflict: "هذا المستلم مسجّل بالفعل لدى رقم الواتساب هذا.",
  whatsappTemplateRequired: "اختر قالبًا لبدء محادثة خارج نافذة الـ ٢٤ ساعة.",
  whatsappMessageRequired: "أدخل رسالة لإرسالها.",
  whatsappTemplatesFetchFailed: "تعذّر تحميل قوالب الرسائل من Meta. تحقق من رمز الوصول لهذا الرقم، ثم حاول مرة أخرى.",
  whatsappTemplateParamsMismatch:
    "يتطلب هذا القالب متغيرات ({{1}}، {{2}}، …). لا يتوفّر ملء متغيرات القوالب بعد — اختر قالبًا بدون متغيرات.",

  // ─── WhatsApp groups errors (Meta Groups API error codes) ────────────────
  whatsappGroupNotEligible:
    "رقم الواتساب هذا غير مؤهل للمجموعات. تتطلب Meta حساب أعمال رسميًا — اطلب حالة OBA في WhatsApp Manager، ثم حاول مرة أخرى.",
  whatsappGroupUnknown:
    "لم يعد الوصول إلى هذه المجموعة ممكنًا: قد تكون محذوفة، أو أُزيل الرقم منها. حدّث قائمة المجموعات.",
  whatsappGroupSuspended: "عُلّقت هذه المجموعة بواسطة واتساب لمخالفتها سياسات المنصة.",
  whatsappGroupRateLimitHit: "عمليات مجموعات كثيرة جدًا من هذا الرقم في فترة قصيرة. انتظر قليلًا، ثم حاول مرة أخرى.",
  whatsappGroupCreateLimitReached:
    "تم بلوغ حد المجموعات التي يمكن إنشاؤها بهذا الرقم. احذف المجموعات غير المستخدمة، ثم حاول مرة أخرى.",
  whatsappGroupCreationTemporarilyDisabled:
    "إنشاء المجموعات معطّل مؤقتًا لهذا الرقم بسبب حدود سياسة المراسلة. حاول مرة أخرى لاحقًا.",
  whatsappGroupParticipantNotInGroup: "أحد المشاركين ليس عضوًا في هذه المجموعة.",
  whatsappGroupJoinRequestNotFound: "أحد طلبات الانضمام المحددة لم يعد موجودًا — ربما عولج مسبقًا.",
  whatsappGroupActionFailed: "تعذّر إتمام عملية المجموعة. يرجى المحاولة مرة أخرى.",

  // ─── Delivery failure messages ───────────────────────────────────────────
  emailChannelLabel: "البريد الإلكتروني",
  smsChannelLabel: "رسائل SMS",
  pushChannelLabel: "إشعارات فورية",
  whatsappChannelLabel: "واتساب",
  onAppChannelLabel: "داخل التطبيق",
  deliveryFailed: (channelLabel: string) => `فشل تسليم ${channelLabel}. يرجى المحاولة مرة أخرى لاحقاً.`,

  // Quota errors accessible via quota.* — see QuotaErrors

  // ─── Offline resolver / notification fallbacks ──────────────────────
  studentNameFallback: "طالب",

  // ─── Data-integrity guards (developer-facing) ────────────────────
  invalidIdentifierKind: (value: string) => `صف حساب غير صالح: identifierKind غير مدعوم '${value}'`,
  invalidSupportedDirections: (value: string) => `صف حساب غير صالح: supportedDirections غير مدعوم '${value}'`,

  // ─── Permission override validation errors ──────────────────────
  invalidOverrideState: "قيمة حالة تجاوز الصلاحية غير صالحة.",

  // ─── Storage bulk operation errors ──────────────────────────────
  bulkOperationLimitExceeded: (operation: string, limit: number) =>
    `عملية ${operation} الجماعية محدودة بحد أقصى ${limit} عنصرًا`,

  // ─── API route errors ─────────────────────────────────────────────
  forbidden: "محظور",
  noPdfAvailable: "لا يتوفر ملف PDF لهذه الفاتورة",
  invoiceNotFoundShort: "الفاتورة غير موجودة",
  invalidLocale: "اللغة غير صالحة",
  invalidOrigin: "المصدر غير صالح",
  failedToSetLocale: "فشل تعيين اللغة",
  fxRefreshFailed: "فشل تحديث أسعار الصرف",
  deletedExpiredSignedUrls: (count: number) => `تم حذف ${count} رابطًا موقّعًا منتهي الصلاحية`,
  invalidRequestFormat: "تنسيق الطلب غير صالح. المتوقع { logs: LogEntry[] }",
  missingRequiredFields: "حقول مطلوبة مفقودة في إدخال السجل",
  invalidSessionId: "معرّف الجلسة غير صالح في إدخال السجل",
  failedToWriteLogs: "فشلت كتابة السجلات",
  missingCodeOrState: "معامل code أو state مفقود",
  invalidOrExpiredOAuthState: "حالة OAuth غير صالحة أو منتهية الصلاحية",
  providerMismatch: "عدم تطابق المزوّد في حالة OAuth",
  failedToCompleteOAuthTokenExchange: "فشل إتمام تبادل رمز OAuth",
  invalidEventType: "نوع الحدث غير صالح",
};
