# Requirements — Plan 06: PDF Rendering Engine

## Document Information

| Field | Value |
|---|---|
| **Feature Name** | Certificate PDF Rendering Engine |
| **Plan #** | 06 |
| **Dependencies** | Plan 4 (Services & Business Logic — generation pipeline context) |
| **Dependents** | Plan 15 (Template Preview & Publishing), Plan 17 (Certificate Generation Dialog), Plan 18 (Certificate Detail & Download) |
| **Stakeholders** | Backend engineers, frontend engineers (Plan 15/17/18 consumers), QA |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/01-generation-logic.md`, `siraj_analysis/11-pdf-rendering-deps.md`, `siraj_analysis/07-storage-file-system.md` |

## Introduction

### Overview

Plan 06 implements the server-side PDF rendering pipeline that converts certificate templates into final PDF documents. The pipeline takes a template definition (dimensions, orientation, background image, positioned elements, variables) plus resolved variable values and produces a PDF binary stored in the Siraj storage system. The rendering uses Puppeteer (already installed) to launch a headless Chromium instance, inject an HTML representation of the template, and generate a PDF via `page.pdf()`.

### Business Value

The rendering engine is the core value-producing component of the certificate feature. Without it, templates are inert designs; with it, templates become personalized, verifiable, downloadable certificates. The engine must handle Arabic RTL text correctly, embed QR verification codes, render background images from storage, and support batch generation with progress tracking.

### Scope

| In Scope | Out of Scope |
|---|---|
| Template element → HTML/CSS conversion (all 6 element types) | Template visual editor canvas (Plan 11) |
| Variable resolution at render time (text, number, date, select) | Template element CRUD mutations (Plan 5) |
| Puppeteer browser lifecycle management | Public verification page UI (Plan 19) |
| QR code generation (data-URI embedding) | Certificate list/detail UI (Plans 16, 18) |
| Arabic font loading and RTL text rendering | Certificate generation dialog UI (Plan 17) |
| Background image fetching from storage and base64 embedding | Email delivery of PDF links (Plan 4) |
| PDF output to storage service + metadata recording | Signed URL access control (Plan 7) |
| Render caching (cache key = template version + variable hash) | File serving route (existing `app/api/storage/files/`) |
| Batch rendering with progress tracking | Storage provider abstraction (existing) |
| Error handling (render timeout, missing font, image load failure) | Cron jobs / scheduled renders (Plan 22) |
| PDF metadata (title, author, subject, keywords) | Client-side preview rendering (Plan 15) |
| Page size / orientation handling (A4 landscape/portrait, custom) | Image thumbnail generation (future scope) |
| Shape element rendering (rectangle, circle, line) | PDF digital signing (future scope) |
| `qrcode` npm package addition and configuration | |

---

## Requirements

### REQ-RENDER-01: Single-Certificate PDF Rendering

**WHEN** the generation pipeline (Plan 4) requests a PDF render for a single certificate
**THEN** the rendering engine SHALL:
1. Load the template definition (elements, dimensions, orientation, background, font settings)
2. Resolve all variable values from the certificate + recipient data
3. Convert each template element into positioned HTML with inline CSS
4. Generate QR code data-URI for any `qr_code` element
5. Fetch and base64-encode the background image from storage
6. Load Arabic fonts (if template has Arabic elements) and embed via `@font-face`
7. Launch Puppeteer, set HTML content, and produce a PDF buffer
8. Return the PDF buffer to the caller (generation pipeline / Plan 4)

**SHALL** produce a PDF that visually matches the template design at the configured page size and orientation.

**Acceptance Criteria:**
- AC1: Given a template with 4 elements (static_text, data_text, data_date, qr_code) and a resolved student, the output PDF contains all 4 elements at their specified X/Y positions
- AC2: Given a template with `width=1123, height=794` (A4 landscape at 96 DPI), the PDF page dimensions match
- AC3: If a variable value is missing for a required variable, the render aborts with a localized error
- AC4: If a variable value is missing for an optional variable, the element renders with its default value (or empty)
- AC5: The PDF contains embedded metadata: title = certificate name, author = institution, subject = "Certificate of Completion"

### REQ-RENDER-02: Element Type Rendering

**WHEN** the rendering engine converts template elements to HTML
**THEN** it SHALL render each element type as follows:

| Element Type | Rendering Approach |
|---|---|
| `static_text` | Escaped text content in a positioned div with font-size, color, alignment, font-family from element styling |
| `data_text` | Resolved dynamic text (from student/variable/certificate source) in a positioned div with element styling |
| `data_date` | Resolved date value formatted per element's `dateFormat` pattern (supports `YYYY-MM-DD`, `DD/MM/YYYY`, `Do MMMM YYYY`, Arabic `D MMMM YYYY`) |
| `image` | `<img>` tag with `src` from element's `imageUrl`, width/height from element, positioned absolutely |
| `qr_code` | QR code generated as SVG data-URI, encoded with the verification URL (`/verify/{code}`), sized per element's `size` property |
| `shape` | CSS-rendered shape (rectangle / circle / line) with fill color, border, opacity from element properties |

**SHALL** apply z-index ordering and rotation transforms per element properties.
**SHALL** apply RTL direction (`dir="rtl"`) for elements with `languageConstraint = "ar"`.

**Acceptance Criteria:**
- AC1: A static_text element with `x=100, y=200, fontSize=24, color="#0000FF", alignment="center"` renders as blue, centered, 24px text at coordinates (100, 200)
- AC2: A data_date element with `dateFormat="DD/MM/YYYY"` and source date `2025-03-15` renders as "15/03/2025"
- AC3: A data_date element with `dateFormat="D MMMM YYYY"` and Arabic locale renders the month name in Arabic
- AC4: A qr_code element with `size=100` produces a 100x100 pixel QR code encoding the verification URL
- AC5: A shape element of type `circle` with `fillColor="#FF0000"` renders as a red filled circle
- AC6: An element with `rotation=45` applies a 45-degree CSS transform rotation
- AC7: Elements with higher z-index appear above elements with lower z-index in the PDF

### REQ-RENDER-03: Arabic Font Handling and RTL

**WHEN** the template contains elements with `languageConstraint = "ar"` or the template's font family is an Arabic typeface
**THEN** the rendering engine SHALL:
1. Load the Arabic font file(s) from the configured font directory
2. Embed the font in the HTML via `@font-face` as a base64 data-URI
3. Apply `dir="rtl"` and `font-family` to all Arabic elements
4. Ensure proper glyph shaping and ligatures via Chromium's built-in HarfBuzz support

**SHALL** support at least two Arabic font families (e.g., Cairo, Amiri) configurable via environment.
**SHALL** fall back to a system default Arabic font if the configured font file is missing (logged as warning).

**Acceptance Criteria:**
- AC1: Given an Arabic static_text element with content "شهادة إتمام", the rendered PDF shows correctly shaped Arabic text (connected letters, right-to-left)
- AC2: Given an element with `languageConstraint = "ar"` and `alignment = "right"`, the text is right-aligned and right-to-left
- AC3: Given a missing Arabic font file, the render completes with a fallback font and logs a warning
- AC4: Given a mixed-locale template (one English element, one Arabic element), both render with correct direction and font

### REQ-RENDER-04: QR Code Generation

**WHEN** the rendering engine encounters a `qr_code` element
**THEN** it SHALL:
1. Determine the verification URL: `{app_base_url}/verify/{certificate.verificationCode}`
2. Generate a QR code encoding the URL using the `qrcode` npm library
3. Produce the QR as an SVG data-URI for embedding in the HTML
4. Render the QR at the element's position with the element's `size` dimension

**SHALL** handle errors from the QR library gracefully (return a localized error to the caller).
**SHALL** generate QR codes at sufficient error correction level (default: "M") for print reliability.

**Acceptance Criteria:**
- AC1: Given a verification code `CERT-ABC123`, the QR encodes `{baseUrl}/verify/CERT-ABC123`
- AC2: Given `size=120`, the QR SVG renders at 120x120 pixels
- AC3: If the `qrcode` library throws an error, the render fails with a localized "qr_generation_failed" error

### REQ-RENDER-05: Background Image Rendering

**WHEN** the template has a background image (`backgroundImageFileId` is not null)
**THEN** the rendering engine SHALL:
1. Fetch the image file metadata from the storage system (via `StorageService.fileInfoByDbFileId`)
2. Read the image bytes and base64-encode them
3. Embed the background as a CSS `background-image` on the page container with the correct MIME type
4. Scale the background to fill the template dimensions (`background-size: cover`)

**SHALL** skip background rendering (transparent PDF) if no background is configured.
**SHALL** return a localized error if the image file is not found in storage.

**Acceptance Criteria:**
- AC1: Given a JPEG background image, the PDF has the image covering the full page
- AC2: Given no background configured, the PDF has a transparent/white background
- AC3: Given a non-existent `backgroundImageFileId`, the render fails with localized "background_not_found" error

### REQ-RENDER-06: Variable Resolution

**WHEN** the rendering engine prepares the render context
**THEN** it SHALL resolve all variables referenced by `data_text` and `data_date` elements:

| Source Type | Resolution Path |
|---|---|
| `student` | Student record fields: `name`, `email`, `nationality`, `gender`, `dateOfBirth`, etc. |
| `variable` | Per-recipient variable values (from `recipient_group_item_variable_values`), falling back to template variable `previewValue` / default |
| `certificate` | Certificate fields: `verificationCode`, `releaseDate`, `issuedAt` |

**SHALL** apply the variable type (TEXT, NUMBER, DATE, SELECT) formatting rules:
- NUMBER: apply `decimalPlaces` from the number variable definition
- DATE: apply the element's `dateFormat` pattern (overrides variable-level format if present)
- SELECT: resolve the selected option's display label

**SHALL** produce a localized error if a required variable has no value and no default.

**Acceptance Criteria:**
- AC1: Given a data_text variable `courseName` with recipient value "Advanced Arabic Literature", the element text is "Advanced Arabic Literature"
- AC2: Given a data_date variable `completionDate` with value `2025-06-15` and format `Do MMMM YYYY`, the element renders "15th June 2025"
- AC3: Given a required variable with no per-recipient value and no default, the render fails with localized "missing_required_variable" error
- AC4: Given a NUMBER variable `grade` with value `95.5` and `decimalPlaces=1`, the text renders as "95.5"
- AC5: Given a SELECT variable `trackName` with selected option id=3, the text renders the option's display label

### REQ-RENDER-07: Render Caching

**WHEN** a render is requested for a certificate
**THEN** the rendering engine SHALL:
1. Compute a cache key from: `templateId + templateVersion + variableValuesHash + fontConfigHash`
2. Check the cache (in-memory or Postgres cache table) for an existing PDF buffer
3. If cache hit and not invalidated → return cached PDF bytes directly (no Puppeteer launch)
4. If cache miss → render, store result in cache, return

**SHALL** invalidate cached renders when:
- The template is updated (version increment invalidates all renders for that template version)
- The template is republished (new version published)
- The background image is changed

**SHALL** use a TTL-based expiry (default: 24 hours) as a secondary invalidation mechanism.
**SHALL** store cache entries as storage files with `usageType = "certificate_pdf_cache"` to avoid large blobs in Postgres.

**Acceptance Criteria:**
- AC1: Given a render request with a cached result, the engine returns the cached PDF without launching Puppeteer
- AC2: Given a template update (version bump), all cache entries for previous versions are invalidated
- AC3: Given a cache miss, the engine renders, caches, and returns the PDF
- AC4: Given a cache entry older than 24 hours, the entry is expired and re-rendered

### REQ-RENDER-08: Batch Rendering with Progress

**WHEN** the generation pipeline (Plan 4) requests batch rendering for a recipient group
**THEN** the rendering engine SHALL:
1. Accept a batch input: template, list of (certificate, resolved variables) pairs
2. Render each certificate PDF sequentially (to avoid Puppeteer resource contention)
3. Emit progress events: `render_started`, `render_completed (index, total)`, `render_failed (index, error)`
4. Return a batch result: array of `{ certificateId, pdfPath, success, error? }`

**SHALL** reuse a single Puppeteer browser instance across all renders in the batch (launch once, reuse page).
**SHALL** limit concurrent browser instances to 1 per process (semaphore guard).
**SHALL** stop batch on configurable `maxErrors` threshold (default: 5 consecutive failures).

**Acceptance Criteria:**
- AC1: Given a batch of 10 certificates, the engine renders all 10 and returns 10 results
- AC2: Given 3 of 10 certificates with render errors, the batch continues and reports 3 failures + 7 successes
- AC3: Given 6 consecutive failures (exceeding maxErrors=5), the batch aborts with a "batch_max_errors" error
- AC4: Given a batch of 3, only 1 Puppeteer browser instance is launched
- AC5: Progress events are emitted for each item (started + completed/failed)

### REQ-RENDER-09: Error Handling

**WHEN** a render fails
**THEN** the rendering engine SHALL categorize and return errors with localized messages:

| Error Code | Condition | i18n Key |
|---|---|---|
| `render_timeout` | Puppeteer page render exceeds configurable timeout (default: 30s) | `certificates.errors.render.timeout` |
| `font_not_found` | Configured Arabic font file missing and no fallback available | `certificates.errors.render.fontNotFound` |
| `image_load_failed` | Background or image element URL fails to load | `certificates.errors.render.imageLoadFailed` |
| `qr_generation_failed` | QR code library throws an error | `certificates.errors.render.qrFailed` |
| `background_not_found` | Background image file ID not found in storage | `certificates.errors.render.backgroundNotFound` |
| `missing_required_variable` | Required variable has no resolved value and no default | `certificates.errors.render.missingVariable` |
| `puppeteer_launch_failed` | Browser process fails to start | `certificates.errors.render.puppeteerFailed` |
| `batch_max_errors` | Batch exceeded maximum consecutive error threshold | `certificates.errors.render.batchMaxErrors` |

**SHALL** clean up Puppeteer browser instances on error (no zombie processes).
**SHALL** log all errors via `logger.error` with render context (templateId, certificateId, error code).

**Acceptance Criteria:**
- AC1: Given a Puppeteer timeout, the render returns `render_timeout` error after 30s (configurable)
- AC2: Given a missing font with no fallback, the render returns `font_not_found` error
- AC3: After any error, no Puppeteer browser process remains running
- AC4: All errors include localized messages matching the i18n keys

### REQ-RENDER-10: PDF Storage and Metadata

**WHEN** a PDF render completes successfully
**THEN** the rendering engine SHALL:
1. Write the PDF buffer to the storage service at path `certificates/{templateId}/{certificateId}.pdf`
2. Create a `storage_file` record (via `StorageService.createFile`)
3. Link the file to the certificate (via `registerFileUsage` with `usageType = "certificate_pdf"`)
4. Set PDF metadata: title (certificate name), author (institution name), subject ("Certificate"), keywords (template name, student name)
5. Return the storage file path and a download URL

**SHALL** use the existing storage provider abstraction (local, GCP, Vercel Blob).
**SHALL** not generate signed download URLs (Plan 7 handles signed URL generation for download access).

**Acceptance Criteria:**
- AC1: After render, a storage file exists at `certificates/{templateId}/{certificateId}.pdf`
- AC2: The storage file is linked to the certificate via `certificate_files` junction with `usageType = "certificate_pdf"`
- AC3: The PDF metadata contains the certificate name as the title
- AC4: Re-rendering the same certificate overwrites the previous PDF (same path, storage upsert)

### REQ-RENDER-11: Puppeteer Lifecycle Management

**WHEN** the rendering engine initializes
**THEN** it SHALL:
1. Configure Puppeteer with a launch binary path (from env `PUPPETEER_EXECUTABLE_PATH` or default)
2. Set headless mode (`new` headless mode)
3. Configure sandbox disabling for serverless environments (`--no-sandbox`, `--disable-setuid-sandbox`)
4. Set a argument set for performance: `--disable-gpu`, `--disable-dev-shm-usage`, `--single-process`
5. Implement a browser pool with lazy launch (browser launched on first render, reused, closed after idle timeout)

**SHALL** close the browser after a configurable idle timeout (default: 60 seconds).
**SHALL** handle browser crash/disconnect gracefully (restart on next render).

**Acceptance Criteria:**
- AC1: Given no active renders, the Puppeteer browser is not running
- AC2: Given a render request, the browser launches and the render completes
- AC3: After 60 seconds of idle (no renders), the browser process terminates
- AC4: Given a browser crash, the next render request launches a new browser successfully
- AC5: Given serverless env (`PUPPETEER_EXECUTABLE_PATH` set), the browser uses the external Chromium

### REQ-RENDER-12: Shape Element Rendering

**WHEN** the rendering engine encounters a `shape` element
**THEN** it SHALL render the shape using CSS based on the element's `shapeType`:

| Shape Type | CSS Approach |
|---|---|
| `rectangle` | Positioned div with `width`/`height`, `background-color` (fill), `border` (stroke + width) |
| `circle` | Positioned div with `border-radius: 50%`, `width`/`height` equal, `background-color` (fill) |
| `line` | Positioned div with `height` = stroke width, `background-color` = stroke color, rotation applied for diagonal lines |

**SHALL** apply opacity from the element's `opacity` property.
**SHALL** apply rotation from the element's `rotation` property (in degrees).

**Acceptance Criteria:**
- AC1: A rectangle shape with `width=200, height=100, fillColor="#0000FF"` renders as a 200x100 blue rectangle
- AC2: A circle shape with `width=80, height=80, fillColor="#00FF00"` renders as an 80x80 green circle
- AC3: A line shape with `width=300, strokeWidth=2, strokeColor="#FF0000"` renders as a 300x2 red line
- AC4: A shape with `opacity=0.5` renders at 50% opacity

---

## i18n Requirements

### Namespace: `certificates.errors.render`

Translation keys for rendering errors, accessed via `getServerTranslations(locale).errorsTranslations.certificate` in API/etc contexts.

| Key | Type | Interpolation | English | Arabic |
|---|---|---|---|---|
| `timeout` | string | — | "PDF rendering timed out. Please try again." | "انتهت مهلة عرض ملف PDF. يرجى المحاولة مرة أخرى." |
| `fontNotFound` | (fontFamily: string) => string | fontFamily | "Arabic font '{fontFamily}' not found. Please contact support." | "الخط العربي '{fontFamily}' غير موجود. يرجى الاتصال بالدعم." |
| `imageLoadFailed` | string | — | "Failed to load image for certificate rendering." | "فشل تحميل صورة لعرض الشهادة." |
| `qrFailed` | string | — | "Failed to generate QR code." | "فشل في إنشاء رمز QR." |
| `backgroundNotFound` | string | — | "Certificate background image not found." | "لم يتم العثور على صورة خلفية الشهادة." |
| `missingVariable` | (variableName: string) => string | variableName | "Required variable '{variableName}' has no value." | "المتغير المطلوب '{variableName}' ليس له قيمة." |
| `puppeteerFailed` | string | — | "PDF rendering engine failed to start." | "فشل تشغيل محرك عرض PDF." |
| `batchMaxErrors` | (maxErrors: number) => string | maxErrors | "Batch rendering stopped after {maxErrors} consecutive errors." | "توقف عرض الدفعة بعد {maxErrors} أخطاء متتالية." |

### Namespace: `certificates.generation` (render progress sub-domain)

| Key | Type | Interpolation | English | Arabic |
|---|---|---|---|---|
| `renderStarted` | string | — | "Rendering certificate PDF…" | "جاري عرض ملف PDF للشهادة…" |
| `renderCompleted` | (index: number, total: number) => string | index, total | "Rendered certificate {index} of {total}." | (pluralized — see below) |
| `renderFailed` | (index: number) => string | index | "Failed to render certificate {index}." | (pluralized — see below) |
| `batchComplete` | (successCount: number, failCount: number) => string | successCount, failCount | "Batch complete: {successCount} succeeded, {failCount} failed." | (pluralized — see below) |

### Arabic Pluralization Rules for Progress Messages

The `renderCompleted`, `renderFailed`, and `batchComplete` keys require Arabic pluralization per `shared/locale` rules:

- **renderCompleted (index, total):** Uses count = total → Arabic plural: `zero/one/two/few/many/other`
- **renderFailed (index):** Uses count = index → Arabic plural
- **batchComplete:** Two independent counts (successCount, failCount) → each pluralized independently

### Namespace: `certificates.dateFormats`

Date formatting labels for Arabic month names (used by `data_date` element rendering in Arabic locale):

| Key | Type | Notes |
|---|---|---|
| `monthNames` | readonly string[] | 12 Arabic month names initialized in type schema |
| `monthNamesShort` | readonly string[] | 12 short Arabic month names |
| `ordinalSuffix` | (day: number) => string | Arabic ordinal indicator (e.g., "الـ" prefix) |

### i18n Integration Points

- **Service layer**: `getServerTranslations(locale).errorsTranslations.certificate` for error messages thrown from the render service
- **Batch progress**: progress events include locale for progress message construction
- **Date formatting**: `data_date` element uses locale-specific month name arrays from `shared/locale` type schema
- **Type schema location**: `shared/locale/types/certificates/` — new type definitions for all `certificates.*` namespaces

---

## Acceptance Criteria Summary

| ID | Requirement | Description |
|---|---|---|
| AC-RENDER-01 | REQ-RENDER-01 | Single certificate render produces valid PDF with all elements |
| AC-RENDER-02 | REQ-RENDER-02 | Each element type renders correctly (text, date, image, QR, shape) |
| AC-RENDER-03 | REQ-RENDER-03 | Arabic text renders with correct shaping and RTL direction |
| AC-RENDER-04 | REQ-RENDER-04 | QR codes encode verification URL and render at specified size |
| AC-RENDER-05 | REQ-RENDER-05 | Background images render from storage, cover full page |
| AC-RENDER-06 | REQ-RENDER-06 | Variables resolve from student/variable/certificate sources with formatting |
| AC-RENDER-07 | REQ-RENDER-07 | Cache hits skip Puppeteer, invalidation works on template update |
| AC-RENDER-08 | REQ-RENDER-08 | Batch rendering produces all PDFs with progress tracking |
| AC-RENDER-09 | REQ-RENDER-09 | All error types return localized messages and clean up resources |
| AC-RENDER-10 | REQ-RENDER-10 | PDF stored in storage, linked to certificate, with metadata |
| AC-RENDER-11 | REQ-RENDER-11 | Puppeteer browser lifecycle managed (lazy launch, idle timeout, crash recovery) |
| AC-RENDER-12 | REQ-RENDER-12 | Shape elements render as rectangle/circle/line with styling |
