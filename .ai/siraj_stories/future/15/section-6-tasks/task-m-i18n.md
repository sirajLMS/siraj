# Task M — i18n

## Sprint 15 · i18n Layer · Section 6

---

## Objective

Add all new translation keys for suggestion management (admin actions, response panel, duplicate search, parent history), complaint file upload, and file display features in both English and Arabic. English uses the monolithic `en.ts` file. Arabic uses split files per domain.

---

## Dependencies

| Task | Description |
|------|-------------|
| L1 | Suggestion Admin UI (views reference the new keys) |
| L2 | Parent Suggestion History (views reference the new keys) |
| L3 | Complaint File Upload UI (views reference the new keys) |

---

## Layer-Specific Rules

- **No local type definitions in i18n files.**

---

## Target Files

| File | Action |
|------|--------|
| `shared/messages/types/dashboard/suggestions/main.ts` | Extend types |
| `shared/messages/types/dashboard/complaints/main.ts` | Extend types |
| `shared/messages/en.ts` | Add English translations |
| `shared/messages/ar/dashboard/suggestions/main.ts` | Add Arabic translations |
| `shared/messages/ar/dashboard/complaints/main.ts` | Add Arabic translations |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/AGENTS.md` for i18n conventions
- [ ] Verify `en.ts` monolithic structure: all English translations in a single file
- [ ] Verify Arabic split structure: separate files per domain under `shared/messages/ar/dashboard/`
- [ ] Verify `SuggestionsLabels` type in `shared/messages/types/dashboard/suggestions/main.ts`
- [ ] Verify `ComplaintsLabels` type in `shared/messages/types/dashboard/complaints/main.ts`
- [ ] Confirm `MessageSchema` type in `shared/messages/types/message.ts` includes dashboard.suggestions and dashboard.complaints
- [ ] Confirm existing `SuggestionsAdminLabels.statusLabels` type is `Record<"pending" | "reviewed", string>` — must extend to include `"duplicate"`
- [ ] Confirm existing `ComplaintsParentLabels.statusLabels` type is `Record<"pending" | "resolved", string>` — no change needed
- [ ] Verify `buildSuggestionsLabels` and `buildComplaintsLabels` utility functions for key mapping

---

## Implementation Details

### 1. Type Extensions: `shared/messages/types/dashboard/suggestions/main.ts`

Extend `SuggestionsAdminLabels` and `SuggestionsParentLabels` with new label groups.

```typescript
export interface SuggestionSupportCardLabels {
  readonly title: string;
  readonly body: string;
}

export interface SuggestionValidationLabels {
  readonly fullNameRequired: string;
  readonly suggestionRequired: string;
}

export interface SuggestionActionLabels {
  readonly review: string;
  readonly respond: string;
  readonly markDuplicate: string;
  readonly delete: string;
}

export interface SuggestionDuplicateSearchLabels {
  readonly title: string;
  readonly placeholder: string;
  readonly confirm: string;
}

export interface SuggestionResponsePanelLabels {
  readonly title: string;
  readonly placeholder: string;
  readonly save: string;
}

export interface SuggestionHistoryLabels {
  readonly title: string;
  readonly empty: string;
  readonly totalRecords: string;
}

export interface SuggestionsParentLabels {
  readonly pageTitle: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly fullName: string;
  readonly fullNamePlaceholder: string;
  readonly suggestion: string;
  readonly suggestionPlaceholder: string;
  readonly submit: string;
  readonly successMessage: string;
  readonly socialProof: string;
  readonly support: {
    readonly privacy: SuggestionSupportCardLabels;
    readonly fastResponse: SuggestionSupportCardLabels;
    readonly constantEvolution: SuggestionSupportCardLabels;
  };
  readonly validation: SuggestionValidationLabels;
  readonly history: SuggestionHistoryLabels;
  readonly duplicateBadge: string;
  readonly responsePanelTitle: string;
  readonly waitingMessage: string;
  readonly loadOlder: string;
  readonly statusLabels: Record<"pending" | "reviewed" | "duplicate", string>;
}

export interface SuggestionsAdminLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly pending: string;
    readonly reviewed: string;
    readonly duplicate: string;
    readonly avgResponse: string;
    readonly efficiencyNote: string;
  };
  readonly tabs: {
    readonly pending: string;
    readonly reviewed: string;
  };
  readonly searchPlaceholder: string;
  readonly table: {
    readonly parentName: string;
    readonly suggestion: string;
    readonly submittedAt: string;
    readonly status: string;
    readonly actions: string;
    readonly markReviewed: string;
    readonly adminResponse: string;
    readonly duplicateOf: string;
    readonly noEntries: string;
  };
  readonly statusLabels: Record<"pending" | "reviewed" | "duplicate", string>;
  readonly actions: SuggestionActionLabels;
  readonly duplicateSearch: SuggestionDuplicateSearchLabels;
  readonly duplicateBadge: string;
  readonly responsePanel: SuggestionResponsePanelLabels;
  readonly detailDialogTitle: string;
}

