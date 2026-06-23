### Task A — Migration & Permissions

**Objective:** Add 4 new `AppPermission` enum values, 4 new permission INSERT rows, update group_permissions assignments for 4 groups (including a removal from `parent_default`), add i18n type definitions for complaint category labels and notification keys, and add English and Arabic translations for all new keys.

---

**Dependencies:** None — depends only on current project state.

---

**Layer-Specific Rules:**

- **Database Migration:** New permissions are added to `backend/db/migration/3-system_permissions_and_groups.sql`, NOT to a separate seed file. The migration uses `ON CONFLICT (key) DO UPDATE` for idempotent re-runs.
- **Permission Enums:** Values use PascalCase (e.g., `SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint"`) in `shared/lib/enum.ts`.
- **i18n Localization:** Uses `shared/messages/en.ts` and `shared/messages/ar/` directories. DO NOT create `frontend/locales/` or `backend/locales/` directories.
- **Database Migration Task Protocol:** After writing the migration, run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass before the task is complete.
- **No `console` methods** — ESLint will error. Use `logger` utility if logging is needed.

---

**Target Files:**

1. `shared/lib/enum.ts` — Add 4 new `AppPermission` enum values
2. `backend/db/migration/3-system_permissions_and_groups.sql` — Add 4 permission INSERTs, update 4 group_permissions INSERT blocks
3. `shared/messages/types/dashboard/complaints/main.ts` — Add `categoryLabels` to `ComplaintsParentLabels` and `ComplaintsAdminLabels`
4. `shared/messages/types/dashboard/core/notifications.ts` — Add 2 notification keys to `NotificationsLabels`
5. `shared/messages/en.ts` — Add English translations for category labels and notification keys
6. `shared/messages/ar/dashboard/complaints/main.ts` — Add Arabic translations for category labels
7. `shared/messages/ar/dashboard/core/notifications.ts` — Add Arabic translations for notification keys

---

**Detailed Implementation Steps:**

#### Step 1: Add 4 New `AppPermission` Enum Values to `shared/lib/enum.ts`

Open `shared/lib/enum.ts` and locate the `AppPermission` enum. After the existing line:

```typescript
COMPLAINTS_RESPOND = "complaints.respond",
```

Insert the following 4 new enum values:

```typescript
  SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint",
  SUPPORT_VIEW_HISTORY = "support.view_history",
  COMMUNICATION_SUBMIT_SUGGESTION = "communication.submit_suggestion",
  SYSTEM_DISPATCH_EMAIL = "system.dispatch_email",
```

The surrounding context after the edit must look exactly like this:

```typescript
  COMPLAINTS_LIST = "complaints.list",
  COMPLAINTS_DELETE = "complaints.delete",
  COMPLAINTS_RESPOND = "complaints.respond",
  SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint",
  SUPPORT_VIEW_HISTORY = "support.view_history",
  COMMUNICATION_SUBMIT_SUGGESTION = "communication.submit_suggestion",
  SYSTEM_DISPATCH_EMAIL = "system.dispatch_email",
  STAFF_LIST = "staff.list",
```

---

#### Step 2: Add 4 New Permission INSERT Rows to Migration SQL

Open `backend/db/migration/3-system_permissions_and_groups.sql`.

Locate the last permission INSERT value before the `ON CONFLICT` clause. The last entry currently ends with:

```sql
    (
        gen_random_uuid (),
        'report.view_financials',
        'report',
        'view_financials',
        'Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports.',
        'Reporting',
        true
    ) ON CONFLICT (key) DO
```

Insert the following 4 new permission rows **before** the `ON CONFLICT` clause, after the `report.view_financials` entry. Add a Story 14 comment separator:

```sql
    -- Story 14: Complaints, Suggestions, Communication Channels
    (
        gen_random_uuid (),
        'support.submit_complaint',
        'support',
        'submit_complaint',
        'Submit a new complaint from the parent dashboard',
        'Support',
        true
    ),
    (
        gen_random_uuid (),
        'support.view_history',
        'support',
        'view_history',
        'View own complaint submission history as a parent',
        'Support',
        true
    ),
    (
        gen_random_uuid (),
        'communication.submit_suggestion',
        'communication',
        'submit_suggestion',
        'Submit a new suggestion from the parent dashboard',
        'Communication',
        true
    ),
    (
        gen_random_uuid (),
        'system.dispatch_email',
        'system',
        'dispatch_email',
        'Internal permission allowing the system to dispatch outbound email notifications',
        'System',
        true
    ) ON CONFLICT (key) DO
```

---

#### Step 3: Update `super_admin` Group Permissions

Locate the `super_admin` group_permissions INSERT block. It currently ends with:

```sql
        'report.generate_custom',
        'report.view_financials'
    );
```

Add the 4 new permission keys to the IN list. The updated ending must be:

```sql
        'report.generate_custom',
        'report.view_financials',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'system.dispatch_email'
    );
```

---

#### Step 4: Update `academy_admin` Group Permissions

Locate the `academy_admin` group_permissions INSERT block. It currently ends with:

```sql
        'teachers.create',
        'parents.create'
    );
```

Add the 3 existing complaint permissions to the IN list. The updated ending must be:

```sql
        'teachers.create',
        'parents.create',
        'complaints.list',
        'complaints.delete',
        'complaints.respond'
    );
```

---

#### Step 5: Update `parent_default` Group Permissions

Locate the `parent_default` group_permissions INSERT block. It currently reads:

```sql
    g.slug = 'parent_default'
    AND p.key IN (
        'dashboard.view',
        'schedule.view_family',
        'session.view_details',
        'session.update_status.leave',
        'complaints.list'
    );
```

**Remove** `'complaints.list'` (it was incorrectly assigned — parents should NOT have admin complaint list access) and **add** the 3 new parent permissions. The updated block must be:

```sql
    g.slug = 'parent_default'
    AND p.key IN (
        'dashboard.view',
        'schedule.view_family',
        'session.view_details',
        'session.update_status.leave',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion'
    );
```

---

#### Step 6: Update `system_automated` Group Permissions

Locate the `system_automated` group_permissions INSERT block. It currently ends with:

```sql
        'system.restrict_resource_access'
    );
```

Add the new system permission. The updated ending must be:

```sql
        'system.restrict_resource_access',
        'system.dispatch_email'
    );
```

---

#### Step 7: Add `categoryLabels` to i18n Type Definitions

Open `shared/messages/types/dashboard/complaints/main.ts`.

**7a.** Add `categoryLabels` to `ComplaintsParentLabels` interface. After the existing `statusLabels` property, add:

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

**7b.** Add `categoryLabels` to `ComplaintsAdminLabels` interface. After the existing `priorityLabels` property, add:

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

---

#### Step 8: Add Notification Keys to `NotificationsLabels`

Open `shared/messages/types/dashboard/core/notifications.ts`.

Add 2 new keys to the `NotificationsLabels` interface. The full file after the edit:

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

#### Step 9: Add English Translations to `shared/messages/en.ts`

Open `shared/messages/en.ts`.

**9a.** Locate the `complaints.parent` section (around line 1993). After the existing `statusLabels` block:

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

**9b.** Locate the `complaints.admin` section (around line 2024). After the existing `priorityLabels` block:

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

**9c.** Locate the `notifications` section (around line 218). After the existing `defaultSystemNotification` key:

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

#### Step 10: Add Arabic Translations for Complaints Category Labels

Open `shared/messages/ar/dashboard/complaints/main.ts`.

**10a.** Locate the `parent` section. After the existing `statusLabels` block:

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

**10b.** Locate the `admin` section. After the existing `priorityLabels` block:

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

The full Arabic complaints file after the edit:

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

#### Step 11: Add Arabic Translations for Notification Keys

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

#### Step 12: Run Database Migration Commands (Must All Pass)

After all file edits are complete and per-file quality gates pass, run the following commands **in exact order**. Each command must succeed before running the next:

```bash
bun db cleanGenerate
```

This regenerates the Drizzle schema from the updated database. Must complete with exit code 0.

```bash
bun db reset
```

This drops and recreates the database with the new migration. Must complete with exit code 0.

```bash
bun db seed
```

This reseeds the database with the updated permission catalog. Must complete with exit code 0.

```bash
bun test:db
```

This runs the full database test suite to verify migration and seed data correctness. Must complete with 0 failures.

---

**Test Execution Requirements:**

Run the full database test suite after completing all migration changes:

```bash
bun db cleanGenerate && bun db reset && bun db seed && bun test:db
```

All four commands must pass with exit code 0. If any command fails, fix the migration and re-run the full sequence from `bun db cleanGenerate`.

---

**Success Criteria / Check Progress Points:**

- [ ] 4 new `AppPermission` enum values added to `shared/lib/enum.ts` after `COMPLAINTS_RESPOND`
- [ ] 4 new permission INSERT rows added to `backend/db/migration/3-system_permissions_and_groups.sql` before `ON CONFLICT`
- [ ] `super_admin` group_permissions IN list includes all 4 new permission keys
- [ ] `academy_admin` group_permissions IN list includes `complaints.list`, `complaints.delete`, `complaints.respond`
- [ ] `parent_default` group_permissions IN list includes `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion`
- [ ] `parent_default` group_permissions IN list does NOT include `complaints.list` (removed)
- [ ] `system_automated` group_permissions IN list includes `system.dispatch_email`
- [ ] `categoryLabels` added to `ComplaintsParentLabels` interface with correct `Record` type
- [ ] `categoryLabels` added to `ComplaintsAdminLabels` interface with correct `Record` type
- [ ] `complaintResponse` and `suggestionAcknowledged` added to `NotificationsLabels` interface
- [ ] English translations added to `shared/messages/en.ts` for category labels (parent + admin) and notification keys
- [ ] Arabic translations added to `shared/messages/ar/dashboard/complaints/main.ts` for category labels (parent + admin)
- [ ] Arabic translations added to `shared/messages/ar/dashboard/core/notifications.ts` for notification keys
- [ ] `bun db cleanGenerate` passes with exit code 0
- [ ] `bun db reset` passes with exit code 0
- [ ] `bun db seed` passes with exit code 0
- [ ] `bun test:db` passes with 0 failures

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
