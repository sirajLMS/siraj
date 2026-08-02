I have completed my investigation. The key finding: the **admin UI** email-templates screens need a **new namespace under `dashboard/emailTemplates/`** — only the backend email body/subject strings exist today (`emails` namespace, just 2 of ~13 scopes, no `errors` sub-namespace, no UI labels at all).

Here is my final report. I'll write it directly to the output path — but I must note: **I cannot write files** per my operating constraints (I can only return findings in my response text, never redirect output to a file). I'll provide the complete markdown content below for you to save yourself.

---

# `04-i18n-locale.md` — Email Template System i18n Audit

## Summary

The Siraj i18n is a **compile-time TypeScript** system in `shared/locale/`. There are two decoupled lookup paths sharing the same leaf modules:
- **Client:** `useAppTranslation(Translation.<Group>.<Handle>)` — a `defineNamespace` registry keyed by a handle object
- **Server:** `getTranslations(locale)` (SSR/App) / `getServerTranslations(locale)` (GraphQL/scripts) — returns a pre-built `messagesByLocale[locale]` object built from statically-imported leaf modules
- **GraphQL resolver:** `ctx.t()` (⚠️ **no-arg**, NOT `ctx.t("namespace")` — `shared/AGENTS.md` is outdated on this point; verified at `backend/graphql/gqlContext.ts:30,70,96`) returning the full `Translations`, used as `ctx.t().errorsTranslations`

The backend email-strings `emails` namespace exists (`shared/locale/types/emails/index.ts`, `en/emails/index.ts`, `ar/emails/index.ts`) but covers only **2 of ~13** EmailScopes (`complaintResponse`, `suggestionAcknowledged`) and has **no `errors` sub-namespace** and **zero UI/table/dialog/button labels**. The plan's admin UI surface needs a **new `dashboard.emailTemplates` namespace** that does not exist today.

---

## Pattern to add a namespace

Three files land atomically (the `: Labels` annotation on both leaf impls is a compile-time lockstep — omitting either errors). The `emails` namespace file shows the exact code-gen style. Copy-paste-ready skeleton for a new `dashboard.emailTemplates` namespace:

```ts
// 1) shared/locale/types/dashboard/emailTemplates/main.ts  ← TYPE SCHEMA
export interface EmailTemplatesManagementLabels {
  // ─── Page / nav ───
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly navLabel: string;
  // ─── Table headers ───
  readonly column: {
    readonly name: string;
    readonly scope: string;
    readonly localeColumn: string;
    readonly status: string;
    readonly lastEdited: string;
    readonly version: string;
  };
  // ─── Status chips ───
  readonly status: {
    readonly draft: string;
    readonly published: string;
    readonly archived: string;
  };
  // ─── Buttons ───
  readonly action: {
    readonly create: string;
    readonly edit: string;
    readonly preview: string;
    readonly publish: string;
    readonly archive: string;
    readonly restore: string;
    readonly sendTest: string;
    readonly duplicate: string;
  };
  // ─── Dialog titles ───
  readonly dialog: {
    readonly createTitle: string;
    readonly editTitle: (name: string) => string;        // interpolation fn
    readonly sendTestTitle: string;
    readonly deleteConfirmTitle: string;
    readonly publishConfirmTitle: string;
  };
  // ─── Empty / help / tooltips ───
  readonly emptyState: string;
  readonly emptyStateHelp: string;
  readonly helpText: {
    readonly editorGroups: string;
    readonly designJson: string;
    readonly attachmentRules: string;
  };
  // ─── Toast / errors ───
  readonly toast: {
    readonly saved: () => string;
    readonly published: () => string;
    readonly archived: () => string;
    readonly deleted: () => string;
    readonly testSent: (to: string) => string;
    readonly saveFailed: string;
    readonly rateLimited: (limit: number) => string;     // pluralization-style fn
  };
  // ─── Pluralization example (count fn) ───
  readonly revisionCount: (count: number) => string;
}

/** Aggregate sub-interfaces if the namespace grows past ~30 keys (view-layer organisation rule). */
export interface EmailsManagementLabels {
  readonly emailTemplates: EmailTemplatesManagementLabels;
}
```

