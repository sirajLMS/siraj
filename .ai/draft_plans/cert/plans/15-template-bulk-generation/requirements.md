# Plan 15 — Template Bulk Generation

## Document Info

| Field | Value |
|-------|-------|
| Plan ID | 15 |
| Title | Template Bulk Generation |
| Status | Draft (Round 2 Enhanced) |
| Dependencies | Plan 1 (DB Schema), Plan 2 (Types & Permissions), Plan 3 (Repository Layer), Plan 4 (Services — CertificateGenerationService, TemplateManagementService), Plan 5 (GraphQL API), Plan 6 (PDF Rendering Engine), Plan 14 (Recipient Group Management), Plan 17 (Certificate Generation Dialog — reuses batch infra), Plan 22 (Cron Jobs & Cleanup — batch worker) |
| Reference | `MASTER_ARCHITECTURE.md`, `INTER_PLAN_CONTRACTS.md` (§7, §10, §15, §17, §23), `cgvs_analysis/01-generation-logic.md` §7, §11, §14, `cgjs_analysis/04-template-ui.md`, `siraj_analysis/05-frontend-patterns.md`, `siraj_analysis/06-i18n.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/NEW_PAGE_WORKFLOW.md` |

---

## Introduction

### Overview

This plan delivers the **Template Bulk Generation** capability — a high-volume, async-first certificate generation workflow triggered from the Template List/Detail pages. It complements Plan 17 (Certificate Generation Dialog) by providing a template-centric bulk generation entry point with advanced queue management, scheduling, and observability.

**Business Value**: Enables admins/teachers to generate certificates for 100-5,000+ recipients per batch with real-time progress tracking, pause/resume/cancel, partial failure recovery, and audit-grade reporting — all without blocking the UI or hitting serverless timeouts.

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Template-centric bulk generation launch points (List page bulk action, Detail page "Generate" button) | Individual certificate generation (Plan 17 wizard) |
| Recipient selection via Groups, Classes, CSV upload, or template-linked groups | Template editing (Plans 10-13) |
| Async job queue with `certificate_batch_jobs` table (Plan 1 §10) | Certificate verification page (Plan 19) |
| Real-time progress UI via polling + WebSocket fallback | PDF rendering internals (Plan 6) |
| Pause/Resume/Cancel controls at job level | Storage & signed URLs (Plan 7) |
| Partial failure recovery: per-certificate retry, retry-failed batch, retry-all | Cron worker implementation (Plan 22) |
| Bulk ZIP download of successful certificates | Notification dispatch (Plan 4 uses CommunicationService) |
| Role-based access (7 roles, 11 permissions per §1 INTER_PLAN_CONTRACTS) | |
| Full i18n (EN/AR) with pluralization for counts | |
| WCAG 2.1 AA accessibility, mobile-first responsive | |
| Performance budgets: ≤500ms TTFB, ≤2s first paint, queue depth ≤50 | |

---

## Requirements (EARS Format)

### Feature 1: Launch Points & Navigation

**REQ-15.1** WHEN a user with `CertificateTemplateManage` permission views the Template List page, THE SYSTEM SHALL display a bulk action "Generate Certificates" in the selection toolbar when ≥1 templates are selected.

**REQ-15.2** WHEN a user with `CertificateBatchGenerate` permission views a Template Detail page (status = `published`), THE SYSTEM SHALL display a primary action button "Generate Certificates" that opens the Bulk Generation Wizard pre-scoped to that template.

**REQ-15.3** WHEN the user lacks `CertificateBatchGenerate` permission, THE SYSTEM SHALL hide all bulk generation launch points and disable the bulk action toolbar.

**REQ-15.4** WHEN the user navigates to `/dashboard/certificates/templates/generate` directly, THE SYSTEM SHALL render the Bulk Generation Wizard as a full page (not a dialog) with breadcrumb navigation.

### Feature 2: Recipient Selection (Wizard Step 1)

