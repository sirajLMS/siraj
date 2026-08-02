# Requirements: PDF Rendering Engine (Plan 06)

## Document Information

- **Feature Name**: Certificate PDF Rendering Engine
- **Target Directory**: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Siraj Development Team
- **Stakeholders**: Backend team, Certificate feature team, DevOps (Vercel deployment)
- **Related Documents**:
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/11-pdf-rendering-deps.md` — PDF/rendering dependency audit
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md` — CGVS generation pipeline reference (lines 651–663, 1015–1018)
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/07-storage-file-system.md` — Siraj storage system
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` — Service patterns (EntityCacheService, cachedReadSingleFlight)
  - Depends on: Plan 04 (Services & Business Logic)
  - Required by: Plan 07 (Template Management UI), Plan 08 (Certificate Generation & Verification UI)

## Introduction

The certificate feature requires a server-side PDF rendering engine that takes a certificate template (elements + positions) combined with recipient data (variable values) and produces a high-fidelity PDF file. This plan covers the rendering pipeline: HTML construction from template elements, QR code generation, Arabic/RTL font embedding, Puppeteer-based HTML→PDF conversion, storage integration, thumbnail generation, and render caching.

### Key Decision: Hybrid Approach

Based on the dependency analysis (`11-pdf-rendering-deps.md`), Siraj has **both** `pdfme` (template-driven PDF) and `puppeteer` (HTML→PDF) installed but unused. The decision is a **hybrid approach**:

- **pdfme template schema** (`@pdfme/ui`, `@pdfme/schemas`) — for the visual template editor UI (Plan 07), providing drag-and-drop element positioning, built-in schemas (text, image, QR, barcode), and the React designer component.
- **Puppeteer** (server-side HTML→PDF) — for final certificate PDF rendering, giving full HTML/CSS layout freedom, easy Arabic font embedding via `@font-face`, and high-fidelity output.

This leverages the already-installed dependencies without adding a competing rendering pipeline. The pdfme template schema stores element metadata (positions, types, properties) in the database; the rendering engine reads that schema and converts it to absolutely-positioned HTML, which Puppeteer renders to PDF.

### Feature Summary

Create 5 new files in `backend/services/certificates/`:
1. `renderer.service.ts` — `CertificateRendererService` namespace orchestrating the full render pipeline
2. `template-html-builder.ts` — utility to convert template elements to positioned HTML strings
3. `variable-resolver.ts` — resolve template variables from student/recipient data
4. `puppeteer-launcher.ts` — Puppeteer launch utility with `@sparticuz/chromium` for Vercel
5. `index.ts` — barrel export

Add 2 dependencies: `qrcode` (QR generation), `@sparticuz/chromium` (Vercel serverless Chromium).

Configure `vercel.json` for Puppeteer/Chromium serverless packaging.

### Business Value

- Produces high-quality, print-ready certificate PDFs with Arabic/RTL text support
- Enables certificate verification via QR codes encoding verification URLs
- Reuses existing storage pipeline (no new file-serving route needed)
- Caches render results to avoid duplicate expensive Puppeteer launches under concurrent requests
- Supports Vercel serverless deployment with `@sparticuz/chromium`

### Scope

**In Scope:**
- PDF rendering pipeline: Template + Recipient data → HTML → Puppeteer → PDF buffer → Storage file
- Template element-to-HTML conversion (text, image, QR code, shape elements)
- Arabic/RTL font embedding via `@font-face` in Puppeteer HTML
- QR code generation encoding verification URL
- Render caching via `cachedReadSingleFlight` with key `ec:cert:render:${templateVersionId}:${recipientGroupId}`
- Storage integration: save PDF to storage, link to certificate record via `StorageService.linkFileToEntity`
- Thumbnail generation via `sharp` (PNG preview)
- Vercel serverless packaging (`@sparticuz/chromium` + `vercel.json`)
- Variable resolution from student/recipient data
- Named cache invalidation helpers