```ts
// 2) shared/locale/en/dashboard/emailTemplates/main.ts  ← ENGLISH IMPL
import type { EmailTemplatesManagementLabels } from "@/shared/locale/types/dashboard/emailTemplates/main";

export const dashboardEmailTemplatesEn: EmailTemplatesManagementLabels = {
  pageTitle: "Email Templates",
  pageSubtitle: "Manage transactional email templates and their localized content",
  navLabel: "Email Templates",
  column: { name: "Name", scope: "Scope", localeColumn: "Locale", status: "Status",
            lastEdited: "Last edited", version: "Version" },
  status: { draft: "Draft", published: "Published", archived: "Archived" },
  action: { create: "New template", edit: "Edit", preview: "Preview", publish: "Publish",
            archive: "Archive", restore: "Restore", sendTest: "Send test", duplicate: "Duplicate" },
  dialog: { createTitle: "New email template",
            editTitle: (name) => `Edit "${name}"`,
            sendTestTitle: "Send test email",
            deleteConfirmTitle: "Archive this template?",
            publishConfirmTitle: "Publish this template?" },
  emptyState: "No email templates yet",
  emptyStateHelp: "Create your first transactional email template to get started.",
  helpText: { editorGroups: "Permission groups allowed to edit this template",
              designJson: "Visual editor output — do not hand-edit",
              attachmentRules: "Max size + allowed MIME types for attachments" },
  toast: { saved: () => "Template saved",
           published: () => "Template published",
           archived: () => "Template archived",
           deleted: () => "Template deleted",
           testSent: (to) => `Test email sent to ${to}`,
           saveFailed: "Failed to save template",
           rateLimited: (limit) => `Too many test emails. Limit is ${limit}/min.` },
  revisionCount: (count) => count === 0 ? "No revisions"
                 : count === 1 ? "1 revision" : `${count} revisions`,
};
```

```ts
// 3) shared/locale/ar/dashboard/emailTemplates/main.ts  ← ARABIC IMPL (MUST land atomically)
import type { EmailTemplatesManagementLabels } from "@/shared/locale/types/dashboard/emailTemplates/main";

export const dashboardEmailTemplatesAr: EmailTemplatesManagementLabels = {
  pageTitle: "قوالب البريد الإلكتروني",
  pageSubtitle: "إدارة قوالب البريد الإلكتروني التشغيلية ومحتواها المترجم",
  navLabel: "قوالب البريد",
  column: { name: "الاسم", scope: "النطاق", localeColumn: "اللغة", status: "الحالة",
            lastEdited: "آخر تعديل", version: "الإصدار" },
  status: { draft: "مسودة", published: "منشور", archived: "مؤرشف" },
  action: { create: "قالب جديد", edit: "تعديل", preview: "معاينة", publish: "نشر",
            archive: "أرشفة", restore: "استعادة", sendTest: "إرسال اختبار", duplicate: "نسخ" },
  dialog: { createTitle: "قالب بريد جديد",
            editTitle: (name) => `تعديل "${name}"`,
            sendTestTitle: "إرسال بريد اختبار",
            deleteConfirmTitle: "أرشفة هذا القالب؟",
            publishConfirmTitle: "نشر هذا القالب؟" },
  emptyState: "لا توجد قوالب بريد بعد",
  emptyStateHelp: "أنشئ أول قالب بريد تشغيلي للبدء.",
  helpText: { editorGroups: "مجموعات الصلاحيات المسموح لها بتعديل هذا القالب",
              designJson: "مخرجات المحرر المرئي — لا تعدّل يدوياً",
              attachmentRules: "الحجم الأقصى وأنواع MIME المسموح بها للمرفقات" },
  toast: { saved: () => "تم حفظ القالب",
           published: () => "تم نشر القالب",
           archived: () => "تمت أرشفة القالب",
           deleted: () => "تم حذف القالب",
           testSent: (to) => `تم إرسال بريد اختبار إلى ${to}`,
           saveFailed: "فشل حفظ القالب",
           rateLimited: (limit) => `بريدات اختبار كثيرة جداً. الحد ${limit}/دقيقة.` },
  revisionCount: (count) => count === 0 ? "لا توجد مراجعات"
                 : count === 1 ? "مراجعة واحدة" : `${count} مراجعة`,
};
```