**REQ-15.5** WHEN Step 1 (Recipients) is displayed, THE SYSTEM SHALL present four selection modes as tabs: **Recipient Groups**, **Classes**, **CSV Upload**, **Template-Linked Groups**.

**REQ-15.6** WHEN "Recipient Groups" tab is active, THE SYSTEM SHALL display a searchable, paginated list of `certificate_recipient_groups` (Plan 14) with multi-select, showing group name, member count, and last used date.

**REQ-15.7** WHEN "Classes" tab is active, THE SYSTEM SHALL display a searchable, paginated list of active classes with multi-select, showing class name, student count, teacher, and academic term.

**REQ-15.8** WHEN "CSV Upload" tab is active, THE SYSTEM SHALL provide a drag-and-drop zone accepting `.csv` files (max 10MB, max 5,000 rows) with column mapping UI: required columns `studentId` or `email`, optional `variable:<variableId>` columns for per-recipient variable overrides.

**REQ-15.9** WHEN "Template-Linked Groups" tab is active, THE SYSTEM SHALL display groups linked to the selected template (via `certificate_recipient_groups.templateId`), pre-selected by default.

**REQ-15.10** WHEN the user selects recipients across multiple tabs, THE SYSTEM SHALL aggregate unique recipients (deduplicate by `studentId`) and display a unified summary: "X unique recipients from Y groups + Z classes + W CSV rows".

**REQ-15.11** WHEN the recipient list exceeds 500, THE SYSTEM SHALL display a warning: "Large batch detected — estimated generation time: {estimatedMinutes} minutes. Consider splitting into smaller batches."

### Feature 3: Variable Mapping & Overrides (Wizard Step 2)

**REQ-15.12** WHEN Step 2 (Variables) is displayed, THE SYSTEM SHALL show all template variables (`certificate_template_variables`) with their type, default value, and required flag.

**REQ-15.13** WHEN a variable has `sourceField` (e.g., `student.name`, `student.email`, `student.customField`), THE SYSTEM SHALL auto-resolve per-recipient values from backend data — no manual input needed.

**REQ-15.14** WHEN the user provides a manual override for a variable, THE SYSTEM SHALL apply it uniformly to ALL recipients in the batch (unless CSV upload provides per-recipient overrides via `variable:<variableId>` columns).

**REQ-15.15** WHEN a required variable has no default and no sourceField, THE SYSTEM SHALL require the user to provide a value before advancing — show inline validation error.

**REQ-15.16** WHEN CSV upload includes per-recipient variable columns, THE SYSTEM SHALL validate each row's values against variable types (text/number/date/select) and show a preview table with invalid rows highlighted.

### Feature 4: Generation Options (Wizard Step 3)

**REQ-15.17** WHEN Step 3 (Options) is displayed, THE SYSTEM SHALL present:
- Issue Date (default: today, ISO 8601 date picker)
- Expiry Date (optional, ISO 8601 date picker; derived from template `defaultValidityPeriod` if set)
- Certificate Numbering: "Auto-increment" (default) or "Custom prefix" + text input
- PDF Quality: "Draft" (72 DPI), "Standard" (150 DPI, default), "High" (300 DPI)
- Send notification email: checkbox (default: checked)
- Generate QR code: checkbox (default: checked)
- Batch priority: "Normal" (default), "High", "Low" — affects cron worker pick order (Plan 22)

**REQ-15.18** WHEN the user selects "Custom prefix", THE SYSTEM SHALL validate the prefix: 1-10 alphanumeric chars, no spaces.

### Feature 5: Review & Confirmation (Wizard Step 4)

**REQ-15.19** WHEN Step 4 (Review) is displayed, THE SYSTEM SHALL show a summary card with:
- Template name, version, status
- Recipient count, unique student count, deduplication note
- Variable overrides applied
- Generation options selected
- Estimated generation time (recipientCount × avgRenderMsPerRecipient from template metadata)
- Estimated cost (if billing integration enabled)
- Idempotency key preview (UUID v4, editable for retries)

