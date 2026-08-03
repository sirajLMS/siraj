# Plan 17 — Certificate Generation Dialog: Requirements

## Document Info

| Field | Value |
|-------|-------|
| **Plan** | 17 — Certificate Generation Dialog |
| **Status** | Draft |
| **Created** | 2025-01-20 |
| **Last Updated** | 2025-08-02 |
| **Author** | AI-assisted planning |
| **Dependencies** | Plan 5 (GraphQL API — `generateBatch` mutation, `certificateBatchJob` poll query, `templates` query, `recipientGroups` query), Plan 6 (Certificate templates with elements, variables, and `expiryEnabled` config), Plan 14 (Recipient groups system), Plan 16 (Certificate list page — launch point), Plan 01 (`certificate_batch_jobs` table), Plan 04 (`CertificateGenerationService` — batch numbering, expiry, QR), Plan 22 (Cron worker for async batch processing) |

---

## 1. Introduction

### 1.1 Overview

The Certificate Generation Dialog is a multi-step wizard component that allows admin and teacher users to generate certificates for individual recipients, groups, classes, or CSV-uploaded lists. The dialog guides users through **six steps**: (1) template selection, (2) recipient selection (four modes: Individual, Group, Class, CSV Upload), (3) variable mapping/override, (4) generation options (issue date, expiry, numbering, PDF quality, notifications, QR code), (5) review summary with estimated time, and (6) async generation progress with pause/resume/cancel controls and a post-generation report. The dialog handles partial failures gracefully, providing a detailed generation report upon completion with per-certificate retry and bulk ZIP download.

This dialog is the primary certificate generation interface in the Siraj certificate management system. It is launched from the Certificate List page (Plan 16) via a "Generate" button and from the Template Detail page (Plan 7) via a "Generate from Template" button. The dialog does not navigate away from the current page — it overlays as a modal dialog, preserving the list context underneath.

### 1.2 Business Value

- **Streamlined workflow**: Users can generate certificates in under 2 minutes for a typical class of 30-50 recipients
- **Batch efficiency**: Backend async batch generation via `certificate_batch_jobs` processes up to 500 certificates per job, reducing per-certificate round-trips
- **CSV import**: Users can bulk-import recipients via CSV upload with automatic column mapping and validation for fast large-scale generation
- **Class selection**: Teachers can select an entire class as recipients with one click, auto-selecting all enrolled students
- **Flexible generation options**: Issue date, expiry date, certificate numbering, PDF quality, notification email, and QR code verification are configurable per batch
- **Pause/resume/cancel**: Long-running batch jobs can be paused, resumed, or cancelled mid-generation for user control
- **Error transparency**: Partial failures are surfaced with per-certificate error details and inline retry, not hidden behind a generic "some failed" message
- **Bulk download**: Successful certificates can be downloaded as a ZIP archive for distribution
- **Variable flexibility**: Users can override default variable values on a per-generation basis without modifying the template
- **Accessibility**: The wizard supports keyboard navigation, screen reader announcements for step changes and progress updates, and meets WCAG 2.1 AA

### 1.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Multi-step wizard dialog component (6 steps) | Template creation/editing (Plan 6, 7) |
| Template selection from published templates | Recipient management (Plan 14) |
| Recipient selection: Individual + Group + Class + CSV Upload (4 modes) | Variable definition in template (Plan 6) |
| CSV file upload with column auto-mapping and validation | PDF rendering engine (Plan 04, 06) |
| Class selection mode with auto-selection of enrolled students | Verification code generation (backend, Plan 04) |
| Variable mapping with override capability | Email/SMS delivery (Plan 23) |
| Generation options: issue date, expiry, numbering, PDF quality, email notification, QR code | Notification email body template (Plan 23) |
| Review summary with estimated generation time | Certificate list page (Plan 16) |
| Async batch generation via `certificate_batch_jobs` table | Certificate detail page (Plan 18) |
| Live progress UI with pause/resume/cancel controls | |
| Per-certificate status tracking and inline retry | |
| Generation report with success/failure summary | |
| Download all successful certificates as ZIP | |
| Error handling for partial failures | |
| Keyboard navigation and accessibility (WCAG 2.1 AA) | |
| i18n for all dialog labels, progress messages, report | |

---

## 2. EARS Requirements

### 2.1 Dialog Launch

**REQ-17.1**: WHEN the user clicks the "Generate" button on the Certificate List page, THE SYSTEM SHALL open the Certificate Generation Dialog as a modal overlay.

**REQ-17.2**: WHEN the user clicks "Generate from Template" on a Template Detail page, THE SYSTEM SHALL open the Certificate Generation Dialog with the template pre-selected in Step 1.

**REQ-17.3**: WHEN the dialog opens, THE SYSTEM SHALL display Step 1 (Template Selection) as the active step, with steps 2-6 disabled.

**REQ-17.4**: WHEN the user does not have the `CertificateBatchGenerate` permission (key: `certificates.batch_generate`), THE SYSTEM SHALL NOT show the "Generate" button and SHALL NOT allow the dialog to open.

### 2.2 Wizard Navigation

**REQ-17.5**: WHEN the user is on any step except Step 6 (Progress & Report), THE SYSTEM SHALL display a "Next" button that advances to the next step after validating the current step.

**REQ-17.6**: WHEN the user is on any step except Step 1, THE SYSTEM SHALL display a "Back" button that returns to the previous step without losing entered data.

**REQ-17.7**: WHEN the user clicks the "Cancel" button at any point before generation starts (Steps 1-5), THE SYSTEM SHALL close the dialog and discard all entered data, after showing a confirmation prompt if any step has data.

**REQ-17.8**: WHEN the user clicks on a step indicator in the stepper header, THE SYSTEM SHALL navigate to that step only if all prior steps are valid. If a prior step is invalid, THE SYSTEM SHALL navigate to the first invalid step instead and display its validation errors.

**REQ-17.9**: WHEN the user navigates between steps, THE SYSTEM SHALL preserve all entered data (template selection, recipient selection, variable overrides, generation options) so that navigating back shows previously entered values.

### 2.3 Step 1 — Template Selection

**REQ-17.10**: WHEN Step 1 is displayed, THE SYSTEM SHALL fetch and show a list of published certificate templates available to the user's institution, with each card showing template name, preview thumbnail, category, and variable count.

**REQ-17.11**: WHEN the template list is loading, THE SYSTEM SHALL display skeleton placeholders for the template cards.

**REQ-17.12**: WHEN the template list fails to load, THE SYSTEM SHALL display an error state with a "Retry" button that re-fetches the template list.

**REQ-17.13**: WHEN the user clicks a template card, THE SYSTEM SHALL visually select the template (highlighted border) and enable the "Next" button.

**REQ-17.14**: WHEN a template was pre-selected via the "Generate from Template" action (REQ-17.2), THE SYSTEM SHALL pre-select that template in Step 1, show it as highlighted, and optionally auto-advance to Step 2 if the template exists and is published.

**REQ-17.15**: WHEN the user searches the template list by name, THE SYSTEM SHALL filter the displayed template cards by the search query in real-time (debounced 300ms).

**REQ-17.16**: WHEN no templates are published yet, THE SYSTEM SHALL display an empty state with a "Create Template" link that navigates to the template creation page (Plan 6).

### 2.4 Step 2 — Recipient Selection

**REQ-17.17**: WHEN Step 2 is displayed, THE SYSTEM SHALL present four selection modes as toggle buttons in a mode selector: "Individual Recipients", "Recipients from Group", "Recipients from Class", and "CSV Upload".

**REQ-17.18**: WHEN "Individual Recipients" mode is active, THE SYSTEM SHALL display a searchable recipient picker that loads recipients (students/enrollees) from the user's institution, with each recipient showing name and email. The user can select multiple recipients. Recipient IDs are `studentId` UUIDs (per INTER_PLAN_CONTRACTS.md §7).

**REQ-17.19**: WHEN the recipient picker loads, THE SYSTEM SHALL fetch recipients with server-side cursor pagination (page size 25) and support search by name or email (debounced 300ms).