export interface SuggestionsLabels {
  readonly parent: SuggestionsParentLabels;
  readonly admin: SuggestionsAdminLabels;
}
```

---

### 2. Type Extensions: `shared/messages/types/dashboard/complaints/main.ts`

Extend `ComplaintsParentLabels` with file upload and file display labels.

```typescript
export interface ComplaintValidationLabels {
  readonly studentRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly detailsRequired: string;
  readonly tooManyFiles: string;
  readonly fileTooLarge: string;
  readonly invalidFileType: string;
}

export interface ComplaintFileUploadLabels {
  readonly title: string;
  readonly hint: string;
  readonly supportedFormats: string;
  readonly maxFiles: string;
  readonly removeFile: string;
}

export interface ComplaintFileDisplayLabels {
  readonly attached: string;
  readonly viewFile: string;
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
  readonly fileUpload: ComplaintFileUploadLabels;
  readonly files: ComplaintFileDisplayLabels;
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
  readonly files: ComplaintFileDisplayLabels;
}

export interface ComplaintsLabels {
  readonly parent: ComplaintsParentLabels;
  readonly admin: ComplaintsAdminLabels;
}
```

---

### 3. English Translations: `shared/messages/en.ts`

Add new keys to the `dashboard.suggestions` and `dashboard.complaints` sections.

#### Suggestions section additions (inside `dashboard.suggestions`):

```typescript
suggestions: {
  parent: {
    // ... existing keys remain unchanged ...
    history: {
      title: "My Suggestions",
      empty: "No suggestions submitted yet",
      totalRecords: "{count} Total Suggestions",
    },
    duplicateBadge: "Duplicate of",
    responsePanelTitle: "Admin Response",
    waitingMessage: "Waiting for admin review...",
    loadOlder: "Load Older Suggestions",
    statusLabels: {
      pending: "Pending",
      reviewed: "Reviewed",
      duplicate: "Duplicate",
    },
  },
  admin: {
    // ... existing keys remain unchanged ...
    metrics: {
      pending: "Pending",
      reviewed: "Reviewed",
      duplicate: "Duplicates",
      avgResponse: "Avg. Response Time",
      efficiencyNote: "Efficiency Up 12%",
    },
    // ... existing table, tabs, searchPlaceholder keys ...
    table: {
      parentName: "Parent",
      suggestion: "Suggestion",
      submittedAt: "Submitted",
      status: "Status",
      actions: "Actions",
      markReviewed: "Mark Reviewed",
      adminResponse: "Admin Response",
      duplicateOf: "Duplicate Of",
      noEntries: "No suggestions match your search",
    },
    statusLabels: {
      pending: "Pending",
      reviewed: "Reviewed",
      duplicate: "Duplicate",
    },
    actions: {
      review: "Review",
      respond: "Respond",
      markDuplicate: "Mark as Duplicate",
      delete: "Delete",
    },
    duplicateSearch: {
      title: "Find Original Suggestion",
      placeholder: "Search suggestions...",
      confirm: "Mark as Duplicate",
    },
    duplicateBadge: "Duplicate of",
    responsePanel: {
      title: "Admin Response",
      placeholder: "Write your response...",
      save: "Save Response",
    },
    detailDialogTitle: "Suggestion Details",
  },
},
```

#### Complaints section additions (inside `dashboard.complaints`):

```typescript
complaints: {
  parent: {
    // ... existing keys remain unchanged ...
    validation: {
      studentRequired: "Please select a student.",
      emailRequired: "Please enter your contact email.",
      emailInvalid: "Please enter a valid email address.",
      detailsRequired: "Please describe your complaint in at least 10 characters.",
      tooManyFiles: "Maximum {max} files allowed",
      fileTooLarge: "File exceeds {max}MB limit",
      invalidFileType: "File type not supported",
    },
    fileUpload: {
      title: "Attach Files",
      hint: "Drag files here or click to browse",
      supportedFormats: "PDF, DOCX, images, text, markdown up to {maxSize}MB",
      maxFiles: "Maximum {max} files",
      removeFile: "Remove",
    },
    files: {
      attached: "{count} files attached",
      viewFile: "View",
    },
  },
  admin: {
    // ... existing keys remain unchanged ...
    files: {
      attached: "{count} files attached",
      viewFile: "View",
    },
  },
},
```

---

### 4. Arabic Translations: `shared/messages/ar/dashboard/suggestions/main.ts`

Extend the existing Arabic suggestions file with all new keys.

```typescript
import type { SuggestionsLabels } from "../../../types/dashboard/suggestions";