**REQ-15.20** WHEN the user clicks "Generate", THE SYSTEM SHALL validate all required fields, then call `batchGenerateCertificates` mutation (Plan 5) which creates a `certificate_batch_jobs` row (status: `pending`) and returns `{ batchJobId, idempotencyKey }` immediately.

### Feature 6: Progress Tracking & Job Management (Wizard Step 5)

**REQ-15.21** WHEN the batch job is created, THE SYSTEM SHALL transition to Step 5 (Progress) and poll `certificateBatchJob(id)` at 2-second intervals (configurable via `VITE_BATCH_POLL_INTERVAL_MS`).

**REQ-15.22** WHEN polling, THE SYSTEM SHALL display:
- Determinate progress bar: `(processedCount / totalCount) × 100%`
- Stats: "Processed: X / Total: Y | Success: S | Failed: F | Remaining: R"
- Per-certificate status list (virtualized for >100): recipient name, status badge (pending/processing/success/error), error message (if failed), certificate link (if success)
- Job-level controls: Pause, Resume, Cancel (mutations: `pauseCertificateBatchJob`, `resumeCertificateBatchJob`, `cancelCertificateBatchJob`)

**REQ-15.23** WHEN the user clicks "Pause", THE SYSTEM SHALL call the pause mutation, set job status to `paused`, display "Generation paused" banner, and continue polling.

**REQ-15.24** WHEN the user clicks "Resume" on a paused job, THE SYSTEM SHALL call the resume mutation and resume normal progress display.

**REQ-15.25** WHEN the user clicks "Cancel", THE SYSTEM SHALL show a confirmation dialog ("Cancel generation? X certificates already generated will be kept. Remaining Y will be marked cancelled."), then on confirm call cancel mutation (sets status to `failed` with reason `cancelled`).

**REQ-15.26** WHEN the job status transitions to `completed` or `failed`, THE SYSTEM SHALL stop polling and transition to the Completion Report view (Step 6).

### Feature 7: Completion Report & Recovery (Wizard Step 6)

**REQ-15.27** WHEN the job completes with `successCount > 0`, THE SYSTEM SHALL display:
- Success summary: "Generated {successCount} of {totalCount} certificates in {durationMs}ms"
- "Download All (ZIP)" button → calls `downloadCertificateBatch` mutation → returns one-shot signed URL
- Per-certificate table (virtualized): name, status, verification code, PDF download link
- "Retry Failed" button (if `failureCount > 0`) → creates new batch job with only failed recipients
- "Done" button → closes wizard, navigates to Certificate List (Plan 16) with refetch

**REQ-15.28** WHEN the job completes with `failureCount > 0`, THE SYSTEM SHALL display a failure table with: recipient name, email, error code, translated error message, "Retry" button per row (calls `generateCertificate` with original `idempotencyKey` for deduplication).

**REQ-15.29** WHEN the user clicks per-certificate "Retry", THE SYSTEM SHALL call `generateCertificate` mutation with the same template/variable/options and the original `idempotencyKey` — backend deduplicates and regenerates only that certificate.

**REQ-15.30** WHEN the user clicks "Retry Failed", THE SYSTEM SHALL call `batchGenerateCertificates` with only the failed `studentId` UUIDs, same template/variables/options, NEW `idempotencyKey`.

**REQ-15.31** WHEN the job status is `failed` (all failed or cancelled), THE SYSTEM SHALL display: failure reason, "Retry All" (new batch job, same config), "Done" (close wizard).

### Feature 8: Queue Management & Observability (Admin View)