**REQ-17.20**: WHEN "Recipients from Group" mode is active, THE SYSTEM SHALL display a dropdown of recipient groups available to the user, fetched from the `recipientGroups` query (Plan 14). Selecting a group loads the group's member count.

**REQ-17.21**: WHEN a group is selected, THE SYSTEM SHALL display the group member count and a preview list of up to 50 members (name + email), with a "Show all N members" expansion if the group exceeds 50.

**REQ-17.22**: WHEN the user selects recipients in "Individual" mode, THE SYSTEM SHALL display the selected count as a badge/pill and enable removal of individual selections via a remove icon.

**REQ-17.23**: WHEN the user has selected zero recipients (or zero groups, classes, or CSV rows), THE SYSTEM SHALL disable the "Next" button and show a validation message: "Please select at least one recipient".

**REQ-17.24**: WHEN the combined recipient count (individual + group members + class students + CSV rows) exceeds 500, THE SYSTEM SHALL display a warning: "Generating more than 500 certificates may take several minutes. Continue?" with Confirm/Cancel options.

**REQ-17.25**: WHEN "Recipients from Class" mode is active, THE SYSTEM SHALL display a class selector dropdown listing all classes available to the user's institution, fetched from the `classes` query with page-number pagination. Each class entry shows the class name.

**REQ-17.26**: WHEN a class is selected in "Class" mode, THE SYSTEM SHALL auto-select all students enrolled in that class, display the total enrolled student count as a badge, and show a preview list of up to 50 students (name + email) with a "Show all N students" expansion if the class exceeds 50. Recipient IDs are `studentId` UUIDs.

**REQ-17.27**: WHEN the user switches mode toggle (e.g., from individual to class), THE SYSTEM SHALL clear the current selection for the previous mode only and preserve selections for other modes, so that re-entering a mode restores its prior selections.

**REQ-17.28**: WHEN "CSV Upload" mode is active, THE SYSTEM SHALL display a file upload dropzone accepting `.csv` files only (accept attribute `text/csv`). Dropping or selecting a file triggers client-side parsing.

**REQ-17.29**: WHEN a CSV file is uploaded, THE SYSTEM SHALL parse the CSV client-side (PapaParse or equivalent), display a preview table showing the first 10 rows with detected columns, and present a column mapping panel. The system SHALL auto-detect and auto-map `name` and `email` columns by matching common header name patterns (e.g., "name", "full_name", "student_name", "email", "email_address"). The user can manually remap columns to `name` and `email` via dropdown selectors.

**REQ-17.30**: WHEN the CSV is parsed, THE SYSTEM SHALL validate each row: rows with missing `name` or invalid `email` format SHALL be flagged with warning indicators in the preview table and excluded from the recipient selection. The system SHALL display a summary of valid rows count and invalid rows count.

**REQ-17.31**: WHEN the CSV fails to parse (malformed, encoding error, or empty file), THE SYSTEM SHALL display a `csvParseError` message above the dropzone and retain the dropzone for re-upload.

**REQ-17.32**: WHEN the CSV upload contains only invalid rows (zero valid recipients), THE SYSTEM SHALL show a `csvInvalidRows` warning summarizing the invalid count and disable the "Next" button.

**REQ-17.33**: WHEN any of the four modes is active, THE SYSTEM SHALL display the total recipient count at the bottom of Step 2 as a combined count badge, aggregating across all modes (individual + group + class + CSV valid rows).

### 2.5 Step 3 — Variable Mapping

**REQ-17.34**: WHEN Step 3 is displayed, THE SYSTEM SHALL fetch and display all template variables (from the selected template in Step 1) as a form, with each variable showing its name, type (TEXT, NUMBER, DATE, SELECT), source field (if auto-mapped), default value, and an input for override.

**REQ-17.35**: WHEN a template variable has a `sourceField` mapping (e.g., `student.name`, `student.email`), THE SYSTEM SHALL display the source field name as a hint and pre-fill the default value based on recipient data. The user can override this by editing the input.

**REQ-17.36**: WHEN a template variable has type `SELECT`, THE SYSTEM SHALL render a dropdown with the options defined in the template variable definition.

**REQ-17.37**: WHEN a template variable has type `DATE`, THE SYSTEM SHALL render a date picker with the locale's date format. All date values SHALL be stored as ISO 8601 strings, NOT JavaScript `Date` objects (per INTER_PLAN_CONTRACTS.md §7).

**REQ-17.38**: WHEN a template variable has type `NUMBER`, THE SYSTEM SHALL render a number input with min/max validation if defined in the template.

**REQ-17.39**: WHEN a template variable is marked as `required` in the template definition, THE SYSTEM SHALL prevent proceeding to Step 4 (Generation Options) if the variable value is empty, showing "This variable is required" validation.

**REQ-17.40**: WHEN the selected recipients include individual recipients, group members, class students, and/or CSV-uploaded recipients, THE SYSTEM SHALL show a note explaining that `sourceField`-mapped variables will automatically pull per-recipient values during generation, and manual overrides apply to ALL recipients uniformly.

**REQ-17.41**: WHEN no template variables exist, THE SYSTEM SHALL skip Step 3 entirely and advance directly from Step 2 to Step 4 (Generation Options), adjusting the stepper to show only 5 steps.

**REQ-17.42**: WHEN variable overrides are entered, THE SYSTEM SHALL key the overrides by `variableId` (UUID), NOT by variable name (per INTER_PLAN_CONTRACTS.md §7, B.6). All variable override values SHALL be stored as strings.

### 2.6 Step 4 — Generation Options

**REQ-17.43**: WHEN Step 4 is displayed, THE SYSTEM SHALL present a form titled with the `optionsTitle` label containing the following generation configuration fields: issue date, expiry date (conditional), certificate numbering, PDF quality, send notification email, and generate QR code.

**REQ-17.44**: WHEN the issue date field is displayed, THE SYSTEM SHALL render a date picker defaulting to today's date. The system SHALL prevent selecting a date in the past and display a validation message if the user attempts to do so. The value SHALL be stored as an ISO 8601 string (per INTER_PLAN_CONTRACTS.md §7).

**REQ-17.45**: WHEN the expiry date field is displayed, THE SYSTEM SHALL check the selected template's `expiryEnabled` configuration flag. If `expiryEnabled` is true, the system SHALL show the expiry date picker; if false, the system SHALL hide the expiry date field entirely. The expiry date value SHALL be stored as an ISO 8601 string or null.

**REQ-17.46**: WHEN the expiry date is shown and a value is entered, THE SYSTEM SHALL validate that the expiry date is after the issue date. If the expiry date is on or before the issue date, THE SYSTEM SHALL display a validation error and prevent proceeding to Step 5.