```ts
// 4) shared/locale/namespaces/dashboard/emailTemplates/main.namespace.ts  ← CLIENT REGISTRY
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { EmailTemplatesManagementLabels } from "@/shared/locale/types/dashboard/emailTemplates/main";

export const DashboardEmailTemplates = defineNamespace<EmailTemplatesManagementLabels>(
  "dashboard.emailTemplates.main", // stable string ID — required (shared/AGENTS.md §Browser Translation Cache)
  { load: {
      en: () => import("@/shared/locale/en/dashboard/emailTemplates/main").then(m => m.dashboardEmailTemplatesEn),
      ar: () => import("@/shared/locale/ar/dashboard/emailTemplates/main").then(m => m.dashboardEmailTemplatesAr),
  } },
);
```

**Server-side wiring** (so `getTranslations(locale).dashboardTranslations.emailTemplates` resolves) — edit in the **same PR**:

```ts
// 5) shared/locale/types/dashboard/index.ts (or wherever DashboardTranslations lives in message.ts)
//    add: emailTemplates: EmailTemplatesManagementLabels;   to interface DashboardTranslations {}
//    add import of EmailTemplatesManagementLabels from "@/shared/locale/types/dashboard/emailTemplates/main"

// 6) shared/locale/en/messages.ts (line ~162, inside dashboardTranslations: { ... })
//    add: emailTemplates: dashboardEmailTemplatesEn,
//    add import: import { dashboardEmailTemplatesEn } from "@/shared/locale/en/dashboard/emailTemplates/main";

// 7) shared/locale/ar/messages.ts — same for dashboardEmailTemplatesAr

// 8) shared/locale/namespaces/index.ts   — add export:
//    export { DashboardEmailTemplates } from "@/shared/locale/namespaces/dashboard/emailTemplates/main.namespace";

// 9) shared/locale/namespaces/translation.ts (line ~132, the `Dashboard: { ... }` object literal)
//    add: EmailTemplates: DashboardEmailTemplates,
```

**Usage** (note: there is NO 2-arg `getServerTranslations(locale, "namespace")` form — that does NOT compile per `server-graphql.ts:3`):

```ts
// Server component (app/**)     — async getTranslations
import { getTranslations } from "@/shared/locale";
const t = getTranslations(locale).dashboardTranslations.emailTemplates;
return <h1>{t.pageTitle}</h1>;

// Client component (frontend/**) — useAppTranslation + Translation handle
import { Translation, useAppTranslation } from "@/shared/locale";
const t = useAppTranslation(Translation.Dashboard.EmailTemplates);
<input placeholder={t.emptyState} />;

// GraphQL resolver — ctx.t() (no-arg, returns full Translations)
const tErr = ctx.t().emailsTranslations.errors;        // ← backend email errors
const tUi  = ctx.t().dashboardTranslations.emailTemplates; // ← UI labels if needed in a mutation message
throw new Error(tErr.renderFailed(scope));

// Service / API / scripts — getServerTranslations (sync)
import { getServerTranslations } from "@/shared/locale/server-graphql";
const tErr = getServerTranslations(locale).emailsTranslations.errors;
```

---

## Task-by-task answers (with file:line)

1. **Architecture** — `shared/AGENTS.md:72-250`. A namespace **is NOT a single file**: it is a folder trio of **type schema** (`types/<ns>/index.ts`) + two impl leaves (`en/<ns>/index.ts`, `ar/<ns>/index.ts`) + a **client registry** file (`namespaces/<ns>/<ns>.namespace.ts` calling `defineNamespace("stable.id", { load: {en, ar} })`). Verified `emails` example: `types/emails/index.ts:1-32`, `en/emails/index.ts`, `ar/emails/index.ts`, `namespaces/emails/emails.namespace.ts:4-9`. Full step-list at `shared/AGENTS.md:224-229` (note: step 4 `namespacePaths` and step 5 `LocaleProvider` in AGENTS.md are **stale** — V5-7 found the server path uses pre-built `messagesByLocale`, no runtime registry — see plan line 866). Schema pattern: static strings → `string`; interpolation → `(params) => string`; pluralization → `(count: number) => string` (AGENTS.md:169-199, 202-222).

2. **`useAppTranslation`** — impl `shared/locale/client/use-app-translation.ts:7-10`: `useAppTranslation<TLabels>(handle: NamespaceHandle<TLabels>): TLabels`. Import path: `@/shared/locale` (re-exported at `shared/locale/index.ts:11`). Pass a **handle constant**, not a string. Real usage w/ interpolation: `frontend/common/components/auth/ImpersonationBanner.tsx:7,10` → `const t = useAppTranslation(Translation.Auth.Impersonation); ... t.bannerLoggedInAs(targetName)`. Pluralization example: `frontend/desktop/views/dashboard/components/navbar/notifications/notificationDrawer.desktop.tsx:87` → `labels.unreadCount(unreadCount)` where `unreadCount: (count:number) => string` (`types/notifications/index.ts:206`). Hook signature is `useAppTranslation(handle)` (single arg = handle), NOT the `useAppTranslation("emails")` string form written in `shared/AGENTS.md:137` (that doc snippet is aspirational/misleading — the codegen reality is a handle object).