**REQ-15.32** WHEN an admin user (`CertificateManage` permission) visits `/dashboard/certificates/batch-jobs`, THE SYSTEM SHALL render a Batch Job Queue page (Plan 16 extension) with:
- AppDataGrid showing all `certificate_batch_jobs` with filters: status, date range, template, created by
- Columns: Job ID, Template, Recipient Group, Status, Progress (processed/total), Created, Started, Completed, Duration, Actions
- Actions per row: View Details (modal), Retry Failed, Cancel (if pending/processing), Download ZIP (if completed)
- Bulk actions: Cancel Selected, Retry Failed Selected

**REQ-15.33** WHEN the queue depth (pending + processing jobs) exceeds 50, THE SYSTEM SHALL display a warning banner: "Queue congested — new jobs may experience delays. Current depth: {depth}."

**REQ-15.34** THE SYSTEM SHALL expose a real-time WebSocket endpoint `/api/certificates/batch-jobs/stream` (optional enhancement) for live progress updates without polling — fallback to polling if WebSocket unavailable.

### Feature 9: Error Handling & Edge Cases

**REQ-15.35** WHEN the `batchGenerateCertificates` mutation returns a network error (no response), THE SYSTEM SHALL display an inline error with "Retry" (re-attempts mutation, reuses wizard state) and "Back to Review" buttons — wizard data is NOT cleared.

**REQ-15.36** WHEN the mutation returns a permission error (`FORBIDDEN` with code `certificates.batch_generate`), THE SYSTEM SHALL display a localized permission error and disable the Generate button.

**REQ-15.37** WHEN the mutation returns `TEMPLATE_VERSION_CONFLICT` (optimistic lock per INTER_PLAN_CONTRACTS §11), THE SYSTEM SHALL display: "Template was modified by another user. Please refresh and retry." with a "Refresh Template" button that refetches template data.

**REQ-15.38** WHEN CSV upload parsing fails (invalid format, encoding, >5,000 rows, missing required columns), THE SYSTEM SHALL display a specific error with row/column details and "Download Template CSV" button.

**REQ-15.39** WHEN a per-recipient variable override from CSV fails type validation, THE SYSTEM SHALL show the row in the preview with inline error and allow the user to edit inline or download corrected CSV.

**REQ-15.40** WHEN the backend cron worker (Plan 22) fails to process a job (crash, timeout, OOM), THE SYSTEM SHALL mark the job as `failed` with `errorDetails` containing the failure reason, and the UI SHALL surface this in the job details modal.

**REQ-15.41** WHEN a batch job exceeds 4 hours (max execution time), THE SYSTEM SHALL auto-mark as `failed` with reason `timeout` and cron worker SHALL skip remaining recipients.

**REQ-15.42** WHEN the user closes the browser/tab during generation (Step 5), THE SYSTEM SHALL show a `beforeunload` warning: "Generation in progress — leaving will not stop the server-side job. Progress will be available on the Batch Jobs page." The async job continues on the server.

**REQ-15.43** WHEN the user reopens the wizard after closing during generation, THE SYSTEM SHALL detect the in-progress job (via `localStorage` last `batchJobId`) and offer "Resume Job" button that navigates to the Batch Job Details page.

### Feature 10: Accessibility (WCAG 2.1 AA)

**REQ-15.44** ALL interactive elements SHALL be keyboard accessible: Tab navigation, Enter/Space activation, Escape to close modals.

**REQ-15.45** ALL status updates SHALL be announced via `aria-live="polite"` region: step changes, progress milestones (25%, 50%, 75%, 100%), pause/resume/cancel, completion.

**REQ-15.46** COLOR contrast SHALL meet 4.5:1 for text, 3:1 for UI components — use theme tokens, never hardcoded colors.

**REQ-15.47** FOCUS indicators SHALL be visible (MUI default outline) — never `outline: none`.

**REQ-15.48** FORM labels SHALL be associated via `htmlFor` / `id` — use MUI `TextField` with `label` prop.

**REQ-15.49** ERROR messages SHALL be linked to inputs via `aria-describedby` and announced via `aria-live="assertive"`.