**REQ-17.47**: WHEN the certificate numbering field is displayed, THE SYSTEM SHALL present two options as a radio group: "Auto-increment" (default) and "Custom prefix". Selecting "Auto-increment" means the backend (Plan 04's `CertificateGenerationService`) auto-increments from the last issued certificate number. Selecting "Custom prefix" SHALL display a text input labeled `numberingPrefixLabel` where the user enters a string prefix to prepend to the auto-incremented number. The auto-increment logic is handled by Plan 04's batch service; the UI sends only the optional prefix string.

**REQ-17.48**: WHEN the PDF quality field is displayed, THE SYSTEM SHALL render a dropdown with three options: "Draft" (72 DPI), "Standard" (150 DPI, default), and "High" (300 DPI). The selected value SHALL be sent to the backend as the `pdfQuality` parameter in the batch generation input.

**REQ-17.49**: WHEN the "Send notification email" field is displayed, THE SYSTEM SHALL render a checkbox labeled `sendEmailLabel`, defaulting to unchecked. When checked, the backend SHALL dispatch a notification email per successful certificate (Plan 23).

**REQ-17.50**: WHEN the "Generate QR code for verification" field is displayed, THE SYSTEM SHALL render a checkbox labeled `generateQRLabel`, defaulting to checked. When checked, the backend SHALL bake a QR code with the verification URL into the PDF at generation time (per Plan 04, §18 of INTER_PLAN_CONTRACTS.md).

**REQ-17.51**: WHEN all generation options are filled, THE SYSTEM SHALL enable the "Next" button to proceed to Step 5 (Review). No field is strictly required to be non-default — the defaults (today's issue date, auto-increment, Standard quality, no email, QR enabled) constitute a valid configuration.

### 2.7 Step 5 — Review

**REQ-17.52**: WHEN Step 5 is displayed, THE SYSTEM SHALL render a complete summary of the generation request under the `reviewTitle` label, including: template name and thumbnail preview, recipient count with mode breakdown (individual, group, class, CSV), variable mappings summary (list of overridden variables or "no overrides" note), and generation options summary (issue date, expiry date if set, numbering mode, PDF quality, email notification on/off, QR code on/off).

**REQ-17.53**: WHEN the total recipient count exceeds 100, THE SYSTEM SHALL display a `largeBatchWarning` alert banner above the summary, informing the user that a large batch may take significant time.

**REQ-17.54**: WHEN the review summary is displayed, THE SYSTEM SHALL calculate and display an estimated generation time using the formula: `estimatedTime = recipientCount × avgRenderMsPerRecipient`. The `avgRenderMsPerRecipient` constant is provided by the backend (Plan 04) and represents the average PDF render time per certificate. The estimated time SHALL be displayed in a human-readable format (e.g., "Estimated time: ~2 minutes" for 240 recipients at 500ms each).

**REQ-17.55**: WHEN Step 5 is displayed, THE SYSTEM SHALL show a "Generate" button (labeled `generateButton`) at the bottom. Clicking this button SHALL transition the wizard to Step 6 (Progress & Report) and trigger the async batch generation flow.

**REQ-17.56**: WHEN the user navigates back from Step 5 to Step 4, THE SYSTEM SHALL preserve all generation options entered so far, allowing the user to modify configuration before generating.

**REQ-17.57**: WHEN the user navigates back from Step 5 to Step 2 or Step 3, THE SYSTEM SHALL preserve all data, allowing changes to recipients or variables that are immediately reflected in the Step 5 summary on return.

### 2.8 Step 6 — Progress & Report

**REQ-17.58**: WHEN the user clicks "Generate" in Step 5, THE SYSTEM SHALL call the `generateBatch` mutation with the template ID, `recipientGroupId` (or recipient selection appropriate to the mode), variable overrides keyed by `variableId`, and generation options (issue date, expiry date, numbering prefix if custom, PDF quality, send email flag, generate QR flag). All date fields SHALL be ISO 8601 strings (per INTER_PLAN_CONTRACTS.md §7). The mutation SHALL create a `certificate_batch_jobs` row with status `pending` and return immediately with the job ID. The UI SHALL then transition to the progress view.

**REQ-17.59**: WHEN the batch generation job is created, THE SYSTEM SHALL poll the `certificateBatchJob(id)` query at 2-second (2000ms) intervals to retrieve the job status, `processed`, `failed`, and `total` counts, and per-certificate status details. Polling SHALL continue until the job status transitions to `completed` or `failed`.

**REQ-17.60**: WHEN the job is in progress, THE SYSTEM SHALL display an overall progress bar showing "X of Y completed" calculated from the server's `processed` / `total` response, with percentage from 0% to 100%.

**REQ-17.61**: WHEN the job is in progress, THE SYSTEM SHALL display a per-certificate status list showing each recipient name with a status indicator: pending (grey), generating (blue spinner), success (green check), error (red X with error message). Successful entries SHALL display a download link for the generated certificate PDF.

**REQ-17.62**: WHEN the job status is `processing` (in progress), THE SYSTEM SHALL display a "Pause" button labeled `pauseButton`. Clicking it SHALL call the pause mutation (setting job status appropriately) and the UI SHALL display a `progressPaused` state indicator. Polling SHALL continue but the progress bar SHALL reflect the paused state.

**REQ-17.63**: WHEN the job is paused, THE SYSTEM SHALL display a "Resume" button labeled `resumeButton`. Clicking it SHALL call the resume mutation and the UI SHALL resume normal progress display. Polling continues throughout.

**REQ-17.64**: WHEN the job is in progress (or paused), THE SYSTEM SHALL display a "Cancel" button labeled `cancelButton`. Clicking it SHALL show a confirmation dialog with `cancelConfirmTitle` and `cancelConfirmMessage`. Confirming SHALL set the job status to `failed` with reason `cancelled` (per INTER_PLAN_CONTRACTS.md §10, point 4) — the cron worker (Plan 22) respects this status. The UI SHALL display a `progressCancelled` state.

**REQ-17.65**: WHEN an individual certificate fails (status `error`), THE SYSTEM SHALL display an inline "Retry" button labeled `retrySingleButton` next to that certificate's entry. Clicking it SHALL call `generateCertificate` with only that recipient's `studentId` and the same template/variable/options configuration, updating the entry's status upon completion.

**REQ-17.66**: WHEN the batch job transitions to `completed` with one or more successful certificates, THE SYSTEM SHALL display a "Download All (ZIP)" button labeled `downloadAllButton`. Clicking it SHALL trigger a backend request to generate and download a ZIP archive containing all successfully generated certificate PDFs.

**REQ-17.67**: WHEN the batch job completes (status `completed`) with zero failures, THE SYSTEM SHALL report the total count and generation duration, and display a "Done" button labeled `doneButton`. Clicking "Done" SHALL close the dialog and navigate to the certificate list page (Plan 16) with a refetch of the certificate list.

**REQ-17.68**: WHEN the batch job completes with some failures (partial success), THE SYSTEM SHALL report the success count, failure count, and a per-recipient failure table with recipient name, email, and the translated error message. The report SHALL offer: inline per-certificate "Retry" buttons, "Retry Failed" (re-submits only failed recipients), "Download All (ZIP)" for successful certificates, and "Done".

**REQ-17.69**: WHEN the batch job transitions to `failed` (all certificates failed or cancelled), THE SYSTEM SHALL display a `reportFailedTitle` state with the failure reason, and offer "Retry All" and "Done" buttons. "Retry All" SHALL create a new batch job with the same configuration.

### 2.9 Error Handling

**REQ-17.70**: WHEN the `generateBatch` mutation returns a network error (no server response), THE SYSTEM SHALL display an error state without clearing the wizard data, with a "Retry" button that re-attempts the generation and a "Back" button that returns to Step 5 (Review) summary.

**REQ-17.71**: WHEN the `generateBatch` mutation returns a permission error (user lacks `CertificateBatchGenerate` permission, key `certificates.batch_generate`), THE SYSTEM SHALL display a localized permission error and disable the "Generate" button.

**REQ-17.72**: WHEN a partial failure occurs and the user clicks "Retry Failed", THE SYSTEM SHALL call `generateBatch` again with only the failed recipient `studentId` UUIDs and the same template/variable/options configuration, creating a new `certificate_batch_jobs` row.

**REQ-17.73**: WHEN the retry attempt also produces partial failures, THE SYSTEM SHALL update the report with the new results (merging with prior successes) and re-display the "Retry Failed" option.

**REQ-17.74**: WHEN the user closes the dialog after a partial failure (clicking "Done"), THE SYSTEM SHALL close the dialog, trigger a refetch of the certificate list (to show newly generated certificates), and NOT show a confirmation prompt since generation has already occurred.

### 2.10 Accessibility

**REQ-17.75**: WHEN the dialog opens, THE SYSTEM SHALL trap focus within the dialog and set focus to the first interactive element (template search or first template card).

**REQ-17.76**: WHEN the user presses the Escape key before generation starts (Steps 1-5), THE SYSTEM SHALL close the dialog after showing the unsaved-changes confirmation prompt (if any step has data).

**REQ-17.77**: WHEN the user presses the Escape key during generation (Step 6, in progress), THE SYSTEM SHALL NOT close the dialog (generation is in progress) and SHALL show a warning toast: "Generation in progress — please wait".

**REQ-17.78**: WHEN a step changes, THE SYSTEM SHALL announce the new step name via an `aria-live="polite"` region for screen reader users.

**REQ-17.79**: WHEN the generation progress updates, THE SYSTEM SHALL announce progress milestones (25%, 50%, 75%, 100%) via an `aria-live="polite"` region.

### 2.11 Responsive Behavior

**REQ-17.80**: WHEN the dialog is displayed on a mobile device (screen width < 768px), THE SYSTEM SHALL render as a full-screen dialog (maximizing available space) with the stepper displayed as a condensed progress indicator rather than the full horizontal stepper.

### 2.12 Performance

**REQ-17.81**: WHEN the recipient group or class has more than 100 members/students, THE SYSTEM SHALL NOT load all member details upfront. Instead, it SHALL display only the count and load a preview of up to 50 members, with the full list fetched only on user request.

**REQ-17.82**: WHEN the generation batch exceeds 100 certificates, THE SYSTEM SHALL show an estimated processing time hint on Step 5 (Review) using the formula: `recipientCount × avgRenderMsPerRecipient`. For batches exceeding 200, the hint SHALL additionally indicate "Large batch" categorization.

---

## 3. i18n

### 3.1 Namespace

The certificate generation dialog translations live under:
`dashboard.certificates.generation`

This namespace is registered in `shared/locale/namespaces/dashboard/certificates/generation.namespace.ts` and all labels are typed via `shared/locale/types/dashboard/certificates/generation.ts` as `CertificateGenerationLabels`.

### 3.2 Dialog Labels

| Key | English | Arabic | Notes |
|-----|---------|--------|-------|
| `dialogTitle` | Generate Certificates | إنشاء الشهادات | Dialog header |
| `dialogSubtitle` | Create certificates from a template for individual recipients, groups, classes, or CSV upload | أنشئ الشهادات من قالب للمستلمين الأفراد أو المجموعات أو الفصول أو رفع ملف | Subtitle below title |
| `cancelButton` | Cancel | إلغاء | Cancel button |
| `nextButton` | Next | التالي | Wizard navigation |
| `backButton` | Back | رجوع | Wizard navigation |
| `generateButton` | Generate | إنشاء | Start generation |
| `doneButton` | Done | تم | Close after report |
| `retryFailedButton` | Retry Failed | إعادة محاولة الفاشلة | After partial failure |
| `retryAllButton` | Retry All | إعادة محاولة الكل | After all-failed |
| `downloadAllButton` | Download All (ZIP) | تنزيل الكل (ZIP) | Download successful as ZIP |
| `retrySingleButton` | Retry | إعادة المحاولة | Per-certificate inline retry |
| `pauseButton` | Pause | إيقاف مؤقت | Pause batch job |
| `resumeButton` | Resume | استئناف | Resume batch job |
| `cancelConfirmTitle` | Cancel generation? | إلغاء الإنشاء؟ | Cancel confirmation
| `cancelConfirmMessage` | Are you sure you want to cancel the certificate generation? This will stop the process and cannot be undone. |هل أنت متأكد من إلغاء إنشاء الشهادات؟ سيؤدي هذا إلى إيقاف العملية ولا يمكن التراجع عنه. |
| `progressPaused` | Generation paused | توقف الإنشاء مؤقتاً | Paused state
| `progressCancelled` | Generation cancelled | تم إلغاء الإنشاء | Cancelled state
| `unsavedChangesTitle` | Discard changes? | تجاهل التغييرات؟ | Confirmation prompt |
| `unsavedChangesMessage` | You have unsaved data. Are you sure you want to close? | لديك بيانات غير محفوظة. هل أنت متأكد من الإغلاق؟ | |
| `unsavedChangesConfirm` | Yes, discard | نعم، تجاهل | |
| `unsavedChangesCancel` | Keep editing | متابعة التحرير | |
| `generationInProgressWarning` | Generation in progress — please wait | الإنشاء قيد التقدم — يرجى الانتظار | Escape key warning |
| `largeBatchHint` | Large batch — estimated 2-5 minutes | دفعة كبيرة — الوقت المقدر 2-5 دقائق | >200 recipients |
| `maxRecipientsWarning` | Generating more than 500 certificates may take several minutes. Continue? | إنشاء أكثر من 500 شهادة قد يستغرق عدة دقائق. هل تريد المتابعة؟ | >500 recipients |
| `maxRecipientsConfirm` | Continue | متابعة | |
| `maxRecipientsCancel` | Go back | رجوع | |

### 3.3 Step Labels

| Key | English | Arabic |
|-----|---------|--------|
| `step1Label` | Select Template | اختيار القالب |
| `step2Label` | Select Recipients | اختيار المستلمين |
| `step3Label` | Map Variables | تعيين المتغيرات |
| `step4Label` | Generation Options | خيارات الإنشاء |
| `step5Label` | Review | مراجعة |
| `step6Label` | Progress | التقدم |
| `step1Description` | Choose a certificate template to generate from | اختر قالب الشهادة لإنشائه |
| `step2Description` | Select individual recipients, a group, a class, or upload a CSV | اختر مستلمين أفراد أو مجموعة أو فصلاً أو ارفع ملف CSV |
| `step3Description` | Map or override template variables | تعيين أو تجاوز متغيرات القالب |
| `step4Description` | Configure issue date, expiry, numbering, PDF quality, and more | اعداد تاريخ الإصدار، الانتهاء، الترقيم وجودة PDF والمزيد |
| `step5Description` | Review the generation configuration and confirm | مراجعة إعدادات الإنشاء وتأكيدها |
| `step6Description` | View generation progress and download results | عرض تقدم الإنشاء وتنزيل النتائج |

### 3.4 Template Selection Labels

| Key | English | Arabic |
|-----|---------|--------|
| `templateSearchPlaceholder` | Search templates... | ابحث عن القوالب... |
| `templateCardVariables` | `{count}` variables | `{count} متغير` |
| `templateCardCategory` | Category: `{category}` | الفئة: `{category}` |
| `noTemplatesTitle` | No templates available | لا توجد قوالب متاحة |
| `noTemplatesMessage` | You need to create and publish a template first | تحتاج إلى إنشاء ونشر قالب أولاً |
| `noTemplatesCreateLink` | Create Template | إنشاء قالب |
| `templateLoadError` | Failed to load templates | فشل في تحميل القوالب |
| `templateRetry` | Retry | إعادة المحاولة |

### 3.5 Recipient Selection Labels

| Key | English | Arabic |
|-----|---------|--------|
| `individualMode` | Individual Recipients | مستلمون أفراد |
| `groupMode` | Recipients from Group | مستلمون من مجموعة |
| `classMode` | Recipients from Class | مستلمون من فصل |
| `csvMode` | CSV Upload | رفع ملف CSV |
| `recipientSearchPlaceholder` | Search by name or email... | ابحث بالاسم أو البريد الإلكتروني... |
| `recipientSelected` | Selected | محدد |
| `recipientRemoveAll` | Clear all | مسح الكل |
| `groupDropdownLabel` | Select a recipient group | اختر مجموعة مستلمين |
| `groupMemberCount` | `{count} members` | `{count} أعضاء` |
| `groupShowAllMembers` | Show all `{count}` members | عرض جميع `{count} عضو` |
| `classDropdownLabel` | Select a class | اختر فصلاً |
| `classStudentCount` | `{count} students` | `{count} طلاب` |
| `classShowAllStudents` | Show all `{count}` students | عرض جميع `{count} طالب` |
| `classLoadError` | Failed to load classes | فشل في تحميل الفصول |
| `csvUploadTitle` | Upload CSV File | رفع ملف CSV |
| `csvDropzoneText` | Drag and drop a .csv file here, or click to browse | اسحب وأفلِب ملف .csv هنا، أو انقر للتصفح |
| `csvPreviewTitle` | CSV Preview | معاينة CSV |
| `csvColumnMapping` | Column Mapping | تعيين الأعمدة |
| `csvNameColumn` | Name Column | عمود الاسم |
| `csvEmailColumn` | Email Column | عمود البريد الإلكتروني |
| `csvValidRows` | `{count} valid rows` | `{count} صفوف صالحة` |
| `csvInvalidRows` | `{count} invalid rows excluded` | تم استبعاد {count} صف غير صالح |
| `csvParseError` | Failed to parse CSV file. Please check the file format | فشل في تحليل ملف CSV. يرجى التحقق من تنسيق الملف |
| `noRecipientsSelected` | No recipients selected | لم يتم تحديد مستلمين |
| `recipientSelectValidation` | Please select at least one recipient |يرجى تحديد مستلم واحد على الأقل |
| `groupLoadError` | Failed to load recipient groups | فشل في تحميل مجموعات المستلمين |
| `recipientLoadError` | Failed to load recipients | فشل في تحميل المستلمين |

### 3.6 Variable Mapping Labels

| Key | English | Arabic |
|-----|---------|--------|
| `variableMappingTitle` | Template Variables | متغيرات القالب |
| `variableMappingHint` | Variables with source fields will automatically use recipient data. Manual overrides apply to ALL recipients. | المتغيرات مع حقول المصدر ستستخدم بيانات المستلم تلقائياً. التجاوزات اليدوية تنطبق على جميع المستلمين. |
| `variableSourceHint` | Source: `{sourceField}` | المصدر: `{sourceField}` |
| `variableRequired` | This variable is required | هذا المتغير مطلوب |
| `variableDefaultLabel` | Default | الافتراضي |
| `variableOverrideLabel` | Override value | قيمة التجاوز |
| `noVariablesTitle` | No variables to map | لا توجد متغيرات للتعيين |
| `noVariablesMessage` | This template has no variables. Proceed to generation. | هذا القالب لا يحتوي على متغيرات. انتقل إلى الإنشاء. |

### 3.7 Generation Summary Labels

| Key | English | Arabic |
|-----|---------|--------|
| `summaryTitle` | Generation Summary | ملخص الإنشاء |
| `summaryTemplate` | Template | القالب |
| `summaryRecipientCount` | Recipients | المستلمون |
| `summaryIndividualRecipients` | Individual: `{count}` | أفراد: `{count}` |
| `summaryGroupRecipients` | Group: `{count}` | مجموعة: `{count}` |
| `summaryClassRecipients` | Class: `{count}` | فصل: `{count}` |
| `summaryCsvRecipients` | CSV Upload: `{count}` | رفع CSV: `{count}` |
| `summaryTotalRecipients` | Total: `{count}` | الإجمالي: `{count}` |
| `summaryOverriddenVariables` | Overridden Variables | المتغيرات المتجاوزة |
| `summaryNoOverrides` | No overrides — all variables use source/recipient data | لا توجد تجاوزات — جميع المتغيرات تستخدم بيانات المصدر/المستلم |
| `confirmGenerate` | Confirm and Generate | تأكيد وإنشاء |

### 3.7a Generation Options Labels

| Key | English | Arabic |
|-----|---------|--------|
| `optionsTitle` | Generation Options | خيارات الإنشاء |
| `issueDateLabel` | Issue Date | تاريخ الإصدار |
| `issueDatePastError` | Issue date cannot be in the past | لا يمكن أن يكون تاريخ الإصدار في الماضي |
| `expiryDateLabel` | Expiry Date (optional) | تاريخ الانتهاء (اختياري) |
| `expiryDateAfterIssueError` | Expiry date must be after the issue date | يجب أن يكون تاريخ الانتهاء بعد تاريخ الإصدار |
| `numberingLabel` | Certificate Numbering | ترقيم الشهادات |
| `numberingAuto` | Auto-increment from last issued | زيادة تلقائية من آخر شهادة |
| `numberingCustom` | Custom prefix | بادئة مخصصة |
| `numberingPrefixLabel` | Prefix | البادئة |
| `pdfQualityLabel` | PDF Quality | جودة PDF |
| `pdfQualityDraft` | Draft (72 DPI) | مسودة (72 DPI) |
| `pdfQualityStandard` | Standard (150 DPI) | قياسي (150 DPI) |
| `pdfQualityHigh` | High (300 DPI) | عالي (300 DPI) |
| `sendEmailLabel` | Send notification email to recipients | إرسال بريد إلكتروني للأشعار للمستلمين |
| `generateQRLabel` | Generate QR code for verification | إنشاء رمز QR للتحقق |
| `optionsMissingValidationError` | Please fix the errors in generation options | يرجى إصلاح الأخطاء في خيارات الإنشاء |

### 3.7b Review Labels

| Key | English | Arabic |
|-----|---------|--------|
| `reviewTitle` | Review | مراجعة |
| `reviewTemplate` | Template | القالب |
| `reviewRecipients` | Recipients | المستلمون |
| `reviewVariables` | Variables | المتغيرات |
| `reviewOptions` | Generation Options | خيارات الإنشاء |
| `reviewIssueDate` | Issue Date | تاريخ الإصدار |
| `reviewExpiryDate` | Expiry Date | تاريخ الانتهاء |
| `reviewNumbering` | Numbering | الترقيم |
| `reviewPdfQuality` | PDF Quality | جودة PDF |
| `reviewSendEmail` | Send Email | إرسال بريد |
| `reviewGenerateQR` | QR Code | رمز QR |
| `reviewYes` | Yes | نعم |
| `reviewNo` | No | لا |
| `estimatedTimeLabel` | Estimated Time | الوقت المقدر |
| `estimatedTimeValue` | ~{minutes} minutes | ~{minutes} دقيقة |
| `largeBatchWarning` | Large batch — generation may take significant time. Please review before proceeding. | دفعة كبيرة — قد يستغرق الإنشاء وقتاً طويلاً. يرجى المراجعة قبل المتابعة. |

### 3.8 Progress Labels

| Key | English | Arabic |
|-----|---------|--------|
| `progressTitle` | Generating Certificates... | جارٍ إنشاء الشهادات... |
| `progressSubtitle` | Please do not close this dialog | لا تغلق هذا الحوار |
| `progressComplete` | `{percent}`% complete | `{percent}% مكتمل` |
| `progressProcessed` | `{processed}` of `{total}` processed | `{processed} من {total} تمت معالجتها` |
| `progressRecipientPending` | Pending | في الانتظار |
| `progressRecipientProcessing` | Processing... | جارٍ المعالجة... |
| `progressRecipientGenerating` | Generating... | جارٍ الإنشاء... |
| `progressRecipientSuccess` | Success | نجح |
| `progressRecipientError` | Error: `{message}` | خطأ: `{message}` |
| `progressRecipientDownloadLink` | Download | تنزيل |
| `progressRetrying` | Retrying... | إعادة المحاولة... |
| `progressPausedLabel` | Paused | متوقف مؤقتاً |
| `progressCancelledLabel` | Cancelled | ملغى |
| `progressPollingError` | Failed to fetch progress updates. Retrying... | فشل في جلب تحديثات التقدم. إعادة المحاولة... |

### 3.9 Report Labels

| Key | English | Arabic |
|-----|---------|--------|
| `reportTitle` | Generation Report | تقرير الإنشاء |
| `reportSuccessTitle` | Generation Complete | اكتمل الإنشاء |
| `reportPartialTitle` | Generation Complete with Errors | اكتمل الإنشاء مع أخطاء |
| `reportFailedTitle` | Generation Failed | فشل الإنشاء |
| `reportTotalGenerated` | Total Generated | إجمالي المنشأة |
| `reportSuccessCount` | Success: `{count}` | نجاح: `{count}` |
| `reportFailureCount` | Failures: `{count}` | فشل: `{count}` |
| `reportDuration` | Duration: `{duration}` | المدة: `{duration}` |
| `reportFailureRecipientHeader` | Recipient | المستلم |
| `reportFailureErrorHeader` | Error | الخطأ |
| `reportNoFailures` | All certificates generated successfully | تم إنشاء جميع الشهادات بنجاح |
| `reportAllFailed` | All certificates failed to generate | فشل إنشاء جميع الشهادات |

### 3.10 Error Labels

| Key | English | Arabic |
|-----|---------|--------|
| `errorNetwork` | Network error — please check your connection and retry | خطأ في الشبكة — يرجى التحقق من الاتصال وإعادة المحاولة |
| `errorPermission` | You do not have permission to generate certificates | ليس لديك صلاحية لإنشاء الشهادات |
| `errorTemplateNotFound` | The selected template no longer exists | القالب المحدد لم يعد موجوداً |
| `errorRecipientsNotFound` | Some recipients could not be found | تعذر العثور على بعض المستلمين |
| `errorVariableValidation` | Variable validation failed: `{details}` | فشل التحقق من المتغيرات: `{details}` |
| `errorGeneric` | An unexpected error occurred | حدث خطأ غير متوقع |

### 3.11 Pluralization — Group Member Count

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 أعضاء` |
| `one` | n = 1 | `1 عضو` |
| `two` | n = 2 | `2 عضوان` |
| `few` | 3 ≤ n ≤ 10 | `5 أعضاء` |
| `many` | 11 ≤ n ≤ 99 | `25 عضواً` |
| `other` | n ≥ 100 | `150 عضواً` |

English: `one` → `1 member`, `other` → `N members`

**Key**: `groupMemberCount` takes a number parameter and returns a localized string.

### 3.12 Pluralization — Selected Recipients Count

For `dashboard.certificates.generation.recipientSelectedCount` (used in the selected recipients badge):

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 محدد` |
| `one` | n = 1 | `1 محدد` |
| `two` | n = 2 | `2 محددان` |
| `few` | 3 ≤ n ≤ 10 | `5 محددين` |
| `many` | 11 ≤ n ≤ 99 | `25 محدداً` |
| `other` | n ≥ 100 | `150 محدداً` |

English: `one` → `1 selected`, `other` → `N selected`

### 3.13 Pluralization — Show All Members Link

For `groupShowAllMembers` (expansion link):

| Count Category | English | Arabic |
|----------------|---------|--------|
| `one` | Show all 1 member | عرض جميع العضو |
| `other` | Show all {count} members | عرض جميع {count} عضو |

### 3.14 Interpolation Parameters

| Key | Parameters | Template |
|-----|------------|----------|
| `templateCardVariables` | `count: number` | English: "`{count}` variables", Arabic: "`{count}` متغير" (pluralized) |
| `templateCardCategory` | `category: string` | English: "Category: `{category}`", Arabic: "الفئة: `{category}`" |
| `groupMemberCount` | `count: number` | Pluralized per §3.11 |
| `groupShowAllMembers` | `count: number` | Pluralized per §3.13 |
| `summaryIndividualRecipients` | `count: number` | English: "Individual: `{count}`", Arabic: "أفراد: `{count}`" |
| `summaryGroupRecipients` | `count: number` | English: "Group: `{count}`", Arabic: "مجموعة: `{count}`" |
| `summaryClassRecipients` | `count: number` | English: "Class: `{count}`", Arabic: "فصل: `{count}`" |
| `summaryCsvRecipients` | `count: number` | English: "CSV Upload: `{count}`", Arabic: "رفع CSV: `{count}`" |
| `summaryTotalRecipients` | `count: number` | English: "Total: `{count}`", Arabic: "الإجمالي: `{count}`" |
| `csvValidRows` | `count: number` | Pluralized per §3.14a |
| `csvInvalidRows` | `count: number` | Pluralized per §3.14b |
| `classStudentCount` | `count: number` | Pluralized per §3.14c |
| `classShowAllStudents` | `count: number` | Pluralized: English `one`→"Show all 1 student", `other`→"Show all {count} students"; Arabic `one`→"عرض جميع الطالب", `other`→"عرض جميع {count} طالب" |
| `progressComplete` | `percent: number` | English: "`{percent}`% complete", Arabic: "`{percent}% مكتمل`" |
| `progressProcessed` | `processed: number, total: number` | English: "`{processed}` of `{total}` processed", Arabic: "`{processed} من {total} تمت معالجتها`" |
| `progressRecipientError` | `message: string` | English: "Error: `{message}`", Arabic: "خطأ: `{message}`" |
| `estimatedTimeValue` | `minutes: number` | English: "~{minutes} minutes", Arabic: "~{minutes} دقيقة" |
| `reportSuccessCount` | `count: number` | English: "Success: `{count}`", Arabic: "نجاح: `{count}`" |
| `reportFailureCount` | `count: number` | English: "Failures: `{count}`", Arabic: "فشل: `{count}`" |
| `reportDuration` | `duration: string` | English: "Duration: `{duration}`", Arabic: "المدة: `{duration}`" |
| `certificateProcessedCount` | `count: number` | Pluralized per §3.14d |
| `certificateDownloaded` | `count: number` | Pluralized per §3.14e |
| `errorVariableValidation` | `details: string` | English: "Variable validation failed: `{details}`", Arabic: "فشل التحقق من المتغيرات: `{details}`" |

### 3.14a Pluralization — CSV Valid Rows

For `csvValidRows`:

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 صفوف صالحة` |
| `one` | n = 1 | `1 صف صالح` |
| `two` | n = 2 | `2 صفان صالحان` |
| `few` | 3 ≤ n ≤ 10 | `5 صفوف صالحة` |
| `many` | 11 ≤ n ≤ 99 | `25 صفاً صالحاً` |
| `other` | n ≥ 100 | `150 صفاً صالحاً` |

English: `one` → `1 valid row`, `other` → `N valid rows`

### 3.14b Pluralization — CSV Invalid Rows Excluded

For `csvInvalidRows`:

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `تم استبعاد 0 صف غير صالح` |
| `one` | n = 1 | `تم استبعاد 1 صف غير صالح` |
| `two` | n = 2 | `تم استبعاد 2 صفين غير صالحين` |
| `few` | 3 ≤ n ≤ 10 | `تم استبعاد 5 صفوف غير صالحة` |
| `many` | 11 ≤ n ≤ 99 | `تم استبعاد 25 صفاً غير صالح` |
| `other` | n ≥ 100 | `تم استبعاد 150 صفاً غير صالح` |

English: `one` → `1 invalid row excluded`, `other` → `N invalid rows excluded`

### 3.14c Pluralization — Class Student Count

For `classStudentCount`:

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 طلاب` |
| `one` | n = 1 | `1 طالب` |
| `two` | n = 2 | `2 طالبان` |
| `few` | 3 ≤ n ≤ 10 | `5 طلاب` |
| `many` | 11 ≤ n ≤ 99 | `25 طالباً` |
| `other` | n ≥ 100 | `150 طالباً` |

English: `one` → `1 student`, `other` → `N students`

### 3.14d Pluralization — Certificate Processed Count

For `certificateProcessedCount` (used in Step 6 progress bar "X of Y processed"):

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 شهادة معالجة` |
| `one` | n = 1 | `1 شهادة معالجة` |
| `two` | n = 2 | `2 شهادتان معالجتان` |
| `few` | 3 ≤ n ≤ 10 | `5 شهادات معالجة` |
| `many` | 11 ≤ n ≤ 99 | `25 شهادة معالجة` |
| `other` | n ≥ 100 | `150 شهادة معالجة` |

English: `one` → `1 certificate processed`, `other` → `N certificates processed`

### 3.14e Pluralization — Certificate Downloaded Count

For `certificateDownloaded` (used in ZIP download confirmation):

| Count Category | Condition (Arabic) | Example Output |
|----------------|-------------------|----------------|
| `zero` | n = 0 | `0 شهادة منزّلة` |
| `one` | n = 1 | `1 شهادة منزّلة` |
| `two` | n = 2 | `2 شهادتان منزّلتان` |
| `few` | 3 ≤ n ≤ 10 | `5 شهادات منزّلة` |
| `many` | 11 ≤ n ≤ 99 | `25 شهادة منزّلة` |
| `other` | n ≥ 100 | `150 شهادة منزّلة` |

English: `one` → `1 certificate downloaded`, `other` → `N certificates downloaded`

---

## 4. Acceptance Criteria

### AC-17.1: Dialog opens from list page
**Given** a user with `CertificateBatchGenerate` permission (key: `certificates.batch_generate`) is on the Certificate List page, **When** they click "Generate", **Then** the Generation Dialog opens as a modal with Step 1 active and steps 2-6 disabled.

### AC-17.2: Dialog opens from template page
**Given** a user is on a Template Detail page, **When** they click "Generate from Template", **Then** the dialog opens with the template pre-selected and optionally auto-advances to Step 2.

### AC-17.3: Template selection
**Given** Step 1 is active, **When** templates are loaded, **Then** published templates appear as selectable cards with name, preview, category, and variable count. Searching filters the list. Selecting a template enables "Next".

### AC-17.4: Individual recipient selection
**Given** Step 2 is active with "Individual Recipients" mode, **When** the user searches and selects recipients, **Then** the selected count appears, each recipient is removable, and "Next" enables when ≥ 1 selected.

### AC-17.5: Group recipient selection
**Given** Step 2 is active with "Recipients from Group" mode, **When** the user selects a group, **Then** the member count and preview list (up to 50) appear, with "Show all" expanding the full list.

### AC-17.6: Class recipient selection
**Given** Step 2 is active with "Recipients from Class" mode, **When** the user selects a class, **Then** all enrolled students are auto-selected, the student count badge appears, and a preview list (up to 50) shows with "Show all" expansion.

### AC-17.7: CSV upload with preview and column mapping
**Given** Step 2 is active with "CSV Upload" mode, **When** the user drops or selects a `.csv` file, **Then** the file is parsed client-side, a preview table shows the first 10 rows, and a column mapping panel auto-maps `name` and `email` columns with remapping dropdowns. Invalid rows (missing name or invalid email) are flagged and excluded. The valid/invalid row counts are displayed. "Next" enables when ≥ 1 valid row exists.

### AC-17.8: Variable mapping
**Given** Step 3 is active, **When** the template has variables, **Then** each variable renders with the correct input type (TEXT/NUMBER/DATE/SELECT), source field hints, default values, and required validation.

### AC-17.9: Variable mapping skipped when no variables
**Given** the selected template has zero variables, **When** the user clicks "Next" in Step 2, **Then** the wizard advances directly to Step 4 (skipping Step 3), and the stepper shows only 5 steps.

### AC-17.10: Generation options step
**Given** Step 4 (Generation Options) is displayed, **When** the form renders, **Then** it shows: issue date (default today, date picker, no past dates), expiry date (visible only if template `expiryEnabled` is true, must be after issue date), certificate numbering (radio: auto-increment default, or custom prefix text input), PDF quality dropdown (Draft 72/Standard 150 default/High 300 DPI), send notification email checkbox (unchecked), generate QR code checkbox (checked). All date values are ISO 8601 strings.

### AC-17.11: Review step — complete summary
**Given** Step 5 (Review) is displayed, **When** the summary loads, **Then** it shows: template name + thumbnail, recipient count with mode breakdown (individual, group, class, CSV), variable mappings summary, generation options summary, estimated generation time (recipientCount × avgRenderMsPerRecipient), and the "Generate" button.

### AC-17.12: Large batch warning on review
**Given** the total recipient count exceeds 100, **When** Step 5 renders, **Then** a `largeBatchWarning` alert banner appears above the summary.

### AC-17.13: Generation progress with poll
**Given** the user clicks "Generate" in Step 5, **When** the `generateBatch` mutation creates a `certificate_batch_jobs` row and returns a job ID, **Then** the wizard transitions to Step 6, polls `certificateBatchJob(id)` at 2s intervals, and displays an overall progress bar (X of Y completed) and per-certificate status list.

### AC-17.14: Pause / Resume / Cancel
**Given** Step 6 is in progress, **When** the user clicks "Pause", **Then** the batch job pauses and a `progressPaused` indicator shows. **When** the user clicks "Resume", **Then** normal progress resumes. **When** the user clicks "Cancel" and confirms the dialog, **Then** the job status is set to `failed` with reason `cancelled`, a `progressCancelled` indicator shows, and the cron worker (Plan 22) stops processing.

### AC-17.15: Per-certificate retry
**Given** an individual certificate entry shows an error status, **When** the user clicks the inline "Retry" button, **Then** `generateCertificate` is called with that recipient's `studentId` and the same configuration, and the entry's status updates to generating then success or error.

### AC-17.16: Download all as ZIP
**Given** the batch job completes with one or more successful certificates, **When** the user clicks "Download All (ZIP)", **Then** a ZIP archive containing all successful certificate PDFs is downloaded.

### AC-17.17: All-success report
**Given** all certificates generate successfully, **When** the batch job status transitions to `completed`, **Then** the report shows success count and duration, with a "Done" button that closes the dialog and navigates to the certificate list page.

### AC-17.18: Partial failure report
**Given** some certificates fail, **When** the batch job completes, **Then** the report shows success count, failure count, and a failure table with per-recipient error messages, with inline per-certificate "Retry", "Retry Failed", "Download All (ZIP)", and "Done" buttons.

### AC-17.19: Retry failed
**Given** a partial failure report is displayed, **When** the user clicks "Retry Failed", **Then** only failed recipients' `studentId` UUIDs are re-submitted as a new `generateBatch` job, and the report updates with merged results.

### AC-17.20: Cancel with unsaved data
**Given** the user has entered data in any step (1-5), **When** they click "Cancel", **Then** a confirmation prompt appears. Confirming closes the dialog and discards data. Canceling returns to the wizard.

### AC-17.21: Keyboard accessibility
**Given** the dialog is open, **When** the user navigates with Tab/Shift+Tab, **Then** focus is trapped within the dialog. Pressing Escape before generation (Steps 1-5) shows the unsaved-changes prompt (if data exists). During generation (Step 6), Escape is blocked with a warning.

### AC-17.22: Mobile full-screen dialog
**Given** the dialog is open on a mobile device (width < 768px), **When** it renders, **Then** it displays as a full-screen dialog with a condensed step indicator.

### AC-17.23: Escape during generation
**Given** generation is in progress (Step 6), **When** the user presses Escape, **Then** the dialog does NOT close and a warning toast appears: "Generation in progress — please wait".

### AC-17.24: i18n Arabic
**Given** the locale is set to Arabic, **When** the dialog renders, **Then** all labels, step names (6 steps), progress messages, pause/resume/cancel controls, report headers, CSV upload messages, class selection labels, generation options labels, review labels, and error messages appear in Arabic with correct RTL layout and pluralization (including `certificateProcessedCount` and `certificateDownloaded`).

### AC-17.25: No permission
**Given** a user without `CertificateBatchGenerate` permission (key `certificates.batch_generate`), **When** they view the certificate list page, **Then** the "Generate" button is not visible.

### AC-17.26: Focus management
**Given** the dialog opens, **When** it becomes visible, **Then** focus moves to the first interactive element. When it closes, **Then** focus returns to the element that triggered the dialog.

### AC-17.27: 6-step wizard navigation
**Given** the dialog opens with 6 steps (or 5 if no template variables), **When** the user navigates through Steps 1→2→3→4→5→6 (or 1→2→4→5→6 if no variables), **Then** each step validates before advancing, the stepper shows the correct number of steps, and data is preserved on Back navigation at every step.

---

## 4. Round 2 Enhancement — Additional Acceptance Criteria

### 4.1 Generation Wizard UX — Detailed Specifications

### AC-17.28: Multi-step wizard with all steps
**Given** the user opens the certificate generation dialog, **When** it renders, **Then** it displays a multi-step wizard with steps: Template Selection → Recipient Selection → Variable Mapping → Generation Options → Review & Generate → Progress & Report (6 steps total, or 5 if Variable Mapping is skipped).

### AC-17.29: Template Selection step — search and preview
**Given** the user is on the Template Selection step, **When** they view the step, **Then** they see available templates with thumbnail previews, category badges, and a search input with 300ms debounce filtering.

### AC-17.30: Template selection highlight
**Given** the user clicks a template card, **When** the selection changes, **Then** the card is highlighted with the primary border color and the "Next" button becomes enabled.

### AC-17.31: Recipient Selection step — three modes
**Given** the user is on the Recipient Selection step, **When** they view the step, **Then** they see three mode tabs: Individual Selection, Group Selection, and CSV Upload.

### AC-17.32: Individual mode — searchable list with checkboxes
**Given** the user selects Individual mode, **When** the mode activates, **Then** they see a searchable list of individual recipients with checkboxes for multi-selection.

### AC-17.33: Group mode — groups with member counts
**Given** the user selects Group mode, **When** the mode activates, **Then** they see available recipient groups with member counts displayed, and selecting a group shows its members in a preview panel.

### AC-17.34: CSV Upload mode — dropzone and template
**Given** the user selects CSV Upload mode, **When** the mode activates, **Then** they see a file dropzone with drag-and-drop support, a "Browse" button, and a "Download CSV Template" button.

### AC-17.35: CSV preview with validation status
**Given** the user uploads a CSV file, **When** parsing completes, **Then** they see a preview table showing each row's recipient data with a validation status (valid/invalid) and error messages for invalid rows.

### AC-17.36: Variable Mapping step — mapping UI and preview
**Given** the user is on the Variable Mapping step, **When** the step renders, **Then** they see each template variable with its default value (from template) and an editable override field, plus a live preview of the rendered certificate with sample data.

### AC-17.37: Variable Mapping step skipped when no variables
**Given** the selected template has zero variables, **When** the user advances from Step 2, **Then** the wizard skips Step 3 entirely and proceeds directly to Step 4 (Generation Options), adjusting the stepper to show only 5 steps.

### AC-17.38: Generation Options step — all fields specified
**Given** the user is on the Generation Options step, **When** the step renders, **Then** they see all fields: Issue Date (date picker, default today, no past dates), Expiry Date (conditional on template.expiryEnabled), Certificate Numbering (radio: Auto-increment / Custom prefix + text input), PDF Quality (dropdown: Draft/Standard/High), Send Notification Email (checkbox), Generate QR Code (checkbox, default checked).

### AC-17.39: Review step — complete summary with edit links
**Given** the user reaches the Review step, **When** the step renders, **Then** they see a complete summary: template name + thumbnail, recipient count with mode breakdown (individual/group/class/CSV), variable mappings (overridden variables listed or "no overrides" note), generation options summary, and "Edit" links next to each section that navigate back to the corresponding step.

### AC-17.40: Large batch warning on Review
**Given** the total recipient count exceeds 100, **When** the Review step renders, **Then** an alert banner appears above the summary warning that large batches may take significant time, with estimated time formula: `recipientCount × avgRenderMsPerRecipient`.

### AC-17.41: Progress step — overall progress bar and per-certificate status
**Given** generation starts and the Progress step displays, **When** the job is running, **Then** the UI shows: an overall progress bar with "X of Y completed" and percentage, a per-certificate status list showing recipient name with status indicator (pending/generating/success/error), and successful entries show a download link.

### AC-17.42: Pause / Resume / Cancel controls during generation
**Given** the batch job is in progress, **When** the Progress step displays, **Then** the UI shows: "Pause" button (calls pause mutation, shows paused state indicator), "Resume" button (when paused, calls resume mutation), and "Cancel" button (shows confirmation dialog with title/message, on confirm sets job status to failed with reason "cancelled").

### AC-17.43: Per-certificate retry for failed items
**Given** an individual certificate fails (status "error"), **When** the Progress step displays, **Then** an inline "Retry" button appears next to that entry; clicking it calls `generateCertificate` with that single recipient's studentId and the same configuration, updating the entry's status upon completion.

### AC-17.44: Post-generation summary — success, partial, failed
**Given** the batch job completes, **When** the Progress step transitions to report state, **Then**:
- If all succeeded: shows success count, generation duration, "Download All (ZIP)" button, "Done" button.
- If partial success: shows success count, failure count, per-recipient failure table (name, email, translated error), inline "Retry" buttons per failed item, "Retry Failed" button (re-submits only failed recipients), "Download All (ZIP)" for successful items, "Done" button.
- If all failed or cancelled: shows failure reason, "Retry All" button (creates new batch job with same config), "Done" button.

### AC-17.45: Background generation mechanism — async job with polling
**Given** the user clicks "Generate" on Review step, **When** the `generateBatch` mutation is called, **Then** it creates a `certificate_batch_jobs` row with status "pending", returns immediately with the job ID, and the UI polls `certificateBatchJob(id)` at 2-second intervals until status transitions to "completed" or "failed".

### AC-17.46: PDF generation pipeline — Puppeteer, HTML template, Arabic fonts
**Given** the backend processes a certificate batch job, **When** generating PDFs, **Then** the pipeline uses Puppeteer with an HTML template, loads Arabic fonts (e.g., Amiri, Noto Sans Arabic) via `@font-face` in the template, renders each certificate to PDF with the selected quality DPI, and embeds the QR code at the designated position.

### AC-17.47: QR code generation — URL pattern, error correction, placement
**Given** the "Generate QR Code" option is enabled, **When** certificates are generated, **Then** a QR code is created per certificate using the verification URL pattern `/verify/{certificateId}`, error correction level "M" (15%), sized at 40×40mm, and placed at the bottom-right of the certificate with 10mm margin.

### AC-17.48: Certificate numbering pattern — auto-increment and custom prefix
**Given** the user selects a numbering mode, **When** certificates are generated, **Then**:
- Auto-increment: backend service reads the last issued certificate number and increments sequentially.
- Custom prefix: user provides a string prefix (e.g., "CERT-2025-") which is prepended to the auto-incremented number; the UI sends only the prefix string.

### AC-17.49: Batch size configuration — default and capped limits
**Given** the generation job starts, **When** the batch size is determined, **Then** the system uses a default batch size of 50 certificates per worker cycle, with a hard cap of 500 per single `generateBatch` call (larger requests must be split by the UI or rejected with validation).

### AC-17.50: Download All (ZIP) button — generation and expiry
**Given** at least one certificate succeeds, **When** the user clicks "Download All (ZIP)", **Then** the backend generates a ZIP archive containing all successful certificate PDFs, streams it as a download with filename `certificates-{jobId}-{timestamp}.zip`, and the ZIP generation is idempotent (same jobId returns same archive).

### 4.2 Accessibility Enhancements

### AC-17.51: Keyboard navigation between wizard steps
**Given** the user navigates the wizard via keyboard, **When** they press Tab/Shift+Tab, **Then** focus moves logically through all interactive elements; Enter/Space activates buttons; Arrow keys navigate stepper steps when stepper has focus.

### AC-17.52: Screen reader announcements for step changes
**Given** the user is using a screen reader, **When** the wizard step changes, **Then** the new step name is announced via an `aria-live="polite"` region.

### AC-17.53: Screen reader announcements for progress milestones
**Given** the user is using a screen reader, **When** generation progress reaches 25%, 50%, 75%, 100%, **Then** the milestone is announced via an `aria-live="polite"` region.

### 4.3 Mobile Enhancements

### AC-17.54: Full-screen mobile dialog with condensed stepper
**Given** the dialog is open on mobile (width < 768px), **When** it renders, **Then** it displays as a full-screen dialog with a condensed vertical step indicator (dots with labels) instead of the horizontal desktop stepper.

### AC-17.55: Mobile progress tracker — collapsed to overall progress
**Given** generation is in progress on mobile, **When** the Progress step displays, **Then** the per-certificate list is hidden by default and only the overall progress bar with percentage is shown; a "Show Details" toggle expands the list.

### AC-17.56: Mobile CSV upload — camera/file picker integration
**Given** the user is on mobile and selects CSV Upload mode, **When** they tap the dropzone, **Then** the native file picker opens with `accept=".csv"` allowing file selection from device storage.

### 4.4 Error Handling Enhancements

### AC-17.57: Network error on generate — retry without data loss
**Given** the `generateBatch` mutation returns a network error, **When** the error occurs, **Then** the wizard data is preserved, an error state displays with "Retry" button (re-attempts generation) and "Back" button (returns to Review step).

### AC-17.58: Permission error — disable generate button with message
**Given** the user lacks `CertificateBatchGenerate` permission, **When** they open the dialog, **Then** the "Generate" button on Review step is disabled and a localized permission error message is displayed.

### AC-17.59: Retry failed merges with prior successes
**Given** the user clicks "Retry Failed" after a partial failure, **When** the retry completes, **Then** the report updates with new results merged with prior successes, and the "Retry Failed" option remains available if new failures occur.

### AC-17.60: Close after partial failure — refetch certificate list
**Given** the user clicks "Done" after a partial failure, **When** the dialog closes, **Then** a refetch of the certificate list (Plan 16) is triggered to show newly generated certificates, with no confirmation prompt.