3. **`getTranslations(locale, "namespace")`** — **does NOT exist**. The function is single-arg: `getTranslations(locale): Translations` at `shared/locale/server.ts:15-17`, returns the *whole* messages object; you drill with dot access. Import path `@/shared/locale` (`index.ts:20`). Real server-component usage in `app/`: `app/(dashboard)/students/page.tsx:14,20` → `const t = getTranslations(locale).dashboardTranslations.studentDirectory; return t.pageTitle`. App-layout SSR usage: `app/layout.tsx:14,52` → `getTranslations(locale).commonTranslations.title`. The SSE i18n section of the plan (`email_template_system_...(react_email_+_editor)_08419060.plan.md:844,867`) explicitly flags that the 2-arg form "will not compile".

4. **`ctx.t`** — Defined at `backend/graphql/gqlContext.ts:30` as `t: () => Translations` and wired at `gqlContext.ts:70` and `gqlContext.ts:96` as `t: () => getServerTranslations(locale)`. **It is the no-arg form** returning the *complete* `Translations` object — drill with `.errorsTranslations`, `.emailsTranslations`, `.dashboardTranslations.emailTemplates`. Real usage: `backend/graphql/utils/delete-entity-resolver.ts:18` → `const tErrors = ctx.t().errorsTranslations;`. Also `backend/graphql/mutation/students/student.mutation.ts:33,60` → `const tErrors = ctx.t().errorsTranslations;` then `await StudentRepository.changeStatus(..., tErrors)`. ⚠️ `shared/AGENTS.md:151` (`await ctx.t("errors")` + `tErrors.auth.invalidCredentials`) and `backend/graphql/AGENTS.md:7` describe an **older 1-arg-string shape that does NOT match the current `gqlContext.ts` type** — follow the `() => Translations` actual signature in code, not the doc.

5. **Existing email-related strings** — exactly one backend `emails` namespace exists, covering **only 2 of ~13 EmailScopes**, with **no `errors` sub-namespace** and **no UI/table/dialog/button labels**:
   - `shared/locale/types/emails/index.ts:1-32` — `ComplaintResponseEmailLabels`, `SuggestionAcknowledgedEmailLabels`, `EmailsLabels { complaintResponse, suggestionAcknowledged }`
   - `shared/locale/en/emails/index.ts:3-21` and `shared/locale/ar/emails/index.ts:3-20` — full en/ar impl of those 2 scopes only
   - **Adjacent but separate:** the **notifications** namespace (`types/notifications/index.ts:1-207`) holds title/body strings for ON_APP/SMS/PUSH per `NotificationEventType` — these are reused across channels and the plan explicitly keeps them (`plan.md:942`: "Keep existing `notificationsTranslations` namespace for ON_APP + SMS + PUSH channels"). Some `notificationsEn.*` entries incidentally mention email subjects they share (invoice generated, class lifecycle, lesson report …) — do **not** duplicate these into `emails`; the email channel reuses the title/body *props* via `templateProps`.
   - **Dashboard `core.notifications`** labels (`types/dashboard/core/notifications.ts:1-15`) include `complaintResponse` + `suggestionAcknowledged` summary strings for the in-app alert bell — not email-UI labels.
   - **Nav labels** for complaints/suggestions exist at `shared/locale/en/dashboard/core/nav.ts:47-50` (`suggestionsSubmit/Manage`, `complaintsSubmit/Manage`) but there is **no `emailTemplates` nav label** anywhere (grep confirmed no `shared/locale/{en,ar,types}/dashboard/email*/**` files exist).
   - Generic reusable keys in `common` (`shared/locale/en/common/index.ts:29-33`): `loading`, `cancel`, `save`, `notifications`; reuse for toasts/buttons.
   - `errors` namespace (`types/errors/index.ts`, `en/errors/index.ts:14,131,141`) holds auth/permission/repository error strings (e.g. `insufficientPermissions`, `userEmailExists`, `studentEmailRequired`) — the email-template plan's per-scope backend errors (`templateNotFound`, `renderFailed`, `attachmentTooLarge` …) are **NEW** to `emails.errors`, not duplicated from here.

