### Task I — i18n: Translation Keys for Story 9 UI Strings

**Objective:** Add all i18n translation keys required by the new Story 9 UI components added in [Task H](./task-h-frontend-views.md). Add keys to both English (`en`) and Arabic (`ar`) message files.

**Dependencies:** Depends on Task H — all component `useTranslations()` calls are established and the key namespaces are known.

**Layer-Specific Rules (Frontend i18n — from `frontend/AGENTS.md`):**
- All i18n message files live in `shared/messages/`.
- Use nested namespace structure matching the `useTranslations()` call.
- English messages are the canonical source — Arabic must be provided in full (no English fallbacks in Arabic file).
- Keys must be kebab-case or camelCase matching the component's `t("keyName")` calls exactly.
- RTL-specific phrasing for Arabic — do not translate literally; use contextually appropriate phrasing.

**Target Files:**
- `shared/messages/en.ts` — Add all new English keys
- `shared/messages/ar.ts` — Add all new Arabic keys

---

#### Step 1: New Keys Required by Task H Components

The following `useTranslations()` calls are introduced by Task H:

**From `ParentStudentsDataGrid.tsx`:**
- Namespace: `dashboard.parentProfile.students`
  - `reassignTeacherTitle` — Dialog title for teacher reassignment
  - `currentTeacher` — Label: "Current Teacher"
  - `selectNewTeacher` — Select dropdown label: "Select New Teacher"
  - `selectTeacherPlaceholder` — Disabled placeholder option: "Select a teacher..."
  - `cancel` — Cancel button label
  - `reassigning` — Loading button label: "Reassigning..."
  - `confirmReassign` — Confirm button label: "Confirm Reassignment"
  - `reassignSuccess` — Success snackbar: "Teacher reassigned successfully"
  - `changeStatusTitle` — Dialog title: "Change Student Status"
  - `currentStatus` — Label: "Current Status"
  - `selectNewStatus` — Select dropdown label: "Select New Status"
  - `noStatusTransitionsAvailable` — Warning when student has no valid transitions: "No status transitions are available for this student"
  - `changingStatus` — Loading button label: "Updating Status..."
  - `confirmStatusChange` — Confirm button label: "Confirm Status Change"
  - `statusChangeSuccess` — Success snackbar: "Student status updated successfully"
  - `statusLabel.regular` — "Regular"
  - `statusLabel.suspended` — "Suspended"
  - `statusLabel.on_leave` — "On Leave"
  - `statusLabel.deactivated` — "Deactivated"
  - `statusLabel.graduated` — "Graduated"
  - `statusLabel.on_trial` — "On Trial"

**From `AdminBillingContainer.tsx`:**
- Namespace: `dashboard.billing`
  - `markAsPaidSuccess` — "Invoice marked as paid successfully"
  - `deleteInvoiceSuccess` — "Invoice deleted successfully"

**From `ManualInvoiceContainer.tsx`:**
- Namespace: `dashboard.billing.manual`
  - `createSuccess` — "Invoice {id} created successfully"

---

#### Step 2: English Translations — Add to `shared/messages/en.ts`

Locate `shared/messages/en.ts`. Find the `dashboard.parentProfile` namespace. Add the new `students` sub-namespace after the existing `table` sub-namespace:

```typescript
// Add inside dashboard.parentProfile in shared/messages/en.ts:
students: {
  reassignTeacherTitle: "Reassign Teacher",
  currentTeacher: "Current Teacher",
  selectNewTeacher: "Select New Teacher",
  selectTeacherPlaceholder: "Select a teacher...",
  cancel: "Cancel",
  reassigning: "Reassigning...",
  confirmReassign: "Confirm Reassignment",
  reassignSuccess: "Teacher reassigned successfully",
  changeStatusTitle: "Change Student Status",
  currentStatus: "Current Status",
  selectNewStatus: "Select New Status",
  noStatusTransitionsAvailable: "No status transitions are available for this student",
  changingStatus: "Updating Status...",
  confirmStatusChange: "Confirm Status Change",
  statusChangeSuccess: "Student status updated successfully",
  statusLabel: {
    regular: "Regular",
    suspended: "Suspended",
    on_leave: "On Leave",
    deactivated: "Deactivated",
    graduated: "Graduated",
    on_trial: "On Trial",
  },
},
```

Locate the `dashboard.billing` namespace. Add the two new admin billing keys:

```typescript
// Add inside dashboard.billing in shared/messages/en.ts:
markAsPaidSuccess: "Invoice marked as paid successfully",
deleteInvoiceSuccess: "Invoice deleted successfully",
```

Locate the `dashboard.billing.manual` namespace. Add the new create success key:

```typescript
// Add inside dashboard.billing.manual in shared/messages/en.ts:
createSuccess: "Invoice {id} created successfully",
```

---

#### Step 3: Arabic Translations — Add to `shared/messages/ar.ts`

Add the equivalent Arabic translations in `shared/messages/ar.ts`:

```typescript
// Add inside dashboard.parentProfile in shared/messages/ar.ts:
students: {
  reassignTeacherTitle: "إعادة تعيين المعلم",
  currentTeacher: "المعلم الحالي",
  selectNewTeacher: "اختر معلمًا جديدًا",
  selectTeacherPlaceholder: "اختر معلمًا...",
  cancel: "إلغاء",
  reassigning: "جارٍ إعادة التعيين...",
  confirmReassign: "تأكيد إعادة التعيين",
  reassignSuccess: "تم إعادة تعيين المعلم بنجاح",
  changeStatusTitle: "تغيير حالة الطالب",
  currentStatus: "الحالة الحالية",
  selectNewStatus: "اختر الحالة الجديدة",
  noStatusTransitionsAvailable: "لا تتوفر تحولات حالة لهذا الطالب",
  changingStatus: "جارٍ تحديث الحالة...",
  confirmStatusChange: "تأكيد تغيير الحالة",
  statusChangeSuccess: "تم تحديث حالة الطالب بنجاح",
  statusLabel: {
    regular: "منتظم",
    suspended: "موقوف",
    on_leave: "في إجازة",
    deactivated: "غير مفعل",
    graduated: "متخرج",
    on_trial: "تحت التجربة",
  },
},
```

```typescript
// Add inside dashboard.billing in shared/messages/ar.ts:
markAsPaidSuccess: "تم تحديد الفاتورة كمدفوعة بنجاح",
deleteInvoiceSuccess: "تم حذف الفاتورة بنجاح",
```

```typescript
// Add inside dashboard.billing.manual in shared/messages/ar.ts:
createSuccess: "تم إنشاء الفاتورة {id} بنجاح",
```

---

#### Step 4: Add Backend Error Keys to Translation Files

The services introduced in Task D use `getBackendTranslations({ namespace: "errors" })` with the following new keys. Add them to the backend errors namespace in translation files if they don't already exist:

**New error keys (verify each is absent before adding):**
- `billing.create_invoice` errors namespace:
  - `invalidParentId` — "Invalid or missing parent ID"
  - `invalidInvoiceAmount` — "Invoice amount must be a positive number"
- `billing.update_status_paid` errors namespace:
  - `invoiceAlreadyPaid` — "Invoice {id} is already marked as paid (current status: {status})"
  - `invoiceVersionMismatch` — "Invoice {id} was modified by another session (expected version {expectedVersion}, got {gotVersion})"
- `student` errors namespace:
  - `teacherNotFound` — "Teacher {id} was not found in the system"
  - `studentVersionMismatch` — "Student {id} was modified by another session (expected version {expectedVersion}, got {gotVersion})"
  - `invalidStatusTransition` — "Invalid status transition: {currentStatus} → {newStatus} is not permitted"

Add these to `shared/messages/en.ts` errors namespace:

```typescript
// In errors namespace, English:
invalidParentId: "Invalid or missing parent ID",
invalidInvoiceAmount: "Invoice amount must be a positive number",
invoiceAlreadyPaid: "Invoice {id} is already marked as paid (current status: {status})",
invoiceVersionMismatch: "Invoice {id} was modified by another session (expected version {expectedVersion}, got {gotVersion})",
teacherNotFound: "Teacher {id} was not found in the system",
studentVersionMismatch: "Student {id} was modified by another session (expected version {expectedVersion}, got {gotVersion})",
invalidStatusTransition: "Invalid status transition: {currentStatus} \u2192 {newStatus} is not permitted",
```

Add to `shared/messages/ar.ts` errors namespace:

```typescript
// In errors namespace, Arabic:
invalidParentId: "معرف ولي الأمر مفقود أو غير صالح",
invalidInvoiceAmount: "يجب أن يكون مبلغ الفاتورة رقمًا موجبًا",
invoiceAlreadyPaid: "الفاتورة {id} مُحددة بالفعل كمدفوعة (الحالة الحالية: {status})",
invoiceVersionMismatch: "تم تعديل الفاتورة {id} من جلسة أخرى (الإصدار المتوقع {expectedVersion}، الإصدار الفعلي {gotVersion})",
teacherNotFound: "المعلم ذو المعرف {id} غير موجود في النظام",
studentVersionMismatch: "تم تعديل بيانات الطالب {id} من جلسة أخرى (الإصدار المتوقع {expectedVersion}، الإصدار الفعلي {gotVersion})",
invalidStatusTransition: "تحول الحالة غير صالح: {currentStatus} \u2192 {newStatus} غير مسموح به",
```

---

#### Step 5: Verify Translation Key Coverage

After adding all keys, run the i18n type check to verify no missing keys:

```bash
bun tsgo
```

If the project uses `next-intl` type generation, run:

```bash
bun run generate:i18n
```

Verify all `useTranslations("dashboard.parentProfile.students")` calls in the new components resolve to valid keys.

---

**Test Execution Requirements:**
```bash
bun tsgo
bun biome:check
```

---

**Success Criteria / Check Progress Points:**
- [ ] `dashboard.parentProfile.students` namespace added with 20+ keys in both `en.ts` and `ar.ts`
- [ ] `dashboard.billing.markAsPaidSuccess` and `dashboard.billing.deleteInvoiceSuccess` added in both locales
- [ ] `dashboard.billing.manual.createSuccess` added in both locales
- [ ] 7 new backend error keys added to `errors` namespace in both locales
- [ ] Arabic translations use proper RTL phrasing — not literal English translations
- [ ] `bun tsgo` passes with 0 TypeScript errors (no missing i18n keys in generated types)
- [ ] No English fallbacks in Arabic message file
- [ ] All `statusLabel.*` keys match exactly the lowercase status strings used in `ALLOWED_TARGET_STATUSES` map in Task H

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