**REQ-15.50** PROGRESS bar SHALL have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`.

### Feature 11: Mobile Responsive (Mobile-First)

**REQ-15.51** ON screens < 768px, THE SYSTEM SHALL render the wizard as a full-screen page (not a dialog) with bottom-fixed action bar (Next/Back/Generate).

**REQ-15.52** ON mobile, THE STEPPER SHALL display as a compact progress indicator (dots + current step label) — not horizontal labels.

**REQ-15.53** ON mobile, PER-CERTIFICATE status list SHALL use `MobileCardList` + `MobileCardListItem` with virtualization — NOT a table.

**REQ-15.54** CSV UPLOAD on mobile SHALL use native file picker (`<input type="file" accept=".csv">`) with drag-drop as progressive enhancement.

**REQ-15.55** TOUCH targets SHALL be ≥ 48×48dp — use MUI `Button` size="large" on mobile.

### Feature 12: Performance Budgets

**REQ-15.56** INITIAL wizard load (Step 1) SHALL achieve TTFB ≤ 500ms, FCP ≤ 1.5s, TTI ≤ 2.5s on 4G.

**REQ-15.57** POLLING overhead SHALL be ≤ 50ms per request (minimal GraphQL query, Apollo cache-first).

**REQ-15.58** PER-CERTIFICATE list virtualization SHALL render ≤ 20 DOM nodes at once for lists > 100 items.

**REQ-15.59** BATCH job creation SHALL complete ≤ 2s (mutation only creates DB row, returns immediately).

**REQ-15.60** ZIP DOWNLOAD generation SHALL stream (not buffer in memory) — max memory 100MB for 500 certificates.

**REQ-15.61** CONCURRENT batch jobs per user SHALL be limited to 3 (enforced by service layer) — queue excess jobs.

---

## i18n Requirements

### Translation Namespace Structure

This plan introduces the following translation keys under `Translation.Dashboard.TemplateBulkGeneration` (extending `Translation.Dashboard` in `shared/locale/types/dashboard/index.ts`):

| Sub-namespace | Keys |
|---------------|------|
| `steps` | `recipients`, `variables`, `options`, `review`, `progress`, `completion` |
| `recipientModes` | `groups`, `classes`, `csvUpload`, `templateLinked` |
| `recipientSelection` | `selectGroups`, `selectClasses`, `csvDropzone`, `csvTemplateDownload`, `csvColumnMapping`, `aggregatedSummary`, `deduplicationNote`, `largeBatchWarning` |
| `variables` | `autoResolved`, `manualOverride`, `requiredMissing`, `csvPerRecipientOverride`, `validationError` |
| `options` | `issueDate`, `expiryDate`, `numbering`, `numberingAuto`, `numberingCustomPrefix`, `pdfQuality`, `pdfQualityDraft`, `pdfQualityStandard`, `pdfQualityHigh`, `sendNotification`, `generateQR`, `batchPriority`, `priorityNormal`, `priorityHigh`, `priorityLow` |
| `review` | `templateSummary`, `recipientSummary`, `variableSummary`, `optionsSummary`, `estimatedTime`, `estimatedCost`, `idempotencyKey`, `generateButton` |
| `progress` | `progressBar`, `stats`, `perCertificateList`, `pauseButton`, `resumeButton`, `cancelButton`, `cancelConfirmTitle`, `cancelConfirmMessage`, `pausedBanner`, `cancelledBanner` |
| `completion` | `successSummary`, `downloadAllButton`, `perCertificateTable`, `retryFailedButton`, `retrySingleButton`, `retryAllButton`, `doneButton`, `failureReason`, `failureTable`, `partialSuccessTitle`, `fullFailureTitle` |
| `queue` | `pageTitle`, `columns`, `filters`, `queueDepthWarning`, `viewDetails`, `retryFailed`, `cancelJob`, `downloadZip` |
| `errors` | `networkError`, `permissionDenied`, `versionConflict`, `csvParseError`, `csvValidationError`, `jobTimeout`, `queueCongested`, `maxConcurrentJobs` |
| `accessibility` | `progressAnnouncement`, `stepChangeAnnouncement`, `pauseAnnouncement`, `resumeAnnouncement`, `completeAnnouncement`, `errorAnnouncement` |

### Pluralization Rules

**English (one/other)**:
- `generatedCertificates: (count: number) => count === 1 ? "Generated 1 certificate" : \`Generated ${count} certificates\``
- `processedCount: (processed: number, total: number) => \`Processed ${processed} of ${total}\``
- `retryFailedCount: (count: number) => count === 1 ? "Retry 1 failed certificate" : \`Retry ${count} failed certificates\``