6. **RTL handling** — `app/layout.tsx:90` computes `const direction = locale === "ar" ? "rtl" : "ltr";` and sets it on `<html dir={direction} lang={locale}>` (line 95-96). MUI theme flips via `createAppCssVarsTheme(direction, locale, themeMode)` (Storybook mirror: `.storybook/StoryWrapper.tsx:75`). Emotion swaps stylis plugins per direction: a separate `cacheRtl` using `[prefixer, rtlPlugin]` (`StoryWrapper.tsx:9,28-32,76`; same pattern in `test/ui/components/TestWrapper.tsx:24-28,49`). `app/index.css` does not contain direction CSS — flipping is **fully driven by MUI theme + stylis-plugin-rtl**, so MUI `sx` `paddingLeft/marginRight`-style props auto-flip automatically. Default locale is **`ar`** (`shared/locale/AppLocale.ts:3`).

7. **Locale routing** — **No `[locale]` dynamic segment exists.** No `app/[locale]/` directory. The app uses **cookie + Accept-Language** resolution, not Next i18n routing: `shared/locale/server-cookies.ts:4-19` (`getLocale()` reads `NEXT_LOCALE` cookie → `accept-language` header → `defaultLocale`). `backend/graphql/gqlContext.ts:83-99` mirrors the exact resolution for GraphQL. Only **two** locales exist today, hardcoded in `shared/locale/AppLocale.ts:1`: `["ar", "en"] as const`, `defaultLocale = "ar"`. (Note: `test/ui/components/studentSessionsContainer.test.tsx:18-48` mocks a non-existent `@/shared/i18n/routing|navigation` module — that is leftover dead test scaffolding, not a real routing layer.)

8. **Storybook i18n** — Decorator: `.storybook/preview.tsx:11` `withAllProviders` → `.storybook/StoryWrapper.tsx:67`. It reads `context.globals.locale` (defaults `"ar"`, toolbar toggle en/ar at `preview.tsx:20-30`), wraps every story in `<LocaleProvider locale={locale}>` (`StoryWrapper.tsx:186`), picks `cacheLtr`/`cacheRtl` (`StoryWrapper.tsx:76`), and sets `root.dir`/`root.lang` (`StorybookColorSchemeBridge` `StoryWrapper.tsx:60-61`). **Storybook stories are NOT pre-populated with translation fixtures** — stories get real translations the same way the app does, because `useAppTranslation` reads from `LocaleContext` and the `defineNamespace` loaders lazy-import the real `en/ar/**` modules. New email-templates component stories need no extra setup beyond rendering inside the existing wrapper (per V5-8 in plan: no mock-store factory; render containers with `args: {}`).

9. **Test i18n** — The render wrapper is `test/ui/components/TestWrapper.tsx:39-118` with `renderWithWrapper(ui, { locale, themeMode, mocks, viewport })` (`TestWrapper.tsx:108-118`). Default `locale = "ar"` (`TestWrapper.tsx:40,109`). The wrapper sets up `LocaleProvider` + theme + Apollo `MockLink`. Real component test asserting on text: `test/ui/components/studentSessionsContainer.test.tsx:209-220` → `renderWithWrapper(<…/>, { locale: "en", themeMode: "dark", mocks: createMocks(), viewport: "desktop" })` then `expect(screen.getByText(expectedMonthLabel)).toBeInTheDocument()` and `screen.getAllByLabelText("Previous month")`. So the locale for assertions is set **per-test via the `locale` option** (which drives `LocaleContext`, hence `useAppTranslation` output). ⚠️ The opening lines (`testfile:3-48`) stale-mock `@/shared/i18n/routing|navigation` — copy this with caution; for the new email-templates tests you only need `renderWithWrapper` + the `locale` option.

10. **Plan gap — new keys needed by the plan** — exhaustive list, grouped by UI surface. **None of these exist in any locale file today** (verified: no `dashboard/email*/**` files; `emails` namespace has only subject/body/footer per-scope text for 2 scopes; `errors`/`common` supply generic verbs only). The plan (`plan.md:846-870`) explicitly calls for a **new `emails` `errors` sub-namespace** (per-scope backend error fns) AND **per-scope label interfaces for the remaining ~11 EmailScopes** (welcome, passwordReset, emailVerification, invoiceGenerated, class lifecycle, student lifecycle, lesson report, …). UI-facing labels for the **admin management screens** are NOT enumerated in the plan at all — they must be planned separately, proposed below as a new `dashboard.emailTemplates` namespace.

