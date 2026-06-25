### Task L — i18n: Add Missing Translation Keys

**Objective:**
Add missing translation keys for complaint categories, backend error messages, and notification titles in English and Arabic. All new keys must be added to the type interfaces first, then English translations in the monolithic `en.ts`, and Arabic translations in the existing split files under `shared/messages/ar/`.

---

**Dependencies:**
Task K (views reference the new keys).

---

**Layer-Specific Rules:**

Read `frontend/AGENTS.md` before starting.

1. **i18n Localization:** Uses `shared/messages/en.ts` and `shared/messages/ar/` directories. DO NOT create `frontend/locales/` or `backend/locales/` directories.
2. **English translations:** Keep in monolithic `shared/messages/en.ts` (user confirmed — no split files for English).
3. **Arabic translations:** Use existing split files under `shared/messages/ar/` directory structure.
4. **Type interfaces:** Update existing type interfaces in `shared/messages/types/` — do NOT create new type files unless a new domain is introduced.
5. **No hardcoded errors/messages in services** — use `getBackendTranslations` for backend error messages.
6. **No `console` methods** — ESLint will error. Use `logger` utility if logging is needed.

---

**Target Files:**

1. `shared/messages/types/dashboard/complaints/main.ts` — Add `categoryLabels` to `ComplaintsParentLabels` and `ComplaintsAdminLabels`
2. `shared/messages/types/errors.ts` — Add 8 new error message keys to `ErrorsLabels`
3. `shared/messages/types/dashboard/core/notifications.ts` — Add 2 notification type keys to `NotificationsLabels`
4. `shared/messages/en.ts` — Add English translations: category labels, error messages, notification keys
5. `shared/messages/ar/dashboard/complaints/main.ts` — Add Arabic translations: category labels
6. `shared/messages/ar/errors.ts` — Add Arabic translations: error messages
7. `shared/messages/ar/dashboard/core/notifications.ts` — Add Arabic translations: notification keys

---

### Detailed Implementation Steps

#### Step 1: Add `categoryLabels` to `ComplaintsParentLabels` Interface

Open `shared/messages/types/dashboard/complaints/main.ts`.

Locate the `ComplaintsParentLabels` interface. After the existing `statusLabels` property on line 27:

```typescript
  readonly statusLabels: Record<"pending" | "resolved", string>;
```

Add the `categoryLabels` property:

```typescript
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
```

The full `ComplaintsParentLabels` interface after the edit:

```typescript
export interface ComplaintsParentLabels {
  readonly pageTitle: string;
  readonly formTitle: string;
  readonly student: string;
  readonly contactEmail: string;
  readonly contactEmailPlaceholder: string;
  readonly complaintDetails: string;
  readonly complaintDetailsPlaceholder: string;
  readonly submit: string;
  readonly successMessage: string;
  readonly policyTitle: string;
  readonly policyBody: string;
  readonly recordTitle: string;
  readonly totalRecords: string;
  readonly loadOlder: string;
  readonly waitingMessage: string;
  readonly adminResponse: string;
  readonly regarding: string;
  readonly validation: ComplaintValidationLabels;
  readonly statusLabels: Record<"pending" | "resolved", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}
```

---

#### Step 2: Add `categoryLabels` to `ComplaintsAdminLabels` Interface

In the same file `shared/messages/types/dashboard/complaints/main.ts`, locate the `ComplaintsAdminLabels` interface. After the existing `priorityLabels` property on line 53:

```typescript
  readonly priorityLabels: Record<"urgent" | "general", string>;
```

Add the `categoryLabels` property:

```typescript
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
```

The full `ComplaintsAdminLabels` interface after the edit:

```typescript
export interface ComplaintsAdminLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly unanswered: string;
    readonly answered: string;
    readonly avgResolution: string;
    readonly efficiencyNote: string;
  };
  readonly tabs: {
    readonly unanswered: string;
    readonly answered: string;
  };
  readonly searchPlaceholder: string;
  readonly queue: {
    readonly received: string;
    readonly yourResponse: string;
    readonly responsePlaceholder: string;
    readonly answer: string;
    readonly answerAndEmail: string;
    readonly adminResponse: string;
    readonly noEntries: string;
  };
  readonly priorityLabels: Record<"urgent" | "general", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}
```

The full file `shared/messages/types/dashboard/complaints/main.ts` after both edits:

```typescript
export interface ComplaintValidationLabels {
  readonly studentRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly detailsRequired: string;
}

export interface ComplaintsParentLabels {
  readonly pageTitle: string;
  readonly formTitle: string;
  readonly student: string;
  readonly contactEmail: string;
  readonly contactEmailPlaceholder: string;
  readonly complaintDetails: string;
  readonly complaintDetailsPlaceholder: string;
  readonly submit: string;
  readonly successMessage: string;
  readonly policyTitle: string;
  readonly policyBody: string;
  readonly recordTitle: string;
  readonly totalRecords: string;
  readonly loadOlder: string;
  readonly waitingMessage: string;
  readonly adminResponse: string;
  readonly regarding: string;
  readonly validation: ComplaintValidationLabels;
  readonly statusLabels: Record<"pending" | "resolved", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}

export interface ComplaintsAdminLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly unanswered: string;
    readonly answered: string;
    readonly avgResolution: string;
    readonly efficiencyNote: string;
  };
  readonly tabs: {
    readonly unanswered: string;
    readonly answered: string;
  };
  readonly searchPlaceholder: string;
  readonly queue: {
    readonly received: string;
    readonly yourResponse: string;
    readonly responsePlaceholder: string;
    readonly answer: string;
    readonly answerAndEmail: string;
    readonly adminResponse: string;
    readonly noEntries: string;
  };
  readonly priorityLabels: Record<"urgent" | "general", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}

export interface ComplaintsLabels {
  readonly parent: ComplaintsParentLabels;
  readonly admin: ComplaintsAdminLabels;
}
```

---

#### Step 3: Add 8 New Error Message Keys to `ErrorsLabels` Interface

Open `shared/messages/types/errors.ts`.

Locate the `permission` nested object at the end of the interface (around line 109):

```typescript
  readonly permission: {
    readonly groupNotFound: string;
  };
}
```

Add 8 new error message keys **before** the `teacher` nested object (before line 86). Insert after the existing `insufficientPrivilege` key (line 85):

```typescript
  readonly insufficientPrivilege: string;
  readonly complaintSubmitFailed: string;
  readonly complaintNotFound: string;
  readonly complaintAlreadyAnswered: string;
  readonly complaintResponseFailed: string;
  readonly complaintUnauthorized: string;
  readonly suggestionSubmitFailed: string;
  readonly suggestionNotFound: string;
  readonly suggestionAlreadyReviewed: string;
```

The full `ErrorsLabels` interface after the edit:

```typescript
export interface ErrorsLabels {
  readonly unauthorizedViewMetrics: string;
  readonly unauthorizedViewList: string;
  readonly unauthorized: string;
  readonly unauthorizedAction: string;
  readonly insufficientPermissions: string;
  readonly notFound: string;
  readonly sessionNotActivated: string;
  readonly absentTooEarly: string;
  readonly userNotFound: string;
  readonly userEmailExists: string;
  readonly userCreateFailed: string;
  readonly noExchangeRate: string;
  readonly exchangeRateStale: string;
  readonly invoiceNotFound: string;
  readonly invoiceVersionMismatch: string;
  readonly cannotTransitionFailed: string;
  readonly invalidTransition: string;
  readonly notificationNotFound: string;
  readonly notificationProviderNotFound: string;
  readonly teacherBooked: string;
  readonly studentBooked: string;
  readonly zoomInUse: string;
  readonly classInstanceNotFound: string;
  readonly originalClassNotFound: string;
  readonly cannotRescheduleToSelf: string;
  readonly cannotRescheduleCompleted: string;
  readonly cannotRescheduleAlreadyRescheduled: string;
  readonly userIdRequiredSessionCreate: string;
  readonly userIdRequiredSessionUpdate: string;
  readonly sessionNotFound: string;
  readonly activeRecordNotFound: string;
  readonly recordNotFound: string;
  readonly unsupportedTable: string;
  readonly studentCreateFailed: string;
  readonly studentCreateError: string;
  readonly studentNotFound: string;
  readonly studentUpdateFailed: string;
  readonly bankingDetailsAlreadyVerified: string;
  readonly noActiveBankingDetails: string;
  readonly noVerifiedActiveBankingDetails: string;
  readonly startTimeBeforeEndTime: string;
  readonly vacationStartBeforeEnd: string;
  readonly vacationRequestNotFound: string;
  readonly vacationRequestNotPending: string;
  readonly vacationRequestAlreadyCancelled: string;
  readonly teacherOnVacation: string;
  readonly teacherUnavailabilityConflict: string;
  readonly outsideAvailability: string;
  readonly cannotModifyBankingFields: string;
  readonly cannotModifyHistoricalBanking: string;
  readonly cannotModifyVerifiedBanking: string;
  readonly teacherNotFound: string;
  readonly bankingDetailsNotFound: string;
  readonly teacherNotAssigned: string;
  readonly studentNameLength: string;
  readonly insufficientClasses: string;
  readonly studentVersionMismatch: string;
  readonly cannotVerifyHistoricalBanking: string;
  readonly missedClassTime: string;
  readonly permissionGroupNotFound: string;
  readonly cannotModifySystemPermissionGroup: string;
  readonly cannotDeleteSystemPermissionGroup: string;
  readonly permissionGroupNameRequired: string;
  readonly permissionGroupNameTooLong: string;
  readonly permissionGroupInvalidName: string;
  readonly cannotModifySuperAdmin: string;
  readonly leaveQuotaExceeded: string;
  readonly invalidInput: string;
  readonly parentNotFound: string;
  readonly parentAlreadyDeactivated: string;
  readonly quotaMustBeNonNegative: string;
  readonly quotaExceedsTotal: string;
  readonly invalidFileId: string;
  readonly invalidParentId: string;
  readonly invalidInvoiceAmount: string;
  readonly invoiceAlreadyPaid: string;
  readonly invalidStatusTransition: string;
  readonly staffProfileNotFound: string;
  readonly staffProfileUpdateFailed: string;
  readonly resourceCreateFailed: string;
  readonly resourceNotFound: string;
  readonly resourceDeleteFailed: string;
  readonly permissionDenied: string;
  readonly insufficientPrivilege: string;
  readonly complaintSubmitFailed: string;
  readonly complaintNotFound: string;
  readonly complaintAlreadyAnswered: string;
  readonly complaintResponseFailed: string;
  readonly complaintUnauthorized: string;
  readonly suggestionSubmitFailed: string;
  readonly suggestionNotFound: string;
  readonly suggestionAlreadyReviewed: string;
  readonly teacher: {
    readonly alreadyExists: string;
    readonly invalidTimezone: string;
    readonly createFailed: string;
  };
  readonly parent: {
    readonly alreadyExists: string;
    readonly invalidTimezone: string;
    readonly createFailed: string;
  };
  readonly staff: {
    readonly alreadyExists: string;
    readonly createFailed: string;
  };
  readonly manager: {
    readonly onlySuperAdminCanCreate: string;
  };
  readonly auth: {
    readonly invalidRoleTab: string;
  };
  readonly user: {
    readonly emailAlreadyExists: string;
  };
  readonly permission: {
    readonly groupNotFound: string;
  };
}
```

---

#### Step 4: Add Notification Keys to `NotificationsLabels` Interface

Open `shared/messages/types/dashboard/core/notifications.ts`.

Add 2 new keys after the existing `defaultSystemNotification` property. The full file after the edit:

```typescript
export interface NotificationsLabels {
  readonly title: string;
  readonly noAlerts: string;
  readonly errorLoading: string;
  readonly unpaidInvoicesTitle: string;
  readonly noUnpaidInvoices: string;
  readonly loadingBilling: string;
  readonly newUnansweredComplaint: string;
  readonly defaultSystemNotification: string;
  readonly complaintResponse: string;
  readonly suggestionAcknowledged: string;
}
```

---

#### Step 5: Add English Category Labels to `shared/messages/en.ts`

Open `shared/messages/en.ts`.

**5a.** Locate the `complaints.parent` section (around line 1993). After the existing `statusLabels` block:

```typescript
        statusLabels: {
          pending: "Pending",
          resolved: "Resolved",
        },
```

Add the `categoryLabels` block:

```typescript
        categoryLabels: {
          REGARDING_TEACHER: "Regarding Teacher",
          REGARDING_SYSTEM: "Regarding System",
          OTHER: "Other",
        },
```

The `complaints.parent` section after the edit (showing the tail end):

```typescript
        validation: {
          studentRequired: "Please select a student.",
          emailRequired: "Please enter your contact email.",
          emailInvalid: "Please enter a valid email address.",
          detailsRequired: "Please describe your complaint in at least 10 characters.",
        },
        statusLabels: {
          pending: "Pending",
          resolved: "Resolved",
        },
        categoryLabels: {
          REGARDING_TEACHER: "Regarding Teacher",
          REGARDING_SYSTEM: "Regarding System",
          OTHER: "Other",
        },
      },
```

**5b.** Locate the `complaints.admin` section (around line 2024). After the existing `priorityLabels` block:

```typescript
        priorityLabels: {
          urgent: "Urgent Priority",
          general: "General Inquiry",
        },
```

Add the `categoryLabels` block:

```typescript
        categoryLabels: {
          REGARDING_TEACHER: "Regarding Teacher",
          REGARDING_SYSTEM: "Regarding System",
          OTHER: "Other",
        },
```

The `complaints.admin` section after the edit (showing the tail end):

```typescript
        queue: {
          received: "Received",
          yourResponse: "Your Response",
          responsePlaceholder: "Type your official resolution here...",
          answer: "Answer",
          answerAndEmail: "Answer & Send to Email",
          adminResponse: "Admin Response",
          noEntries: "No complaints match your search",
        },
        priorityLabels: {
          urgent: "Urgent Priority",
          general: "General Inquiry",
        },
        categoryLabels: {
          REGARDING_TEACHER: "Regarding Teacher",
          REGARDING_SYSTEM: "Regarding System",
          OTHER: "Other",
        },
      },
```

---

#### Step 6: Add English Error Messages to `shared/messages/en.ts`

In the same `shared/messages/en.ts` file, locate the `errors` section (starting at line 28). Find the `insufficientPrivilege` key (around line 114):

```typescript
    insufficientPrivilege: "You do not have sufficient privilege to edit administrative accounts.",
```

Add the 8 new error message keys immediately after `insufficientPrivilege` and before the `teacher` nested object:

```typescript
    insufficientPrivilege: "You do not have sufficient privilege to edit administrative accounts.",
    complaintSubmitFailed: "Failed to submit complaint",
    complaintNotFound: "Complaint not found",
    complaintAlreadyAnswered: "This complaint has already been answered",
    complaintResponseFailed: "Failed to submit complaint response",
    complaintUnauthorized: "You are not authorized to perform this action",
    suggestionSubmitFailed: "Failed to submit suggestion",
    suggestionNotFound: "Suggestion not found",
    suggestionAlreadyReviewed: "This suggestion has already been reviewed",
    teacher: {
```

The surrounding context after the edit:

```typescript
    permissionDenied: "You do not have permission to perform this action.",
    insufficientPrivilege: "You do not have sufficient privilege to edit administrative accounts.",
    complaintSubmitFailed: "Failed to submit complaint",
    complaintNotFound: "Complaint not found",
    complaintAlreadyAnswered: "This complaint has already been answered",
    complaintResponseFailed: "Failed to submit complaint response",
    complaintUnauthorized: "You are not authorized to perform this action",
    suggestionSubmitFailed: "Failed to submit suggestion",
    suggestionNotFound: "Suggestion not found",
    suggestionAlreadyReviewed: "This suggestion has already been reviewed",
    teacher: {
      alreadyExists: "A teacher profile for this user already exists.",
      invalidTimezone: "The provided timezone is not valid.",
      createFailed: "Failed to create teacher profile.",
    },
```

---

#### Step 7: Add English Notification Keys to `shared/messages/en.ts`

In the same `shared/messages/en.ts` file, locate the `notifications` section (around line 218). After the existing `defaultSystemNotification` key:

```typescript
      defaultSystemNotification: "System Notification",
```

Add the 2 new notification keys:

```typescript
      complaintResponse: "Your complaint has been answered",
      suggestionAcknowledged: "Your suggestion has been received",
```

The full `notifications` block after the edit:

```typescript
    notifications: {
      title: "Notifications",
      noAlerts: "No alerts at this time.",
      errorLoading: "Failed to load notifications.",
      unpaidInvoicesTitle: "Unpaid Invoices",
      noUnpaidInvoices: "There is no invoices to be paid.",
      loadingBilling: "Loading billing data...",
      newUnansweredComplaint: "New Unanswered Complaint",
      defaultSystemNotification: "System Notification",
      complaintResponse: "Your complaint has been answered",
      suggestionAcknowledged: "Your suggestion has been received",
    },
```

---

#### Step 8: Add Arabic Category Labels to `shared/messages/ar/dashboard/complaints/main.ts`

Open `shared/messages/ar/dashboard/complaints/main.ts`.

**8a.** Locate the `parent` section. After the existing `statusLabels` block:

```typescript
    statusLabels: {
      pending: "معلقة",
      resolved: "تم الحل",
    },
```

Add the `categoryLabels` block:

```typescript
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
```

**8b.** Locate the `admin` section. After the existing `priorityLabels` block:

```typescript
    priorityLabels: {
      urgent: "أولوية عاجلة",
      general: "استفسار عام",
    },
```

Add the `categoryLabels` block:

```typescript
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
```

The full Arabic complaints file after both edits:

```typescript
import type { ComplaintsLabels } from "../../../types/dashboard/complaints";

export const complaints: ComplaintsLabels = {
  parent: {
    pageTitle: "الشكاوى والسجلات",
    formTitle: "تقديم شكوى جديدة",
    student: "اختر الطالب",
    contactEmail: "البريد الإلكتروني للتواصل",
    contactEmailPlaceholder: "parent.contact@example.com",
    complaintDetails: "تفاصيل الشكوى",
    complaintDetailsPlaceholder: "صف مخاوفك بالتفصيل...",
    submit: "إرسال الشكوى",
    successMessage: "تم إرسال شكواك بنجاح.",
    policyTitle: "نظرة عامة على السياسة",
    policyBody:
      "نهدف للرد على جميع شكاوى أولياء الأمور خلال 48 ساعة أكاديمية. يجب الإبلاغ عن الأمور العاجلة مباشرة إلى مكتب الإدارة.",
    recordTitle: "سجل الشكاوى",
    totalRecords: "{count} سجل إجمالي",
    loadOlder: "تحميل السجلات الأقدم",
    waitingMessage: "في انتظار مراجعة الإدارة وتقديم الرد...",
    adminResponse: "رد الإدارة",
    regarding: "بخصوص",
    validation: {
      studentRequired: "يرجى اختيار طالب.",
      emailRequired: "يرجى إدخال بريدك الإلكتروني.",
      emailInvalid: "يرجى إدخال بريد إلكتروني صالح.",
      detailsRequired: "يرجى وصف شكواك في 10 أحرف على الأقل.",
    },
    statusLabels: {
      pending: "معلقة",
      resolved: "تم الحل",
    },
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
  },
  admin: {
    pageTitle: "قائمة معالجة الشكاوى",
    pageSubtitle: "مراجعة والرد على شكاوى المؤسسة.",
    metrics: {
      unanswered: "غير مجاب",
      answered: "تم الرد",
      avgResolution: "متوسط وقت المعالجة",
      efficiencyNote: "تحسن الكفاءة 12%",
    },
    tabs: {
      unanswered: "غير مجاب",
      answered: "تم الرد",
    },
    searchPlaceholder: "البحث في الشكاوى...",
    queue: {
      received: "تاريخ الاستلام",
      yourResponse: "ردك",
      responsePlaceholder: "اكتب الحل الرسمي هنا...",
      answer: "رد",
      answerAndEmail: "رد وإرسال بالبريد",
      adminResponse: "رد الإدارة",
      noEntries: "لا توجد شكاوى مطابقة للبحث",
    },
    priorityLabels: {
      urgent: "أولوية عاجلة",
      general: "استفسار عام",
    },
    categoryLabels: {
      REGARDING_TEACHER: "بخصوص المعلم",
      REGARDING_SYSTEM: "بخصوص النظام",
      OTHER: "أخرى",
    },
  },
};
```

---

#### Step 9: Add Arabic Error Messages to `shared/messages/ar/errors.ts`

Open `shared/messages/ar/errors.ts`.

Locate the `insufficientPrivilege` key (around line 89):

```typescript
  insufficientPrivilege: "ليس لديك صلاحية كافية لتعديل حسابات المسؤولين.",
```

Add the 8 new Arabic error message keys immediately after `insufficientPrivilege` and before the `teacher` nested object:

```typescript
  insufficientPrivilege: "ليس لديك صلاحية كافية لتعديل حسابات المسؤولين.",
  complaintSubmitFailed: "فشل في إرسال الشكوى",
  complaintNotFound: "الشكوى غير موجودة",
  complaintAlreadyAnswered: "تم الرد على هذه الشكوى بالفعل",
  complaintResponseFailed: "فشل في إرسال الرد على الشكوى",
  complaintUnauthorized: "غير مصرح لك بتنفيذ هذا الإجراء",
  suggestionSubmitFailed: "فشل في إرسال الاقتراح",
  suggestionNotFound: "الاقتراح غير موجود",
  suggestionAlreadyReviewed: "تمت مراجعة هذا الاقتراح بالفعل",
  teacher: {
```

The surrounding context after the edit:

```typescript
  permissionDenied: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  insufficientPrivilege: "ليس لديك صلاحية كافية لتعديل حسابات المسؤولين.",
  complaintSubmitFailed: "فشل في إرسال الشكوى",
  complaintNotFound: "الشكوى غير موجودة",
  complaintAlreadyAnswered: "تم الرد على هذه الشكوى بالفعل",
  complaintResponseFailed: "فشل في إرسال الرد على الشكوى",
  complaintUnauthorized: "غير مصرح لك بتنفيذ هذا الإجراء",
  suggestionSubmitFailed: "فشل في إرسال الاقتراح",
  suggestionNotFound: "الاقتراح غير موجود",
  suggestionAlreadyReviewed: "تمت مراجعة هذا الاقتراح بالفعل",
  teacher: {
    alreadyExists: "الملف التدريسي لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء الملف التدريسي.",
  },
```