**Arabic (zero/one/two/few/many/other)**:
```typescript
// Implementation in shared/locale/ar/dashboard/templateBulkGeneration.ts
generatedCertificates: (count: number) => {
  if (count === 0) return "لم يتم إنشاء أي شهادات";
  if (count === 1) return "تم إنشاء شهادة واحدة";
  if (count === 2) return "تم إنشاء شهادتين";
  if (count >= 3 && count <= 10) return `تم إنشاء ${count} شهادات`;
  return `تم إنشاء ${count} شهادة`;
}
processedCount: (processed: number, total: number) => 
  `تم معالجة ${processed} من ${total}`
```

### Interpolation Parameters

All keys with dynamic values use typed functions:
- `largeBatchWarning: (estimatedMinutes: number) => string`
- `csvColumnMapping: (required: string[], optional: string[]) => string`
- `estimatedTime: (minutes: number, recipientCount: number) => string`
- `aggregatedSummary: (groups: number, classes: number, csvRows: number, uniqueTotal: number) => string`
- `cancelConfirmMessage: (generated: number, remaining: number) => string`
- `successSummary: (success: number, total: number, durationMs: number) => string`
- `queueDepthWarning: (depth: number) => string`
- `maxConcurrentJobs: (limit: number) => string`

---

## Acceptance Criteria

| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| AC-01 | Admin opens Template List, selects 2 published templates, clicks "Generate Certificates" | Wizard opens Step 1 with both templates pre-scoped (user picks one) |
| AC-02 | Teacher opens Template Detail (published), clicks "Generate Certificates" | Wizard opens Step 1 with template pre-selected, cannot change template |
| AC-03 | User without `CertificateBatchGenerate` visits `/dashboard/certificates/templates/generate` | 403 Forbidden (server guard) or redirect to list |
| AC-04 | User selects Recipient Group (50 students) + Class (30 students, 10 overlap) | Summary shows "70 unique recipients from 1 group + 1 class" |
| AC-05 | User uploads CSV with 100 rows, 5 missing required `studentId` | Preview shows 5 error rows, "Download Template CSV" offered |
| AC-06 | User provides custom numbering prefix "CERT-2024-" | Backend receives prefix, generates certs: "CERT-2024-001", "CERT-2024-002" |
| AC-07 | Batch of 200 certificates, user clicks Pause at 50% | Job status = `paused`, cron worker stops, UI shows "Generation paused" |
| AC-08 | Batch of 200, 180 success, 20 failed (template variable missing) | Report shows 20 failures with error "Variable 'studentId' not resolved", "Retry Failed" creates new job for 20 |
| AC-09 | User clicks per-certificate Retry on failed cert | Single `generateCertificate` mutation, original `idempotencyKey`, cert appears in list |
| AC-10 | Admin visits Batch Jobs page, filters status=processing | AppDataGrid shows only processing jobs with real-time progress |
| AC-11 | Queue depth = 55, user creates new batch job | Warning banner "Queue congested — new jobs may experience delays. Current depth: 55." |
| AC-12 | User closes tab during generation (Step 5, 60%) | `beforeunload` warning shown, job continues server-side |
| AC-13 | User reopens wizard, has in-progress job in localStorage | "Resume Job" button navigates to Batch Job Details page |
| AC-14 | Screen reader user navigates wizard | Step changes announced, progress milestones announced, all forms labeled |
| AC-15 | Mobile user (375px) completes full wizard | Full-screen page, bottom action bar, compact stepper, card list virtualization |
| AC-16 | 500 cert batch, ZIP download clicked | Streamed ZIP, memory < 100MB, download starts < 3s |
| AC-17 | Concurrent job limit (3) reached, user tries 4th | Error "Maximum 3 concurrent generation jobs allowed. Please wait for one to complete." |
| AC-18 | Template modified by another user during wizard | On Generate click: "Template was modified by another user. Please refresh and retry." |
| AC-19 | Cron worker crashes mid-batch (job 45/100) | Job marked `failed` with `errorDetails`, UI shows failure reason in details modal |
| AC-20 | All i18n keys render correctly in EN and AR (including pluralization) | No missing translation warnings, Arabic plural forms correct for 0,1,2,3-10,11+ |