### A. New per-scope backend email label interfaces (extend `emails` namespace — `plan.md:846-868`)
For each missing EmailScope, add `<Scope>EmailLabels` interface + en + ar impl (mirror `ComplaintResponseEmailLabels` shape):

| Scope | Interface to add |
|---|---|
| `welcome` | `WelcomeEmailLabels` (subject, greeting, body, ctaButton, footer) |
| `passwordReset` | `PasswordResetEmailLabels` (subject `({resetLink})=>`, greeting, body, ctaButton, footer, expiryNote) |
| `emailVerification` | `EmailVerificationEmailLabels` (subject `({verifyLink})=>`, greeting, body, ctaButton, footer, expiryNote) |
| `invoiceGenerated` | `InvoiceGeneratedEmailLabels` (subject `({invoiceId})=>`, greeting, body `({amount,currency,dueDate})=>`, viewInvoiceButton, footer) |
| `classScheduled` / `classActivated` / `classStarted` / `classCompleted` / `classMarkedAbsent` / `classMarkedMissed` / `classLeaveRequested` / `classRescheduled` / `classCancelled` / `classReset` | `ClassLifecycleEmailLabels` (shared) — subject `({eventTitle, studentName})=>`, greeting, body `({studentName, scheduledStartAt, newStartAt?})=>`, ctaButton, footer |
| `studentTeacherReassigned` (recipient variants parent/oldTeacher/newTeacher) | `StudentReassignmentEmailLabels` with per-recipient sub-objects |
| `studentStatusChanged` / `studentQuotaOverridden` | `StudentLifecycleEmailLabels` |
| `lessonReportSubmitted` / `lessonReportReviewed` | `LessonReportEmailLabels` (subject `({reportId, teacherName})=>`, body `({decision?})=>`) |
| `paymentMethodChanged` (created/updated/deleted/setDefault/verified) | `PaymentMethodEmailLabels` |

### B. New `emails.errors` sub-namespace (`plan.md:848-860`)
Already specified verbatim in the plan — these are the **only** backend-error keys enumerated:
```
templateNotFound: (scope: string) => string
templateNotPublished: (scope: string) => string
unauthorizedEditor: () => string
invalidDesignJson: () => string
attachmentTooLarge: (max: number) => string   ← pluralization-style count fn
invalidLocale: (locale: string) => string
renderFailed: (scope: string) => string
```

### C. New `dashboard.emailTemplates` UI namespace (NOT enumerated in plan — propose this schema)
The plan (`plan.md:80-83,88-89`) calls for `frontend/common/views/dashboard/email-templates/*` ViewModels + tier views + an admin route `app/(dashboard)/email-templates/page.tsx` + `[id]/page.tsx`. Every one of these surfaces needs strings the plan never lists. Suggested keys grouped by surface:

**Navigation labels**
- `navLabel` (sidebar entry under Admin group → add to `types/dashboard/core/nav.ts` `DashboardNavigationLabels` e.g. `emailTemplates: string`)
- `pageTitle`, `pageSubtitle`

**Table headers (`column.*`)**
- `name`, `scope`, `localeColumn`, `status`, `lastEdited`, `version`, `allowedEditorGroups`

**Status chip labels (`status.*`)**
- `draft`, `published`, `archived` (align with the EmailTemplateStatus enum/Draft/Published/Archived)

**Button labels (`action.*`)**
- `create`, `edit`, `preview`, `publish`, `archive`, `restore`, `sendTest`, `duplicate`, `copyHtml`, `revisions`, `saveDraft`, `discard`

**Dialog titles (`dialog.*`)**
- `createTitle`, `editTitle: (name)=>`, `deleteConfirmTitle`, `publishConfirmTitle: (name)=>`, `archiveConfirmTitle`, `restoreConfirmTitle`, `sendTestTitle`, `revisionsTitle`

**Form field labels / help text (`helpText.*`)** — editor-config dialog
- `displayName`, `slug`, `scopeLabel`, `localeSelect`, `defaultFromName`, `defaultFromEmail`, `allowedEditorGroups`, `attachmentRules`, `defaultSubject`, `designJson`