The full Arabic errors file after the edit:

```typescript
import type { ErrorsLabels } from "../types/errors";

export const errors: ErrorsLabels = {
  unauthorizedViewMetrics: "غير مصرح: مطلوب إذن dashboard.view_metrics permission",
  unauthorizedViewList: "غير مصرح: مطلوب إذن schedule.view_list",
  unauthorized: "غير مصرح",
  unauthorizedAction: "إجراء غير مصرح",
  insufficientPermissions: "صلاحيات غير كافية",
  notFound: "غير موجود",
  sessionNotActivated: "الجلسة غير مفعلة",
  absentTooEarly: "لا يمكن تسجيل الغياب بعد. يرجى الانتظار {waitingMinutes} دقيقة من وقت البدء المجدول.",
  userNotFound: "المستخدم ذو المعرف {id} غير موجود",
  userEmailExists: "المستخدم ذو البريد الإلكتروني {email} موجود بالفعل",
  userCreateFailed: "فشل إنشاء مستخدم بالبريد الإلكتروني: {email}",
  noExchangeRate: "لا يوجد سعر صرف لـ {fromCurrency} إلى {toCurrency}",
  exchangeRateStale: "سعر الصرف لـ {fromCurrency} إلى {toCurrency} قديم (أقدم من 24 ساعة)",
  invoiceNotFound: "الفاتورة {id} غير موجودة",
  invoiceVersionMismatch:
    "عدم تطابق الإصدار للفاتورة {id}. المتوقع {expectedVersion}، الحاصل {gotVersion}. يرجى إعادة المحاولة.",
  cannotTransitionFailed: "لا يمكن تحويل حالة التوصيل من FAILED إلى {status}",
  invalidTransition: "انتقال حالة غير صالح.",
  notificationNotFound: "توصيل الإشعار {id} غير موجود",
  notificationProviderNotFound: "توصيل الإشعار ذو معرف مزود الخدمة {providerMessageId} غير موجود",
  teacherBooked: "المعلم محجوز بالفعل لهذه الفترة الزمنية",
  studentBooked: "الطالب محجوز بالفعل لهذه الفترة الزمنية",
  zoomInUse: "رابط اجتماع Zoom قيد الاستخدام بالفعل لهذه الفترة الزمنية",
  classInstanceNotFound: "الحصة {id} غير موجودة",
  originalClassNotFound: "الحصة الأصلية غير موجودة",
  cannotRescheduleToSelf: "لا يمكن إعادة جدولة الحصة إلى نفسها",
  cannotRescheduleCompleted: "لا يمكن إعادة جدولة حصة مكتملة أو مأخوذة",
  cannotRescheduleAlreadyRescheduled: "لا يمكن إعادة جدولة حصة تمت إعادة جدولتها بالفعل",
  userIdRequiredSessionCreate: "معرف المستخدم (userId) مطلوب لإنشاء الجلسة",
  userIdRequiredSessionUpdate: "معرف المستخدم (userId) مطلوب لتحديث الجلسة",
  sessionNotFound: "الجلسة {id} غير موجودة",
  activeRecordNotFound: "سجل {tableName} النشط {entityId} غير موجود",
  recordNotFound: "سجل {tableName} ذو المعرف {entityId} غير موجود",
  unsupportedTable: "جدول غير مدعوم: {table}",
  studentCreateFailed: "فشل إنشاء طالب",
  studentCreateError: "فشل إنشاء الطلاب: {message}",
  studentNotFound: "الطالب {id} غير موجود",
  studentUpdateFailed: "فشل تحديث الطالب ذو المعرف {id}.",
  bankingDetailsAlreadyVerified: "التفاصيل البنكية مؤكدة بالفعل",
  noActiveBankingDetails: "لم يتم العثور على تفاصيل بنكية نشطة للمعلم {id}",
  noVerifiedActiveBankingDetails: "لم يتم العثور على تفاصيل بنكية نشطة ومؤكدة للمعلم {id}",
  startTimeBeforeEndTime: "يجب أن يكون وقت البدء قبل وقت الانتهاء",
  vacationStartBeforeEnd: "يجب أن يكون تاريخ بدء الإجازة قبل تاريخ انتهائها",
  vacationRequestNotFound: "طلب الإجازة {id} غير موجود",
  vacationRequestNotPending: "طلب الإجازة {id} ليس في حالة انتظار (Pending)",
  vacationRequestAlreadyCancelled: "طلب الإجازة {id} ملغى بالفعل",
  teacherOnVacation: "المعلم في إجازة معتمدة خلال الوقت المطلوب",
  teacherUnavailabilityConflict: "المعلم لديه عدم تفرغ متكرر خلال الوقت المطلوب",
  outsideAvailability: "الوقت المطلوب خارج نوافذ توفر المعلم",
  cannotModifyBankingFields: "لا يمكن تعديل الحقول البنكية مباشرة. قم بإغلاق السجل الحالي وأدخل سجلاً جديداً.",
  cannotModifyHistoricalBanking: "لا يمكن تعديل السجلات البنكية التاريخية",
  cannotModifyVerifiedBanking: "لا يمكن تعديل السجلات البنكية المؤكدة",
  teacherNotFound: "المعلم {id} غير موجود",
  bankingDetailsNotFound: "التفاصيل البنكية {id} غير موجودة",
  teacherNotAssigned: "المعلم {teacherId} غير معين للطالب {studentId} في الوقت المجدول {startTime}",
  studentNameLength: "يجب أن يكون اسم الطالب بين 3 و 255 حرفاً.",
  insufficientClasses: "حصص غير كافية للطالب {id}. المتبقي: {remaining}، المطلوب: {required}",
  studentVersionMismatch: "عدم تطابق الإصدار للطالب {id}. المتوقع {expectedVersion}، الحاصل {gotVersion}.",
  cannotVerifyHistoricalBanking: "لا يمكن تأكيد السجلات البنكية التاريخية",
  missedClassTime: "لقد فات وقت الحصة",
  permissionGroupNotFound: "مجموعة الصلاحيات {id} غير موجودة",
  cannotModifySystemPermissionGroup:
    "لا يمكن تعديل الخصائص الأساسية لمجموعات صلاحيات النظام؛ يمكن فقط تحديث الاسم والوصف",
  cannotDeleteSystemPermissionGroup: "لا يمكن حذف صلاحية أو مجموعة تابعة للنظام",
  permissionGroupNameRequired: "اسم مجموعة الصلاحيات مطلوب",
  permissionGroupNameTooLong: "لا يمكن أن يتجاوز اسم مجموعة الصلاحيات 255 حرفاً",
  permissionGroupInvalidName: "اسم مجموعة الصلاحيات يحتوي على أحرف غير صالحة",
  cannotModifySuperAdmin: "لا يمكن تعديل صلاحيات مستخدم SuperAdmin",
  leaveQuotaExceeded: "تم تجاوز حد الإجازات. الحد الأقصى المسموح به هو {maxLeaves} إجازات شهرياً.",
  invalidInput: "بيانات إدخال غير صالحة",
  parentNotFound: "لم يتم العثور على ولي الأمر ذو المعرف {id}.",
  parentAlreadyDeactivated: "حساب ولي الأمر ذو المعرف {id} معطل بالفعل.",
  quotaMustBeNonNegative: "يجب أن يكون عدد الحصص المتبقية عددًا صحيحًا غير سالب.",
  quotaExceedsTotal: "لا يمكن تعيين الحصص المتبقية ({requested}) أعلى من إجمالي الحصص المشتراة ({total}).",
  invalidFileId: "مطلوب معرف ملف صالح.",
  invalidParentId: "معرف ولي الأمر مفقود أو غير صالح",
  invalidInvoiceAmount: "يجب أن يكون مبلغ الفاتورة رقمًا موجبًا",
  invoiceAlreadyPaid: "الفاتورة {id} مُحددة بالفعل كمدفوعة (الحالة الحالية: {status})",
  invalidStatusTransition: "تحول الحالة غير صالح: {currentStatus} \u2192 {newStatus} غير مسموح به",
  staffProfileNotFound: "لم يتم العثور على الملف الشخصي للموظف",
  staffProfileUpdateFailed: "فشل تحديث الملف الشخصي للموظف",
  resourceCreateFailed: "فشل إنشاء المورد التعليمي",
  resourceNotFound: "لم يتم العثور على المورد التعليمي",
  resourceDeleteFailed: "فشل حذف المورد التعليمي",
  permissionDenied: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  insufficientPrivilege: "ليس لديك صلاحية كافية لتعديل حسابات المسؤولين.",
  complaintSubmitFailed: "فشل في إرسال الشكوى",
  complaintNotFound: "الشكوى غير موجودة",
  complaintAlreadyAnswered: "تم الرد على هذه الشكوى بالفعل",
  complaintResponseFailed: "فشل في إرسال الرد على الشكوى",
  complaintUnauthorized: "غير مصرح لك بتنفيذ هذا الإجراء",
  suggestionSubmitFailed: "فشل في إرسال الاقتراح",
  suggestionNotFound: "الاقتراح غير موجود",
  suggestionAlreadyReviewed: "تمت مراجعة هذا الاقتراح بالفعل",
  teacher: {
    alreadyExists: "الملف التدريسي لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء الملف التدريسي.",
  },
  parent: {
    alreadyExists: "ملف ولي الأمر لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء ملف ولي الأمر.",
  },
  staff: {
    alreadyExists: "الملف الوظيفي لهذا المستخدم موجود بالفعل.",
    createFailed: "فشل إنشاء الملف الوظيفي.",
  },
  manager: {
    onlySuperAdminCanCreate: "فقط المسؤولون النظاميون يمكنهم إنشاء حسابات المدراء.",
  },
  auth: {
    invalidRoleTab: "علامة التبويب المحددة للدور غير صالحة.",
  },
  user: {
    emailAlreadyExists: "الحساب بهذا البريد الإلكتروني موجود بالفعل.",
  },
  permission: {
    groupNotFound: "مجموعة الأذونات المطلوبة غير موجودة.",
  },
};
```