---

## SWE Expert Review Notes

1. **Plan Boundary Clarity**: This plan is template-centric bulk generation (launch from template pages). Plan 17 is certificate-centric (launch from certificate list). Both reuse the same `certificate_batch_jobs` table and async job infrastructure (Plan 1 §10, Plan 22). Do NOT duplicate the async job pattern — reference it.

2. **Recipient Deduplication**: REQ-15.10 requires deduplication by `studentId` across selection modes. This MUST be implemented in the ViewModel (client-side) AND validated in the service (server-side) to prevent duplicate certificates for the same student in one batch.

3. **CSV Column Mapping**: The `variable:<variableId>` column convention (REQ-15.8) allows per-recipient overrides. This is a powerful feature but adds complexity. The ViewModel must parse headers, match to template variables, and validate types. Consider a dedicated CSV parser utility in `shared/lib/`.

4. **Queue Depth Limit**: REQ-15.33/15.61 — the 50 queue depth warning and 3 concurrent jobs per user are SOFT limits (UI warnings). The cron worker (Plan 22) enforces HARD limits via `priority` and `maxConcurrentJobs` config. This plan only surfaces the UI.

5. **WebSocket vs Polling**: REQ-15.34 marks WebSocket as optional enhancement. Polling at 2s (configurable) is the baseline. WebSocket implementation would be in Plan 22 (cron worker pushes updates) or a separate realtime plan. Do NOT block on this.

6. **Optimistic Locking**: REQ-15.37 references INTER_PLAN_CONTRACTS §11 — template `expectedVersion` is passed in the mutation input. The wizard must capture `template.expectedVersion` at Step 1 and include it in the `batchGenerateCertificates` input.

7. **Idempotency**: REQ-15.19/15.20/15.29/15.30 — the wizard generates a UUID v4 `idempotencyKey` at Step 4 (Review), displays it (editable for retries), and passes it to the mutation. Per-certificate retries REUSE the original key; batch retries GENERATE a new key. This is critical for deduplication.

8. **ZIP Streaming**: REQ-15.60 — the `downloadCertificateBatch` mutation must return a one-shot signed URL (Plan 7 §22) that streams the ZIP. The backend must use `archiver` or similar with stream piping, NOT buffer all PDFs in memory.

9. **Mobile-First**: REQ-15.51-15.55 — the wizard MUST be a full page on mobile (route `/dashboard/certificates/templates/generate`), not a dialog. The desktop version CAN be a dialog OR a page. Use the same ViewModel for both.

10. **AGENTS.md Compliance**: All new files must follow `frontend/views/AGENTS.md` (ViewModel, Container, Switcher), `frontend/common/stores/AGENTS.md` (Zustand store with `partialize` for non-serializable), `frontend/common/graphql/AGENTS.md` (documents in `certificates/generation.documents.ts`), `backend/services/AGENTS.md` (service methods, batch for DataLoader), `backend/db/repo/AGENTS.md` (repo methods with `tx` propagation).