**Tooltips**
- `scopeTooltip`, `editorGroupsTooltip`, `previewTooltip`, `versionTooltip`, `attachmentRulesTooltip`

**Toast messages (`toast.*`)**
- `saved: ()=>`, `published: ()=>`, `archived: ()=>`, `restored: ()=>`, `deleted: ()=>`, `testSent: (to)=>`, `saveFailed`, `publishFailed`, `archiveFailed`, `sendTestFailed`, `copyHtmlCopied: ()=>`, `rateLimited: (limit)=>` (per plan §12 5-test-emails/min)

**Error messages (UI layer, distinct from `emails.errors` backend fns)**
- `loadFailed`, `previewFailed`, `notFound`, `notEditable`, `versionMismatch: (expected,got)=>`, `invalidDesignJson`, `duplicateScopeLocale`, `missingCompiledHtml`

**Empty states**
- `emptyState`, `emptyStateHelp`, `emptyRevisions`, `emptyRevisionsHelp`, `noSearchResults`

**Search / filter**
- `searchPlaceholder`, `filterByScope`, `filterByStatus`, `filterByLocale`, `clearFilters`

**Editor (`@react-email/editor`)**
- `editorLoading`, `editorNotReady`, `discardConfirm`, `unsavedChangesTitle`, `unsavedChangesBody`, `beforeUnloadPrompt`, `previewTab`, `htmlTab`, `codeTab`, `jsonTab`, `copyHtml`, `sendPreviewEmail`, `previewTo`

**Send-test dialog**
- `sendTestRecipientLabel`, `sendTestRecipientPlaceholder`, `sendTestSampleProps`, `sendTestSubmit`, `sendTestSuccess: (to)=>`, `sendTestRateLimited: (limit)=>`

**Misc reusable (prefer extending `common` over duplicating):**
- `loading`, `cancel`, `save`, `confirm`, `delete`, `close` — **reuse `common` (`shared/locale/en/common/index.ts:29-33`)** — do NOT add to `dashboard.emailTemplates`.

---

### Files changed atomically for the plan's i18n (P0 lockstep — V4-3):
1. `shared/locale/types/emails/index.ts` — extend `EmailsLabels` (`errors`, all new per-scope Interfaces)
2. `shared/locale/en/emails/index.ts` + `shared/locale/ar/emails/index.ts` — both must implement new keys atomically (TS errors otherwise)
3. **New** `shared/locale/types/dashboard/emailTemplates/main.ts`, `en/dashboard/emailTemplates/main.ts`, `ar/dashboard/emailTemplates/main.ts`, `namespaces/dashboard/emailTemplates/main.namespace.ts`
4. `shared/locale/types/message.ts` — add `emailTemplates: EmailTemplatesManagementLabels` to `DashboardTranslations` + import
5. `shared/locale/en/messages.ts` + `ar/messages.ts` — add `emailTemplates: dashboardEmailTemplates{En,Ar}` to `dashboardTranslations`
6. `shared/locale/namespaces/index.ts` + `namespaces/translation.ts` — re-export `DashboardEmailTemplates` and add to `Translation.Dashboard`
7. `shared/locale/types/dashboard/core/nav.ts` + `en/.../core/nav.ts` + `ar/.../core/nav.ts` — add `emailTemplates` nav label

Final summary:
- Two-path i18n (client handle registry + pre-built server `messagesByLocale`), no 2-arg `getTranslations`, `ctx.t()` is no-arg returning full `Translations` (AGENTS.md string-arg snippet is stale).
- Existing `emails` namespace covers **2 of 13** scopes, **no errors sub-namespace**, **zero UI labels**. Plan adds `emails.errors` + remaining per-scope backend labels; the admin UI surface needs a **new `dashboard.emailTemplates`** namespace (not in the plan — proposed above).
- RTL flips via `dir` attr + Emotion `stylis-plugin-rtl` cache swap (layout.tsx:90, StoryWrapper.tsx:28-32, TestWrapper.tsx:24-28). Two locales `["ar","en"]`, default `ar`, cookie+Accept-Language resolution (no `[locale]` route exists).
- Storybook and tests get translations automatically through `LocaleProvider`; tests set locale per-call via `renderWithWrapper({ locale })`.
- All new UI keys grouped by surface (nav, table headers, status, buttons, dialogs, help/tooltips, toasts, errors, empty states, search, editor, send-test) — none currently exist; reuse `common` for generic verbs.