**Out of Scope:**
- Template editor UI (Plan 07 — uses `@pdfme/ui` for the visual drag-and-drop designer)
- Certificate generation/verification UI (Plan 08)
- GraphQL mutations for triggering generation (Plan 05)
- Database schema for templates/elements (Plan 01)
- Repository layer for certificates (Plan 03)
- Service business logic for generation orchestration (Plan 04 — this plan provides the rendering engine that Plan 04's `CertificateGenerationService` calls)
- Frontend certificate preview components (Plan 07/08 — client-side preview uses positioned React elements, no html-to-image needed)

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome/<task-id>-outcome.md` detailing research findings, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

### Requirement 1: PDF Rendering Pipeline

**User Story:** As a certificate generation service, I want to render a certificate template with recipient data into a PDF file, so that certificates can be stored, downloaded, and printed at high quality.

#### Acceptance Criteria

1. WHEN `CertificateRendererService.renderPdf({ template, recipientGroup, locale })` is called THEN system SHALL resolve all template variables from recipient data, build an HTML string from template elements, launch Puppeteer, set the HTML content, and produce a PDF buffer.
2. WHEN the PDF buffer is produced THEN system SHALL save it to storage at path `public/certificates/${certificateId}.pdf`, create a storage file record via `StorageService.createFileAndGet`, and link it to the certificate record via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_pdf", filePath })`.
3. WHEN the PDF is saved THEN system SHALL compute a SHA-256 content hash and file size, returning `{ filePath, fileSize, contentHash }` to the caller.
4. WHEN the rendering pipeline encounters an error at any stage (variable resolution, HTML building, Puppeteer launch, PDF generation, storage write) THEN system SHALL throw a localized error using `tErrors.cert.*` namespace keys via `getServerTranslations(locale, "errors")`.
5. WHEN the rendering pipeline completes THEN system SHALL log success metrics (file size, render duration, template version ID, recipient group ID) via `logger.info` from `@/backend/lib/logger` (NEVER `console.*`).
6. WHEN `renderHtml({ template, variables, locale })` is called independently THEN system SHALL return the HTML string WITHOUT launching Puppeteer, enabling reuse for previews and debugging.
7. IF the template contains no elements THEN system SHALL throw a localized error `tErrors.cert.templateEmpty` with a descriptive message.

### Requirement 2: Template Element Rendering

**User Story:** As a rendering engine, I want to convert each template element type into positioned HTML, so that the final PDF reflects the visual layout designed in the template editor.

#### Acceptance Criteria

1. WHEN a text element is rendered THEN system SHALL produce `<div style="position:absolute; left:{x}px; top:{y}px; font-size:{fontSize}px; color:{color}; font-family:{fontFamily}; text-align:{alignment}; width:{width}px">` with the resolved variable text injected as inner content.
2. WHEN a text element has RTL direction (Arabic locale or element-level `rtl` flag) THEN system SHALL add `direction: rtl;` and `unicode-bidi: embed;` to the inline style for proper Arabic text rendering.
3. WHEN an image element (logo, signature) is rendered THEN system SHALL produce `<img src="data:{mimeType};base64,{base64Data}" style="position:absolute; left:{x}px; top:{y}px; width:{width}px; height:{height}px" />` with the image data embedded as a base64 data URI.
4. WHEN a QR code element is rendered THEN system SHALL generate a QR code PNG encoding the verification URL (e.g., `https://{domain}/verify/{verificationCode}`), convert it to a base64 data URI, and produce `<img src="data:image/png;base64,{qrBase64}" style="position:absolute; left:{x}px; top:{y}px; width:{width}px; height:{height}px" />`.
5. WHEN a shape element (border, background panel) is rendered THEN system SHALL produce `<div style="position:absolute; left:{x}px; top:{y}px; width:{width}px; height:{height}px; border:{borderStyle} {borderWidth}px {borderColor}; background-color:{backgroundColor}; border-radius:{borderRadius}px">` with no inner content.
6. WHEN elements are ordered with `zIndex` THEN system SHALL apply `z-index: {zIndex}` in inline style to preserve layer ordering.
7. WHEN the template has a background image THEN system SHALL render it as the first element with `z-index: 0` covering the full template dimensions (`width: {templateWidth}px; height: {templateHeight}px`).
8. WHEN the template specifies a background color THEN system SHALL set it on the page body `<body style="background-color: {bgColor}">`.

### Requirement 3: Arabic/RTL Font Handling

**User Story:** As an Arabic-speaking academy, I want certificate PDFs to render Arabic text correctly with embedded fonts, so that certificates display Arabic names, course titles, and descriptions properly with correct glyph shaping and right-to-left direction.

#### Acceptance Criteria

1. WHEN the locale is `ar` (Arabic) THEN system SHALL inject `@font-face` declarations in the HTML `<head>` embedding Arabic-capable fonts (e.g., Amiri, Cairo, Tajawal) from local font files in `public/fonts/` as base64-encoded data URIs to ensure Puppeteer renders them without external network access.
2. WHEN an Arabic font is embedded THEN system SHALL set `font-family` on the body and text elements to the Arabic font name specified in the template or the default Arabic font.
3. WHEN Arabic text is rendered THEN system SHALL set `direction: rtl` on text elements whose content contains Arabic characters (detected via Unicode range `\u0600-\u06FF`).
4. WHEN a template explicitly sets `fontFamily` on a text element THEN system SHALL emit `font-family: {fontFamily}, {fallbackArabicFont}, sans-serif` to ensure correct font cascading.
5. WHEN font files are not found at `public/fonts/` THEN system SHALL log a warning via `logger.warn` and fall back to a system sans-serif font, never crashing the render pipeline.
6. IF an Arabic font file exceeds 2MB THEN system SHALL log a warning about embedded font size impact on PDF file size.

### Requirement 4: QR Code Generation

**User Story:** As a certificate recipient, I want a QR code on my certificate that encodes the verification URL, so that anyone can scan it to verify the certificate's authenticity online.

#### Acceptance Criteria

1. WHEN `CertificateRendererService.generateQrCode(verificationUrl)` is called THEN system SHALL produce a PNG buffer encoding the URL as a QR code using the `qrcode` npm package.
2. WHEN the QR code is generated THEN system SHALL use error correction level `M` (medium, ~15% redundancy) and a minimum size of 200x200 pixels for scannability.
3. WHEN the verification URL is empty or invalid THEN system SHALL throw a localized error `tErrors.cert.invalidVerificationUrl`.
4. WHEN the QR code buffer is produced THEN system SHALL convert it to a base64 data URI for embedding in HTML `<img>` tags.
5. WHEN a QR code element is present in the template THEN system SHALL resolve the verification URL from the certificate's verification code and the configurable base domain (from environment variable `NEXT_PUBLIC_APP_URL`).

### Requirement 5: Render Caching

**User Story:** As a system operator, I want render results to be cached so that concurrent generation requests for the same template version and recipient group do not launch multiple Puppeteer instances, reducing server load and cold-start cost.

#### Acceptance Criteria

1. WHEN `renderPdf` is called THEN system SHALL check the cache via `cachedReadSingleFlight` with key `ec:cert:render:${templateVersionId}:${recipientGroupId}` and TTL of 7 days (604800 seconds) before launching Puppeteer.
2. WHEN a cache hit occurs THEN system SHALL return the cached `{ filePath, fileSize, contentHash }` without launching Puppeteer or regenerating the PDF.
3. WHEN a cache miss occurs THEN system SHALL execute the full render pipeline and cache the result with tags `["cert:render", "cert:tmpl:${templateId}"]` for targeted invalidation.
4. WHEN a template is edited or a new version is created THEN system SHALL invalidate the cache by calling `invalidateCertificateTemplateWrite(templateId)` which invokes `invalidateTag("cert:tmpl:${templateId}")`.
5. WHEN a certificate is revoked THEN system SHALL invalidate the cache by calling `invalidateCertificateWrite(certificateId)`.
6. WHEN the cache provider (Redis or Postgres) fails THEN system SHALL fall through to the loader (full render) — the cache is fail-open per EntityCacheService contract.
7. WHEN permission checks are needed THEN system SHALL execute them BEFORE the cache lookup to ensure unauthorized users never receive cached render results.
8. WHEN `invalidateCertificateTemplateWrite(templateId)` is called THEN system SHALL wrap the `invalidateTag` call in `try/catch` and log failures via `logger.warn` without throwing.

### Requirement 6: Storage Integration

**User Story:** As a system, I want rendered PDFs stored in the existing storage system and linked to certificate records, so that files can be served via the existing storage file route without a new download endpoint.

#### Acceptance Criteria

1. WHEN the PDF buffer is produced THEN system SHALL save it to storage at path `public/certificates/${certificateId}.pdf` using the storage provider (local filesystem in dev, Vercel Blob in production).
2. WHEN the file is saved THEN system SHALL create a storage file record via `StorageService.createFileAndGet(filePath, false)`.
3. WHEN the storage file record exists THEN system SHALL link it to the certificate entity via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_pdf", filePath })`.
4. WHEN the certificate PDF needs to be served THEN system SHALL reuse the existing route `GET /api/storage/files/[[...path]]` — no new download route is needed.
5. WHEN the file path is constructed THEN system SHALL validate it via `StorageService.validatePath(filePath)` to prevent path traversal attacks.
6. WHEN a certificate is regenerated (e.g., template updated) THEN system SHALL unlink the old PDF file usage and link the new one, ensuring only one active PDF per certificate.

### Requirement 7: Thumbnail Generation

**User Story:** As a certificate management UI, I want a PNG thumbnail of the certificate PDF for preview display, so that users can see a quick preview without downloading the full PDF.

#### Acceptance Criteria

1. WHEN `CertificateRendererService.generateThumbnail(pdfBuffer)` is called THEN system SHALL produce a PNG thumbnail using the `sharp` npm package (already installed as dev dependency).
2. WHEN the thumbnail is generated THEN system SHALL resize the PDF first page to a maximum width of 400px while maintaining aspect ratio, outputting as PNG format.
3. WHEN the thumbnail is produced THEN system SHALL save it to storage at path `public/certificates/${certificateId}-thumb.png` and link it via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_thumbnail", filePath })`.
4. WHEN `sharp` cannot process the PDF buffer (format incompatibility) THEN system SHALL log a warning and fall back to rendering a blank placeholder thumbnail, never crashing the generation pipeline.
5. WHEN the thumbnail generation succeeds THEN system SHALL return `{ filePath, fileSize }` to the caller.

### Requirement 8: Vercel Serverless Compatibility

**User Story:** As a DevOps engineer, I want the Puppeteer-based rendering pipeline to work on Vercel serverless deployments, so that certificate generation works in production without a dedicated server.

#### Acceptance Criteria

1. WHEN the application is deployed to Vercel THEN system SHALL use `@sparticuz/chromium` as the Chromium binary for Puppeteer, configured in `puppeteer-launcher.ts`.
2. WHEN `puppeteer-launcher.ts` launches Puppeteer in a Vercel environment THEN system SHALL set `executablePath` to `chromium.executablePath()`, `args` to `chromium.args`, and `headless` to `chromium.headless`.
3. WHEN `puppeteer-launcher.ts` launches Puppeteer in local development THEN system SHALL use the default Puppeteer bundled Chromium with `headless: true` and no custom `executablePath`.
4. WHEN `vercel.json` is updated THEN system SHALL include `@sparticuz/chromium` in the `includedFiles` or `maxLambdaSize` configuration to ensure the Chromium binary is available in the serverless function.
5. WHEN the Puppeteer launch fails THEN system SHALL throw a localized error `tErrors.cert.renderFailed` and log the underlying error via `logger.error`.
6. WHEN the environment variable `VERCEL` is set THEN system SHALL detect Vercel deployment and use the Chromium path; otherwise use local development configuration.

### Requirement 9: Client-Side Image Preview

**User Story:** As a certificate management UI developer, I want to preview certificates client-side without server rendering, so that template editors can see a live preview as they design.

#### Acceptance Criteria

1. WHEN the frontend needs a certificate preview THEN the client SHALL render template elements as absolutely-positioned React components over the background image — NO `html-to-image` or server-side call is needed for preview.
2. WHEN a preview is requested THEN the client SHALL use the same element positioning data (x, y, width, height, fontSize, etc.) from the template schema to render React `<div>` / `<img>` components with matching inline styles.
3. WHEN the preview needs a QR code THEN the client SHALL generate it client-side using a lightweight QR library or request it from the server via the rendering service's `generateQrCode` API.
4. WHEN the final PDF is needed (download, print) THEN the client SHALL trigger server-side rendering via `renderPdf` — the preview is NEVER a substitute for the final PDF.
5. WHEN the preview is displayed THEN the client SHALL NOT make a Puppeteer call — preview is a direct React render of the template schema.

### Requirement 10: Variable Resolution

**User Story:** As a rendering engine, I want to resolve template variables from student/recipient data, so that each certificate has personalized content (name, course, date, grade, etc.).

#### Acceptance Criteria

1. WHEN `variable-resolver.ts` resolves a template variable THEN system SHALL look up the variable key (e.g., `student.name`, `course.title`, `issueDate`) from the recipient data context, which includes student profile data, course/program data, certificate metadata, and institution data.
2. WHEN a variable key contains a dot-path (e.g., `student.firstName`) THEN system SHALL traverse the data object to resolve the nested property.
3. WHEN a variable key is not found in the recipient data THEN system SHALL return an empty string and log a `logger.warn` with the unresolved key name — the render MUST NOT fail for a missing variable.
4. WHEN a variable resolves to a date THEN system SHALL format it using the locale-aware date formatter (Hijri for `ar` locale, Gregorian for `en` locale) using the existing `date-fns` + `moment-hijri` pattern from Siraj.
5. WHEN a variable resolves to a number (e.g., grade, score) THEN system SHALL format it according to the locale's number formatting conventions.
6. WHEN the variable resolver is called THEN it SHALL accept a `VariableResolutionContext` containing `{ student, course, program, certificate, institution, locale }` and return a `Map<string, string>` of resolved variable keys to display values.

### Requirement 11: Error Handling & Localization

**User Story:** As a developer, I want all rendering errors to use localized error messages, so that users see Arabic or English error messages depending on their locale.

#### Acceptance Criteria

1. WHEN any error is thrown in the rendering pipeline THEN system SHALL use `getServerTranslations(locale, "errors")` to obtain localized error strings from the `tErrors.cert.*` namespace.
2. WHEN a template is not found THEN system SHALL throw `new Error(tErrors.cert.templateNotFound(templateId))` with an interpolated, localized message.
3. WHEN a recipient group is empty or has no recipients THEN system SHALL throw `new Error(tErrors.cert.recipientGroupEmpty(recipientGroupId))`.
4. WHEN the Puppeteer launch fails THEN system SHALL throw `new Error(tErrors.cert.renderFailed)`.
5. WHEN the storage write fails THEN system SHALL throw `new Error(tErrors.cert.storageFailed)`.
6. WHEN the QR code generation fails THEN system SHALL throw `new Error(tErrors.cert.qrCodeFailed)`.
7. WHEN font embedding fails THEN system SHALL log a warning but NOT throw — the render pipeline continues with fallback fonts.
8. WHEN any error is thrown THEN system SHALL log it via `logger.error` with context (templateVersionId, recipientGroupId, error stack) before re-throwing.

### Requirement 12: Outcome Knowledge Base & Progress Tracking

**User Story:** As a subsequent AI agent or developer, I want each task outcome to be persisted, so that I can understand what decisions were made, what patterns were proven, and what gotchas were discovered without re-researching.

#### Acceptance Criteria

1. WHEN any task is completed THEN system SHALL write an outcome file under `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome/<task-id>-outcome.md` documenting: files created/modified, key decisions, patterns applied, gotchas discovered, and carry-over notes for subsequent tasks.
2. WHEN the outcome file references a specific pattern or decision THEN system SHALL include a link to the source analysis file and the relevant section/line numbers.
3. WHEN all tasks in this plan are completed THEN system SHALL produce a final outcome summary file `outcome/00-summary-outcome.md` with a plan-level overview of the rendering engine architecture, dependency choices, and Vercel considerations.
4. WHEN a subsequent plan (07, 08) starts THEN it SHALL read all outcome files in this plan's `outcome/` directory before beginning implementation.
5. WHEN an outcome file is written THEN it SHALL include the task ID, task title, completion date, and verification results (tsgo/lint/biome status).