export const suggestions: SuggestionsLabels = {
  parent: {
    pageTitle: "بوابة ملاحظات أولياء الأمور",
    heroTitle: "بوابة ملاحظات أولياء الأمور",
    heroSubtitle:
      "يسعدنا معرفة اقتراحاتكم حول أساليب التدريس وتطوير برامجنا. تساعدنا ملاحظاتكم في تحسين الرحلة التعليمية لأبنائكم.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسمك الكامل",
    suggestion: "اقتراحك",
    suggestionPlaceholder: "أخبرنا كيف يمكننا التحسين...",
    submit: "إرسال",
    successMessage: "لقد استلمنا رسالتك",
    socialProof: "يراجعها فريق الإدارة يومياً",
    support: {
      privacy: {
        title: "خصوصية مضمونة",
        body: "ملاحظاتك سرية تماماً ولا تُشارك إلا مع فريق التطوير الأساسي.",
      },
      fastResponse: {
        title: "استجابة سريعة",
        body: "نراجع ونؤكد استلام اقتراحات أولياء الأمور خلال 48 ساعة عمل عادةً.",
      },
      constantEvolution: {
        title: "تطور مستمر",
        body: "أكثر من 40% من ميزاتنا الجديدة تنبع مباشرة من ملاحظات أولياء الأمور.",
      },
    },
    validation: {
      fullNameRequired: "يرجى إدخال اسمك الكامل.",
      suggestionRequired: "يرجى إدخال اقتراح لا يقل عن 10 أحرف.",
    },
    history: {
      title: "اقتراحاتي",
      empty: "لم يتم تقديم اقتراحات بعد",
      totalRecords: "{count} إجمالي الاقتراحات",
    },
    duplicateBadge: "مكرر من",
    responsePanelTitle: "رد الإدارة",
    waitingMessage: "في انتظار مراجعة الإدارة...",
    loadOlder: "تحميل الاقتراحات الأقدم",
    statusLabels: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "مكرر",
    },
  },
  admin: {
    pageTitle: "إدارة الاقتراحات",
    pageSubtitle: "مراجعة وتأكيد ملاحظات أولياء الأمور الواردة.",
    metrics: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "المكررة",
      avgResponse: "متوسط وقت الاستجابة",
      efficiencyNote: "تحسن الكفاءة 12%",
    },
    tabs: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
    },
    searchPlaceholder: "البحث في الاقتراحات...",
    table: {
      parentName: "ولي الأمر",
      suggestion: "الاقتراح",
      submittedAt: "تاريخ الإرسال",
      status: "الحالة",
      actions: "إجراءات",
      markReviewed: "تحديد كمراجَع",
      adminResponse: "رد الإدارة",
      duplicateOf: "مكرر من",
      noEntries: "لا توجد اقتراحات مطابقة للبحث",
    },
    statusLabels: {
      pending: "معلقة",
      reviewed: "تمت المراجعة",
      duplicate: "مكرر",
    },
    actions: {
      review: "مراجعة",
      respond: "رد",
      markDuplicate: "تحديد كمكرر",
      delete: "حذف",
    },
    duplicateSearch: {
      title: "البحث عن الاقتراح الأصلي",
      placeholder: "البحث في الاقتراحات...",
      confirm: "تحديد كمكرر",
    },
    duplicateBadge: "مكرر من",
    responsePanel: {
      title: "رد الإدارة",
      placeholder: "اكتب ردك...",
      save: "حفظ الرد",
    },
    detailDialogTitle: "تفاصيل الاقتراح",
  },
};
```

---

### 5. Arabic Translations: `shared/messages/ar/dashboard/complaints/main.ts`

Extend the existing Arabic complaints file with all new keys.

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
      tooManyFiles: "الحد الأقصى {max} ملفات مسموح بها",
      fileTooLarge: "الملف يتجاوز حد {max} ميجابايت",
      invalidFileType: "نوع الملف غير مدعوم",
    },
    statusLabels: {
      pending: "معلقة",
      resolved: "تم الحل",
    },
    fileUpload: {
      title: "إرفاق ملفات",
      hint: "اسحب الملفات هنا أو انقر للتصفح",
      supportedFormats: "PDF, DOCX, صور، نصوص، ماركدوان حتى {maxSize} ميجابايت",
      maxFiles: "الحد الأقصى {max} ملفات",
      removeFile: "إزالة",
    },
    files: {
      attached: "{count} ملفات مرفقة",
      viewFile: "عرض",
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
    files: {
      attached: "{count} ملفات مرفقة",
      viewFile: "عرض",
    },
  },
};
```