---

#### Step 10: Add Arabic Notification Keys to `shared/messages/ar/dashboard/core/notifications.ts`

Open `shared/messages/ar/dashboard/core/notifications.ts`.

After the existing `defaultSystemNotification` key, add the 2 new notification keys. The full file after the edit:

```typescript
import type { NotificationsLabels } from "../../../types/dashboard/core";

export const notifications: NotificationsLabels = {
  title: "الإشعارات",
  noAlerts: "لا توجد تنبيهات في هذا الوقت.",
  errorLoading: "فشل في تحميل الإشعارات.",
  unpaidInvoicesTitle: "الفواتير غير المدفوعة",
  noUnpaidInvoices: "لا توجد فواتير بحاجة للدفع.",
  loadingBilling: "جاري تحميل بيانات الفواتير...",
  newUnansweredComplaint: "شكوى جديدة غير مجاب عليها",
  defaultSystemNotification: "إشعار النظام",
  complaintResponse: "تم الرد على شكواك",
  suggestionAcknowledged: "تم استلام اقتراحك",
};
```

---

### Test Execution Requirements

After completing all file edits, run TypeScript compilation to verify all type interfaces and translation objects are consistent:

```bash
bun tsgo
```

This must pass with 0 TypeScript errors and 0 warnings. If any type mismatch is found (e.g., a key exists in a translation object but not in the interface, or vice versa), fix it before marking the task complete.