---

## Translation Key Reference

### Suggestion Admin Keys

| Key Path | English | Arabic |
|----------|---------|--------|
| `admin.actions.review` | `"Review"` | `"مراجعة"` |
| `admin.actions.respond` | `"Respond"` | `"رد"` |
| `admin.actions.markDuplicate` | `"Mark as Duplicate"` | `"تحديد كمكرر"` |
| `admin.actions.delete` | `"Delete"` | `"حذف"` |
| `admin.statusLabels.duplicate` | `"Duplicate"` | `"مكرر"` |
| `admin.duplicateSearch.title` | `"Find Original Suggestion"` | `"البحث عن الاقتراح الأصلي"` |
| `admin.duplicateSearch.placeholder` | `"Search suggestions..."` | `"البحث في الاقتراحات..."` |
| `admin.duplicateSearch.confirm` | `"Mark as Duplicate"` | `"تحديد كمكرر"` |
| `admin.duplicateBadge` | `"Duplicate of"` | `"مكرر من"` |
| `admin.responsePanel.title` | `"Admin Response"` | `"رد الإدارة"` |
| `admin.responsePanel.placeholder` | `"Write your response..."` | `"اكتب ردك..."` |
| `admin.responsePanel.save` | `"Save Response"` | `"حفظ الرد"` |
| `admin.detailDialogTitle` | `"Suggestion Details"` | `"تفاصيل الاقتراح"` |
| `admin.metrics.duplicate` | `"Duplicates"` | `"المكررة"` |
| `admin.table.adminResponse` | `"Admin Response"` | `"رد الإدارة"` |
| `admin.table.duplicateOf` | `"Duplicate Of"` | `"مكرر من"` |

### Suggestion Parent Keys

| Key Path | English | Arabic |
|----------|---------|--------|
| `parent.history.title` | `"My Suggestions"` | `"اقتراحاتي"` |
| `parent.history.empty` | `"No suggestions submitted yet"` | `"لم يتم تقديم اقتراحات بعد"` |
| `parent.history.totalRecords` | `"{count} Total Suggestions"` | `"{count} إجمالي الاقتراحات"` |
| `parent.duplicateBadge` | `"Duplicate of"` | `"مكرر من"` |
| `parent.responsePanelTitle` | `"Admin Response"` | `"رد الإدارة"` |
| `parent.waitingMessage` | `"Waiting for admin review..."` | `"في انتظار مراجعة الإدارة..."` |
| `parent.loadOlder` | `"Load Older Suggestions"` | `"تحميل الاقتراحات الأقدم"` |
| `parent.statusLabels.duplicate` | `"Duplicate"` | `"مكرر"` |

### Complaint File Upload Keys

| Key Path | English | Arabic |
|----------|---------|--------|
| `parent.fileUpload.title` | `"Attach Files"` | `"إرفاق ملفات"` |
| `parent.fileUpload.hint` | `"Drag files here or click to browse"` | `"اسحب الملفات هنا أو انقر للتصفح"` |
| `parent.fileUpload.supportedFormats` | `"PDF, DOCX, images, text, markdown up to {maxSize}MB"` | `"PDF, DOCX, صور، نصوص، ماركدوان حتى {maxSize} ميجابايت"` |
| `parent.fileUpload.maxFiles` | `"Maximum {max} files"` | `"الحد الأقصى {max} ملفات"` |
| `parent.fileUpload.removeFile` | `"Remove"` | `"إزالة"` |
| `parent.validation.tooManyFiles` | `"Maximum {max} files allowed"` | `"الحد الأقصى {max} ملفات مسموح بها"` |
| `parent.validation.fileTooLarge` | `"File exceeds {max}MB limit"` | `"الملف يتجاوز حد {max} ميجابايت"` |
| `parent.validation.invalidFileType` | `"File type not supported"` | `"نوع الملف غير مدعوم"` |

### Complaint File Display Keys