---

**Success Criteria / Check Progress Points:**

- [ ] `categoryLabels` added to `ComplaintsParentLabels` interface with `Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>` type
- [ ] `categoryLabels` added to `ComplaintsAdminLabels` interface with `Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>` type
- [ ] 8 new error message keys added to `ErrorsLabels` interface: `complaintSubmitFailed`, `complaintNotFound`, `complaintAlreadyAnswered`, `complaintResponseFailed`, `complaintUnauthorized`, `suggestionSubmitFailed`, `suggestionNotFound`, `suggestionAlreadyReviewed`
- [ ] `complaintResponse` and `suggestionAcknowledged` added to `NotificationsLabels` interface
- [ ] English `categoryLabels` added to `shared/messages/en.ts` under `complaints.parent` section
- [ ] English `categoryLabels` added to `shared/messages/en.ts` under `complaints.admin` section
- [ ] English error messages (8 keys) added to `shared/messages/en.ts` under `errors` section
- [ ] English notification keys (`complaintResponse`, `suggestionAcknowledged`) added to `shared/messages/en.ts` under `notifications` section
- [ ] Arabic `categoryLabels` added to `shared/messages/ar/dashboard/complaints/main.ts` under both `parent` and `admin` sections
- [ ] Arabic error messages (8 keys) added to `shared/messages/ar/errors.ts`
- [ ] Arabic notification keys (`complaintResponse`, `suggestionAcknowledged`) added to `shared/messages/ar/dashboard/core/notifications.ts`
- [ ] All type interfaces match their corresponding translation objects (no missing or extra keys)
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