| Key Path | English | Arabic |
|----------|---------|--------|
| `parent.files.attached` | `"{count} files attached"` | `"{count} ملفات مرفقة"` |
| `parent.files.viewFile` | `"View"` | `"عرض"` |
| `admin.files.attached` | `"{count} files attached"` | `"{count} ملفات مرفقة"` |
| `admin.files.viewFile` | `"View"` | `"عرض"` |

---

## Convention Notes

- **English**: All translations live in the monolithic `shared/messages/en.ts` file under `dashboard.suggestions` and `dashboard.complaints` keys.
- **Arabic**: Translations are split into domain-specific files under `shared/messages/ar/dashboard/suggestions/main.ts` and `shared/messages/ar/dashboard/complaints/main.ts`.
- **Interpolation**: Keys with `{count}`, `{max}`, `{maxSize}` use runtime string replacement (e.g., `label.replace("{count}", String(value))`).
- **Type safety**: The `MessageSchema` type ensures all keys are present in both English and Arabic at compile time.

---

## Error Handling Strategy

| Scenario | Handling |
|----------|---------|
| Missing key in `en.ts` | TypeScript error via `MessageSchema` type constraint |
| Missing key in Arabic file | TypeScript error via `SuggestionsLabels` / `ComplaintsLabels` type constraint |
| Interpolation placeholder mismatch | Manual review — no runtime validation for `{count}` placeholders |
| Type mismatch (e.g., `Record` missing key) | TypeScript error at compile time |

---

## Quality Gate — Implementation

- [ ] `SuggestionsAdminLabels` type extended with `actions`, `duplicateSearch`, `duplicateBadge`, `responsePanel`, `detailDialogTitle`
- [ ] `SuggestionsAdminLabels.metrics` extended with `duplicate` key
- [ ] `SuggestionsAdminLabels.table` extended with `adminResponse` and `duplicateOf` keys
- [ ] `SuggestionsAdminLabels.statusLabels` type changed to `Record<"pending" | "reviewed" | "duplicate", string>`
- [ ] `SuggestionsParentLabels` extended with `history`, `duplicateBadge`, `responsePanelTitle`, `waitingMessage`, `loadOlder`
- [ ] `SuggestionsParentLabels.statusLabels` type changed to `Record<"pending" | "reviewed" | "duplicate", string>`
- [ ] `ComplaintValidationLabels` extended with `tooManyFiles`, `fileTooLarge`, `invalidFileType`
- [ ] `ComplaintsParentLabels` extended with `fileUpload` and `files` properties
- [ ] `ComplaintsAdminLabels` extended with `files` property
- [ ] `en.ts` includes all new English keys in `dashboard.suggestions` and `dashboard.complaints`
- [ ] `ar/dashboard/suggestions/main.ts` includes all new Arabic keys
- [ ] `ar/dashboard/complaints/main.ts` includes all new Arabic keys
- [ ] All interpolation placeholders (`{count}`, `{max}`, `{maxSize}`) are present in both EN and AR translations
- [ ] No hardcoded strings in translation files that should be interpolated
- [ ] TypeScript types compile without errors (`MessageSchema` satisfied)
- [ ] No local entity type definitions — all types sourced from generated GraphQL types or extracted `types.ts` files

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun quality-gate` passes all stages
- [ ] Manual verification: all suggestion admin labels render in English
- [ ] Manual verification: all suggestion admin labels render in Arabic (RTL)
- [ ] Manual verification: all suggestion parent history labels render in English
- [ ] Manual verification: all suggestion parent history labels render in Arabic (RTL)
- [ ] Manual verification: all complaint file upload labels render in English
- [ ] Manual verification: all complaint file upload labels render in Arabic (RTL)
- [ ] Manual verification: all complaint file display labels render in English
- [ ] Manual verification: all complaint file display labels render in Arabic (RTL)
- [ ] Manual verification: interpolation works for `{count}`, `{max}`, `{maxSize}` placeholders
- [ ] Manual verification: language toggle switches all new labels correctly
- [ ] Manual verification: no missing key warnings in browser console

---

## Notes

- The `MessageSchema` type in `shared/messages/types/message.ts` must be updated if the suggestions or complaints type interfaces change structurally.
- The `statusLabels` type change from `Record<"pending" | "reviewed", string>` to `Record<"pending" | "reviewed" | "duplicate", string>` is a breaking change — all consumers must provide the `"duplicate"` key.
- The `ComplaintFileUploadLabels` and `ComplaintFileDisplayLabels` interfaces are new additions to the complaints types file.
- Arabic translations follow the same nested object structure as English for type compatibility.
- The `buildSuggestionsLabels` and `buildComplaintsLabels` utility functions must be updated to map all new keys (Tasks L1, L2, L3).
