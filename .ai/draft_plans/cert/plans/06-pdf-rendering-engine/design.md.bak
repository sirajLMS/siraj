# Design — Plan 06: PDF Rendering Engine

## Document Information

| Field | Value |
|---|---|
| **Feature Name** | Certificate PDF Rendering Engine |
| **Plan #** | 06 |
| **Dependencies** | Plan 4 (Services & Business Logic — generation pipeline context) |
| **Dependents** | Plan 15 (Template Preview & Publishing), Plan 17 (Certificate Generation Dialog), Plan 18 (Certificate Detail & Download) |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/01-generation-logic.md`, `siraj_analysis/11-pdf-rendering-deps.md`, `siraj_analysis/07-storage-file-system.md` |

---

## Architecture Position

```
Generation Pipeline (Plan 4)
    │
    ▼
RenderService.renderCertificate(template, certificate, recipientData)
    │
    ├──► VariableResolver.resolve(template, certificate, recipient) ──► Resolved Variables
    │
    ├──► ElementRenderer.convertElements(template.elements, resolvedVars) ──► HTML String
    │         │
    │         ├──► QRCodeGenerator.generate(verificationUrl, size) ──► SVG Data-URI
    │         ├──► BackgroundImageLoader.load(template.backgroundFileId) ──► Base64 Image
    │         └──► FontLoader.loadArabicFonts(template.fontConfig) ──► @font-face CSS
    │
    ├──► RenderCache.get(cacheKey) ──► Cache Hit? Return cached PDF
    │
    ├──► PuppeteerManager.getPage() ──► Browser Page (lazy launch)
    │         │
    │         └──► page.setContent(html) → page.pdf(options) ──► PDF Buffer
    │
    ├──► StorageService.writeFile(path, pdfBuffer, metadata) ──► Storage File Record
    │
    └──► RenderCache.set(cacheKey, pdfBuffer) ──► Cache Stored

    Return: { pdfPath, storageFileId, downloadUrl }
```

### Service Relationship

```
backend/services/cert/
├── renderService.ts           # Orchestrates the full render pipeline
├── render/
│   ├── elementRenderer.ts      # Converts template elements → positioned HTML
│   ├── variableResolver.ts    # Resolves variable values from sources
│   ├── qrCodeGenerator.ts     # Generates QR code SVG data-URIs
│   ├── backgroundImageLoader.ts # Fetches & base64-encodes background images
│   ├── fontLoader.ts          # Loads Arabic fonts as base64 @font-face
│   ├── renderCache.ts         # Cache key computation, get/set/invalidate
│   └── shapeRenderer.ts       # CSS shape rendering for rectangle/circle/line
├── puppeteer/
│   ├── puppeteerManager.ts    # Browser lifecycle (lazy launch, idle timeout, pool)
│   └── puppeteerConfig.ts     # Launch args, executable path, timeouts
└── batch/
    └── batchRenderer.ts       # Sequential batch rendering with progress events
```

---

## Design Goals

1. **Reliability over speed** — Every render must either produce a valid PDF or return a typed error. No silent failures, no zombie processes.
2. **Resource safety** — Puppeteer browser instances must be cleaned up in all paths (success, error, timeout). A single browser per process, reused across batch renders.
3. **Cache-first** — Avoid expensive Puppeteer launches when cached PDFs are valid. Cache invalidation must be automatic on template version changes.
4. **Arabic-first rendering** — RTL text must render correctly with proper glyph shaping. Arabic fonts must be embedded, not relied upon as system fonts.
5. **Batch efficiency** — Batch rendering must reuse a single browser instance and emit progress events for UI feedback.

---

## Key Design Decisions

### Decision 1: Puppeteer for Server-Side HTML→PDF

**Context:** CGVS used `pdfme` for template rendering and `pdf-lib` for manipulation. Siraj needs Arabic text support and complex CSS layout.

**Options Considered:**
1. **pdfme** — Pros: template schema already understood from CGVS analysis / Cons: limited Arabic support, no CSS layout, complex font embedding
2. **Puppeteer + HTML/CSS** — Pros: full CSS support, HarfBuzz Arabic shaping built-in, Chromium rendering fidelity / Cons: heavier process, serverless constraints
3. **pdf-lib with manual text positioning** — Pros: lightweight / Cons: no Arabic shaping, no CSS, enormous manual work

**Decision:** Puppeteer + HTML/CSS

**Rationale:** Puppeteer provides the best Arabic text rendering via Chromium's HarfBuzz engine. The HTML/CSS approach allows precise element positioning using absolute positioning, which maps directly to template element X/Y coordinates. The `pdfme` library is still used for the template editor canvas (Plan 11) but NOT for the rendering engine — the hybrid approach gives us best-of-both-worlds.

### Decision 2: Browser Pool with Lazy Launch and Idle Timeout

**Context:** Puppeteer browser processes are expensive to launch (~1-2s) and consume memory. In serverless environments, they may not persist across requests.

**Options Considered:**
1. **Launch per render** — Pros: simple, no state / Cons: ~2s overhead per render, unacceptable for batch
2. **Persistent browser (always running)** — Pros: fast / Cons: memory waste in idle, serverless-unfriendly
3. **Lazy launch + idle timeout (60s)** — Pros: fast for batch, cleaned up when idle / Cons: complexity in lifecycle management

**Decision:** Lazy launch + 60s idle timeout

**Rationale:** Balances batch performance with resource cleanup. The browser launches on first render, is reused for subsequent renders, and closes after 60s of inactivity. Crash recovery is handled by detecting disconnected browsers and re-launching on the next render request.

### Decision 3: Cache Key Composition

**Context:** Cache hits must guarantee the cached PDF is byte-identical to what a fresh render would produce.

**Options Considered:**
1. **Cache by templateId + certificateId** — Pros: simple / Cons: doesn't detect template version changes or variable value changes
2. **Cache by templateId + templateVersion + variableValuesHash + fontConfigHash** — Pros: precise invalidation / Cons: hash computation overhead (negligible)
3. **Cache by content hash of all inputs** — Pros: perfect / Cons: requires serializing all inputs, expensive

**Decision:** Cache key = `templateId + templateVersion + variableValuesHash + fontConfigHash`

**Rationale:** Template version increment invalidates all stale renders. Variable values hash detects any recipient data change. Font config hash detects font setting changes. The hash uses SHA-256 of JSON-serialized values.

### Decision 4: Storage-Based Cache (Not Postgres)

**Context:** Cached PDFs are binary blobs (100KB-2MB each). Postgres is not ideal for large binary storage.

**Options Considered:**
1. **Postgres bytea column** — Pros: transactional consistency / Cons: bloats table, vacuum overhead, max row size concerns
2. **Storage service with `usageType = "certificate_pdf_cache"`** — Pros: uses existing storage abstraction, supports all providers / Cons: no transactional consistency (acceptable)
3. **Redis** — Pros: fast / Cons: volatile, not configured in Siraj

**Decision:** Storage service with `usageType = "certificate_pdf_cache"`

**Rationale:** Reuses the existing `StorageService` from Plan 7. Cache files live at path `certificates/cache/{cacheKey}.pdf`. TTL expiry (24h) is checked by comparing the storage file's `createdAt` timestamp.

### Decision 5: Sequential Batch Rendering

**Context:** Batch rendering may process 10-500 certificates. Concurrent Puppeteer page rendering risks memory exhaustion.

**Options Considered:**
1. **Parallel rendering (5 concurrent pages)** — Pros: faster / Cons: 5x memory, Puppeteer instability with multiple pages
2. **Sequential rendering (single page, reused)** — Pros: safe, minimal memory / Cons: slower for large batches
3. **Worker queue** — Pros: controlled concurrency / Cons: infrastructure complexity, not needed at current scale

**Decision:** Sequential rendering with single page reuse

**Rationale:** Safety over speed. A single Puppeteer page is reused across all batch items (set new content per item). Progress events provide UI feedback. `maxErrors=5` threshold prevents infinite failure loops.

---

## Interface Contracts

### RenderService

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `renderCertificate` | `template: CertTemplateSelectType, certificate: CertificateSelectType, recipientData: ResolvedRecipientData, locale: string` | `Promise<RenderResult>` | Renders a single certificate PDF, stores it, returns path + URL |
| `renderBatch` | `template: CertTemplateSelectType, batchItems: BatchRenderItem[], options: BatchRenderOptions` | `Promise<BatchRenderResult>` | Renders multiple certificates sequentially with progress events |
| `getRenderCache` | `cacheKey: string` | `Promise<Buffer \| null>` | Retrieves cached PDF buffer if valid |
| `invalidateRenderCache` | `templateId: string, templateVersion: number` | `Promise<void>` | Invalidates all cache entries for a template version |

### RenderResult

| Field | Type | Description |
|---|---|---|
| `pdfPath` | `string` | Storage path: `certificates/{templateId}/{certificateId}.pdf` |
| `storageFileId` | `string` | Storage file record ID |
| `downloadUrl` | `string` | Public/copyable download URL (from Plan 7) |
| `fromCache` | `boolean` | Whether the PDF came from cache |
| `renderTimeMs` | `number` | Render duration in milliseconds |

### BatchRenderItem

| Field | Type | Description |
|---|---|---|
| `certificate` | `CertificateSelectType` | Certificate record |
| `resolvedVariables` | `Record<string, unknown>` | Resolved variable values |
| `recipient` | `StudentSelectType` | Student/recipient data |

### BatchRenderOptions

| Field | Type | Default | Description |
|---|---|---|---|
| `maxErrors` | `number` | `5` | Max consecutive failures before batch aborts |
| `onProgress` | `(event: ProgressEvent) => void` | — | Progress callback |
| `locale` | `string` | `"en"` | Locale for error messages and date formatting |

### ProgressEvent

| Field | Type | Description |
|---|---|---|
| `type` | `"render_started" \| "render_completed" \| "render_failed" \| "batch_complete"` | Event type |
| `index` | `number` | Current item index (0-based) |
| `total` | `number` | Total batch size |
| `certificateId` | `string` | Certificate ID |
| `error?` | `RenderError` | Error details (for `render_failed`) |

### ElementRenderer

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `renderElements` | `elements: TemplateElement[], resolvedVars: Record<string, unknown>, locale: string` | `string` | Returns HTML string for all elements |
| `renderElement` | `element: TemplateElement, resolvedVars: Record<string, unknown>, locale: string` | `string` | Returns HTML for a single element |
| `renderShape` | `element: TemplateElement` | `string` | Returns HTML for a shape element |

### VariableResolver

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `resolve` | `template: CertTemplateSelectType, certificate: CertificateSelectType, recipient: StudentSelectType, perRecipientValues: RecipientVariableValue[]` | `Record<string, unknown>` | Resolves all variables referenced in template elements |

### PuppeteerManager

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `getPage` | — | `Promise<PuppeteerPage>` | Returns a browser page (launches browser if not running) |
| `releasePage` | `page: PuppeteerPage` | `void` | Releases page back to pool (does NOT close browser) |
| `closeBrowser` | — | `Promise<void>` | Forcefully closes browser (cleanup) |
| `isBrowserRunning` | — | `boolean` | Whether browser process is alive |

### RenderCache

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `computeCacheKey` | `templateId, templateVersion, variableValuesHash, fontConfigHash` | `string` | Computes SHA-256 cache key |
| `get` | `cacheKey: string` | `Promise<Buffer \| null>` | Retrieves cached PDF (checks TTL) |
| `set` | `cacheKey: string, pdfBuffer: Buffer` | `Promise<void>` | Stores PDF in storage with metadata |
| `invalidateByTemplate` | `templateId: string, version: number` | `Promise<void>` | Deletes cache files for template+version |

### RenderError

| Field | Type | Description |
|---|---|---|
| `code` | `RenderErrorCode` | One of 8 error codes |
| `message` | `string` | Localized error message |
| `context` | `Record<string, unknown>` | Additional context (templateId, certificateId) |

| RenderErrorCode | Description |
|---|---|
| `render_timeout` | Puppeteer timeout exceeded |
| `font_not_found` | Arabic font file missing |
| `image_load_failed` | Image URL failed to load |
| `qr_generation_failed` | QR library error |
| `background_not_found` | Background image file not found |
| `missing_required_variable` | Required variable has no value |
| `puppeteer_launch_failed` | Browser failed to start |
| `batch_max_errors` | Batch exceeded max consecutive errors |

---

## Component Hierarchy

```
backend/services/cert/
├── renderService.ts                    # Main entry point — renderCertificate, renderBatch
├── render/
│   ├── elementRenderer.ts              # Element → HTML conversion (6 element types)
│   ├── variableResolver.ts            # Variable resolution (student/variable/certificate)
│   ├── qrCodeGenerator.ts             # QR code SVG generation via qrcode npm
│   ├── backgroundImageLoader.ts       # Background image fetch + base64 encode
│   ├── fontLoader.ts                  # Arabic font loading + @font-face CSS generation
│   ├── renderCache.ts                 # Cache key computation, get/set/invalidate
│   └── shapeRenderer.ts              # CSS shape rendering (rectangle/circle/line)
├── puppeteer/
│   ├── puppeteerManager.ts            # Browser lifecycle (lazy launch, idle timeout, crash recovery)
│   └── puppeteerConfig.ts            # Launch args, executable path, timeout config
└── batch/
    └── batchRenderer.ts               # Sequential batch rendering, progress events, maxErrors
```

---

## Data Model References

### Tables Used (from Plan 1)

| Table | Usage in Plan 06 |
|---|---|
| `certificate_templates` | Template definition (dimensions, orientation, background, font settings) |
| `certificate_template_elements` | Element definitions (type, position, styling, variable binding) |
| `certificate_template_variables` | Variable definitions (type, default value, required, formatting) |
| `certificates` | Certificate record (verification code, issue date, status) |
| `recipient_group_item_variable_values` | Per-recipient variable values |
| `storage_files` | PDF storage records (usageType = `certificate_pdf` or `certificate_pdf_cache`) |

### Storage Paths

| File Type | Path Pattern | usageType |
|---|---|---|
| Certificate PDF | `certificates/{templateId}/{certificateId}.pdf` | `certificate_pdf` |
| Cached PDF | `certificates/cache/{cacheKey}.pdf` | `certificate_pdf_cache` |

---

## Error Handling Strategy

### Error Flow

```
Render Request
    │
    ▼
Pre-Render Validation (variables, template integrity)
    │── Validation Error ──► Return RenderError (no Puppeteer launch)
    │
    ▼
Cache Check
    │── Cache Hit ──► Return cached PDF (no Puppeteer launch)
    │
    ▼
Puppeteer Launch
    │── Launch Failed ──► Return puppeteer_launch_failed
    │
    ▼
HTML Content Set + page.pdf()
    │── Timeout ──► Return render_timeout, cleanup browser
    │── Image Load Failed ──► Return image_load_failed
    │── Font Missing ──► Return font_not_found
    │
    ▼
Storage Write
    │── Storage Write Failed ──► Return storage_error (not in scope)
    │
    ▼
Cache Store
    │── Cache Store Failed ──► Log warning, return PDF anyway (non-blocking)
    │
    ▼
Return RenderResult
```

### Cleanup Protocol

After ANY error:
1. Close the Puppeteer page (not the browser — browser stays for batch reuse)
2. Log the error with full context via `logger.error`
3. Return the typed RenderError to the caller
4. If browser crashed (disconnect detected), mark browser as needing relaunch

### Batch Error Handling

- Consecutive error counter increments on each failure
- Counter resets to 0 on success
- When counter reaches `maxErrors` (default 5), batch aborts with `batch_max_errors` error
- Partial results (successful renders before abort) are preserved and returned

---

## i18n Design

### Translation Namespaces

| Namespace | Usage Context | Access Pattern |
|---|---|---|
| `certificates.errors.render` | Service layer error messages | `getServerTranslations(locale, "certificates.errors.render")` |
| `certificates.generation` | Batch progress messages | `getServerTranslations(locale, "certificates.generation")` |
| `certificates.dateFormats` | Date element formatting (Arabic month names) | `getServerTranslations(locale, "certificates.dateFormats")` |

### Key Details

#### `certificates.errors.render`

8 keys as defined in REQ-RENDER-09:
- `timeout`, `fontNotFound` (interpolation: fontFamily), `imageLoadFailed`, `qrFailed`, `backgroundNotFound`, `missingVariable` (interpolation: variableName), `puppeteerFailed`, `batchMaxErrors` (interpolation: maxErrors)

Accessed via: `const t = await getServerTranslations(locale, "certificates.errors.render"); t.fontNotFound("Cairo")`

#### `certificates.generation` (render progress sub-domain)

4 keys with Arabic pluralization:
- `renderStarted` — simple string
- `renderCompleted (index, total)` — pluralized by total count
- `renderFailed (index)` — pluralized by index
- `batchComplete (successCount, failCount)` — dual pluralization

Arabic plural rules (shared/locale system):
- zero: 0 items
- one: 1 item
- two: 2 items
- few: 3-10 items
- many: 11-100 items
- other: 100+ items

#### `certificates.dateFormats`

3 keys:
- `monthNames` — readonly string array (12 Arabic month names)
- `monthNamesShort` — readonly string array (12 short Arabic month names)
- `ordinalSuffix (day: number) => string` — Arabic ordinal indicator

### Type Schema Location

All `certificates.*` namespace type definitions live in `shared/locale/types/certificates/index.ts` (created in Plan 01, populated in this plan).

---

## Puppeteer Configuration

### Launch Arguments

| Argument | Purpose |
|---|---|
| `--no-sandbox` | Disable Linux sandbox (required for serverless/root environments) |
| `--disable-setuid-sandbox` | Disable setuid sandbox |
| `--disable-gpu` | GPU not needed for PDF rendering |
| `--disable-dev-shm-usage` | Avoid /dev/shm exhaustion in containers |
| `--single-process` | Single process mode for serverless compatibility |

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PUPPETEER_EXECUTABLE_PATH` | (Puppeteer bundled) | Path to Chromium binary (set in Vercel/serverless) |
| `PUPPETEER_RENDER_TIMEOUT_MS` | `30000` | Max time for page.pdf() call |
| `PUPPETEER_IDLE_TIMEOUT_MS` | `60000` | Browser idle timeout before auto-close |
| `CERT_FONT_DIR` | `./assets/fonts/arabic` | Directory containing Arabic font files |

### PDF Options

| Option | Value | Description |
|---|---|---|
| `format` | (undefined) | Use explicit width/height from template |
| `width` | `template.width + "px"` | Template width in pixels |
| `height` | `template.height + "px"` | Template height in pixels |
| `printBackground` | `true` | Include background images/colors |
| `margin` | `{ top: 0, right: 0, bottom: 0, left: 0 }` | No margins (full-bleed) |
| `preferCSSPageSize` | `false` | Use explicit dimensions, not @page |

---

## New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `qrcode` | `^1.5.4` | QR code SVG generation |
| `@types/qrcode` | `^1.5.5` | TypeScript types for qrcode (dev dependency) |

**Note:** Puppeteer is already installed in the project (confirmed in Siraj analysis).

---

## Testing Strategy

### Unit Tests

| Component | Test Cases |
|---|---|
| `ElementRenderer` | Each element type produces correct HTML; RTL direction applied; z-index ordering; rotation transform |
| `VariableResolver` | Student source resolution; variable source resolution; certificate source resolution; missing required variable error |
| `QRCodeGenerator` | Correct URL encoding; SVG data-URI format; size parameter; error handling |
| `RenderCache` | Cache key uniqueness; TTL expiry; invalidation by template version |
| `ShapeRenderer` | Rectangle, circle, line HTML output; opacity; rotation |

### Integration Tests

| Test | Description |
|---|---|
| End-to-end render | Template with all 6 element types → valid PDF buffer |
| Arabic text render | Template with Arabic elements → correctly shaped text in PDF |
| Cache hit | Second render with same inputs → returns cached PDF (no Puppeteer launch) |
| Cache invalidation | Template version bump → cache miss on next render |
| Batch render | 10-item batch → 10 results, single browser instance used |
| Batch max errors | 6 consecutive failures → batch aborts with error |
| Puppeteer crash recovery | Browser disconnect → next render launches new browser |

---

## UX/Navigation Specification

This is a **backend-only plan** — no UI routes, sidebar items, or user-facing UI components are created.

### Consumer Integration Points

| Consumer Plan | How it uses Plan 06 |
|---|---|
| Plan 4 (Services) | Calls `renderService.renderCertificate()` during generation pipeline |
| Plan 15 (Preview) | Calls `renderService.renderCertificate()` for preview renders (with cache disabled) |
| Plan 17 (Generation Dialog) | Calls `renderService.renderBatch()` for batch generation with progress events |
| Plan 18 (Detail) | Calls `renderService.renderCertificate()` for on-demand re-renders |

---

## Outcome & Knowledge Transfer Protocol

- **Before Execution:** Read all files in `.ai/plans/06-pdf-rendering-engine/outcome/`
- **After Execution:** Create `.ai/plans/06-pdf-rendering-engine/outcome/<task-id>-outcome.md` with research findings and implementation details
- **Progress Tracking:** Update task checkboxes `[ ]` → `[x]` in `tasks.md`

---

## Reality Check Notes

> Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Puppeteer is ALREADY installed** ✅ — `package.json` has `"puppeteer": "^25.4.0"` (requirements.md intro claim "Puppeteer (already installed)" is accurate). No new Puppeteer dependency is needed.
- **`@pdfme/common`, `@pdfme/schemas`, `@pdfme/ui`, `pdf-lib`, `@pdf-lib/fontkit` are also installed** ✅ — present in package.json (relevant background; plan correctly chose Puppeteer for Arabic/HTML rendering rather than reusing `@pdfme`).
- **`@/backend/lib/logger` import** ✅ — exists at `backend/lib/logger.ts`; tasks.md correctly mandates `logger` over `console.*`.
- **`backend/services/AGENTS.md` service conventions** ✅ — referenced; matches real file (namespace pattern, i18n via `getServerTranslations`, batch DataLoader methods, fire-and-forget side-effects).
- **Storage naming `certificates/{templateId}/{certificateId}.pdf`** ✅ — a valid storage-path convention (string path under entity); consistent with how Plan 7 will expose writes.
- **`qrcode` package addition (T01)** ✅ — `qrcode` is NOT currently in package.json (verified); adding `qrcode` + `@types/qrcode` is the right call.

### Corrections Made
- **Service path `backend/services/certificates/` → `backend/services/cert/`** — MAJOR mismatch. Plan 04 (this plan's direct dependency) places all certificate services in `backend/services/cert/` and the codebase uses domain folders throughout (`backend/services/{auth, billing, student, storage, ...}`). Plan 06 had `backend/services/certificates/` (plural, different name) for ALL its render/puppeteer/batch files — making Plan 06 inconsistent with Plan 04 and the codebase convention. Corrected **all 60+ occurrences** in design.md and tasks.md to `backend/services/cert/` (e.g. `backend/services/cert/render/elementRenderer.ts`, `backend/services/cert/puppeteer/puppeteerManager.ts`, `backend/services/cert/renderService.ts`, `backend/services/cert/batch/batchRenderer.ts`). This aligns Plan 06's render sub-tree under the SAME domain folder Plan 04 owns.

### Flagged — Needs Resolving with Plan 7 (NOT auto-corrected)
- **`StorageService.writeFile(path, pdfBuffer, metadata)`**, **`StorageService.getFileBytes(fileId)`**, and **`StorageService.createFile` are NOT methods on the actual `StorageService` namespace.** Verified `backend/services/storage/storage.service.ts`: `StorageService` exposes `linkFileToEntity`, `requireStorageManage`, `validateUpload`, `validateSignedUrlSession`, `upsertManySiteContent`, … but NO `writeFile` / `createFile` / `getFileBytes`. These low-level storage writers likely live on `StorageDbRepository` or are introduced by Plan 7 (`backend/services/storage`/`app/api/storage/`). Because Plan 06 explicitly depends on Plan 7 and the storage write API is being defined there, the exact method names (`writeFile` vs `upload` vs `StorageDbRepository.createFile`) should be finalised when Plan 7 is implemented. Left unchanged in the plan body; flagged here so Plan 7 / Plan 06 maintainers reconcile the storage write API.

### Status (intentionally not changed)
- **Configuration approach (single lazy browser, idle timeout, reuse across batch)** — sensible and not contradicted by anything in the codebase; no Puppeteer config pre-exists. ✅
- **Render-cache stored as storage files at `certificates/cache/{cacheKey}.pdf`** — a valid design choice; no existing render-cache service to conflict with (no PDF infra pre-exists). ✅

---

## SWE Expert Review Notes

> Second-pass architectural + codebase-reality review (2026-08-02). Supersedes
> spec body where conflicts are noted below. Treat the corrections below as
> binding constraints on implementation.

### A. Correctness defects against the ACTUAL codebase (must fix)

1. **`getServerTranslations(locale, "certificates.errors.render")` is WRONG — two-arg
   form does not exist.** Verified at `shared/locale/server-graphql.ts:3`:
   `export function getServerTranslations(locale: string): ReturnType<typeof getTranslations>`.
   It takes exactly ONE argument and returns the full `Translations` object. All cert
   render error keys must be reachable via `getServerTranslations(locale).errorsTranslations`
   (i.e. by EXTENDING the shared `ErrorsLabels` type, with cert keys namespaced under
   `tErrors.certificates.*`). **Required:** fix every occurrence in this design
   (§343–§360, §387) and the requirements §305/§347 — replace with `getServerTranslations(locale).errorsTranslations`
   and place render-error keys in the same `ErrorsLabels` extension Plan 04 uses.
   Likewise the `RenderError.message` field (§230) must carry the already-translated
   string from `tErrors.certificates.<key>(...)`, not a translation key string, and the
   `i18n Key` column in REQ-RENDER-09 should be renamed to `ErrorsLabels key`.

2. **`StorageService.createFile` DOES exist.** An earlier "Corrections Made" note above
   claims `StorageService.createFile` / `linkFileToEntity` "are NOT methods on the actual
   `StorageService` namespace". Verified at `backend/services/storage/storage.service.ts`:
   - `StorageService.createFile(filePath: string): Promise<void>` (line 124)
   - `StorageService.createFileAndGet(filePath, isProtected?): Promise<{ id, path, isProtected }>` (line 131)
   - `StorageService.linkFileToEntity({ referenceTable, referenceId, usageType, filePath }): Promise<FileOperationResult>` (line 265 — delegates to `StorageDbRepository.registerFileUsage`)
   So REQ-RENDER-10's "`createFile` + `registerFileUsage`" plan is ALREADY ALIGNED with
   the real API. The "Flagged — Needs Resolving with Plan 7" block should be corrected:
   only the low-level `writeFile(buffer)` / `getFileBytes(fileId)` byte-level writers are
   not present on the service (they live at the storage-provider/CDN layer Plan 7 will
   expose). **Required:** rewrite the flagged note to say: "Use the existing
   `StorageService.createFile` / `createFileAndGet` / `linkFileToEntity`; the raw byte-write
   + signed-URL read APIs are the only pieces awaiting Plan 7."

3. **`@/backend/lib/logger` ✅** — exists; the singleton `logger` is exported. The
   plan's "`logger` over `console.*`" rule is correct. The earlier `mnemonic "logger"`
   single-quote in `audit(...) / capture` flow is fine.

4. **No `PdfRenderService` namespace registration.** Plan 06's `renderService.ts`
   exports `PdfRenderService.renderCertificate(...)` per Plan 04 §3.1 step 8
   (`PdfRenderService.renderCertificate({ certificateId, templateSnapshot,
   resolvedVariables, locale })`). **Required:** confirm with Plan 04 that the namespace
   name is `PdfRenderService` (Plan 04 calls it `PdfRenderService`). Plan 06's
   interface-contract §147 calls it `RenderService`; the two names must match. Recommend
   `PdfRenderService` (matches what Plan 04 imports) and update the §147 table + the
   Service Relationship tree accordingly.

### B. Architectural soundness — Puppeteer lifecycle

5. **Single-process `--single-process` is DANGEROUS on serverless.** Decision 2 +
   `puppeteerConfig.ts` args (T02) include `--single-process`. On Vercel
   serverless/lambda, `--single-process` combined with `--no-sandbox` is the documented
   workaround, BUT it makes the render crash the whole Node process on a renderer
   hang (no isolation). **Required:** keep `--single-process` only when
   `VERCEL`/serverless is detected; in containerized / long-running deployments prefer
   multi-process + `--no-sandbox` for crash containment. Read the flag from env, do not
   hardcode it unconditionally.

6. **Crash recovery MUST be process-level, not just browser-level.** §326 "Cleanup
   Protocol" closes the page and marks the browser for relaunch — but with a single
   shared browser reused across a 1000-item batch, a renderer crash leaves the browser
   in a half-broken state and `closeBrowser + new launch` still pays ~2s per restart.
   **Required:** add an explicit `--renderer-process-limit=1` + `--disable-background-networking`
   + `--disable-extensions` for stability, and add a health-check (`page.evaluate("1+1")`)
   before each render; on failure, `browser.close()` + relaunch + retry the current
   render ONCE. Log every relaunch.

7. **Idle timeout + serverless warms are incompatible.** A 60s idle timeout is fine on
   a long-running server. On Vercel serverless the function instance is frozen/evicted
   between requests and may persist long enough to leak a browser that the platform then
   kills — leaving stale `browser` references. **Required:** detect
   `process.env.VERCEL` / `process.env.LAMBDA_TASK_ROOT` and switch to
   **launch-per-invocation** mode (skip the 60s idle pool). The `PuppeteerManager` env
   detection must be the first thing in `getPage()`. This is the standard Puppeteer-on-
   serverless guidance (see Vercel `@sparticuz/chromium` pattern).

8. **No memory ceiling — a single 2-page template PDF can balloon Chromium to >500MB.**
   On serverless (256MB–1GB caps) OOM kills the function mid-batch with no recovery.
   **Required:** set `--memory-pressure-off` is NOT the answer; instead cap render
   concurrency to 1 (already Decision 5) AND set a `--max-old-space-size` / function
   size env, AND implement a render-time watchdog: if a single `page.pdf()` exceeds
   `PUPPETEER_RENDER_TIMEOUT_MS` (default 30s), `page.close()` + abort that render with
   `render_timeout`. The plan has this in REQ-RENDER-09 ✅ — confirm
   `page.setDefaultTimeout(PUPPETEER_RENDER_TIMEOUT_MS)` is set on every new page, not
   only on the API call.

### C. Cache strategy correctness

9. **Cache key omits the background image.** Decision 3 / REQ-RENDER-07 says cache key =
   `templateId + templateVersion + variableValuesHash + fontConfigHash`. The
   `fontConfigHash` is included but the **background image file ID + content hash** is
   NOT. A user who swaps the background image file (same `templateVersion`, since a
   background swap may not bump the version depending on Plan 04's publish rules) gets a
   stale cached PDF. **Required:** the cache key MUST include `backgroundFileId` (and
   ideally `backgroundFileContentHash`); add to §113 / Decision 3 / REQ-RENDER-07
   invalidation list ("background image is changed" is listed for invalidation but the
   key itself must encode it to avoid serving stale).

10. **Cache lookup happens BEFORE validation ✅** but the plan's error-flow diagram
    (§292) puts "Pre-Render Validation" before "Cache Check" — which is the correct order
    (validate inputs, then check cache, then launch Puppeteer). Confirm the
    `renderService` actually validates variables BEFORE the cache check so a
    `missing_required_variable` never returns a stale-but-valid PDF from a previous
    successful render with different inputs. Since the key includes `variableValuesHash`,
    a different value set would miss — so this is safe, but keep validation first per the
    diagram.

11. **Render cache stored as a storage file with `usageType = certificate_pdf_cache`**
    ✅ is reasonable, BUT: TTL=24h checked by "comparing the storage file's `createdAt`"
    requires a `createdAt` column on `storage_files`. Verify Plan 1 / storage schema has
    `createdAt` on `storage_files` (very likely — Drizzle convention). Also, scanning
    `invalidateByTemplate(templateId, version)` must list+delete matching cache files by
    path prefix `certificates/cache/{cacheKey}.pdf` — the key encodes templateId+version
    so a directory listing + filter works, but it is O(n) over all cache files. Consider a
    `cert_cache_index` table mapping `(templateId, version) → [cacheKeys]` to avoid scanning
    the whole cache directory on invalidation. Flag for Plan 7 / Plan 22 (cleanup cron).

### D. Arabic / font handling realism

12. **`CERT_FONT_DIR = ./assets/fonts/arabic` is brittle.** A relative path from CWD is
    not portable across serverless bundles (build CWD ≠ runtime CWD). **Required:** read
    via `path.join(process.cwd(), "assets/fonts/arabic")` is the same brittleness;
    instead ship fonts under `public/fonts/` (served by Next) OR embed them in
    `backend/assets/fonts/` and resolve with `import.meta.url` / the bundler `?url`
    asset import so Vercel bundles them. The font must be available at runtime, not just
    dev. Also document which font families are bundled by default (Cairo + Amiri as
    REQ-RENDER-03 AC suggests) so the fallback has a known target.

13. **Base64 @font-face embedding re-loads the font per render.** The `fontLoader`
    should cache the base64 @font-face block in a module-level `Map<fontFamily, string>`
    (process lifetime) so a 1000-item batch does not re-read+re-base64 the same TTF 1000
    times. Add this to `fontLoader.ts` design (§253) — currently unspecified.

### E. QR / shape / image realism

14. **`qrcode` SVG data-URI ⚠** — the `qrcode` npm package produces the QR as an SVG
    string; embedding as `<img src="data:image/svg+xml;base64,...">` is fine, but confirm
    Chromium's `page.pdf()` rasterizes SVG `<img>` (it does). For print fidelity prefer
    `qrcode.toString(text, { type: "svg", errorCorrectionLevel: "M" })` and inline the
    SVG node directly into the HTML (no base64 round-trip) — sharper at print DPI. Update
    REQ-RENDER-04 / qrCodeGenerator accordingly. The "sufficient error correction level
    M (default)" ✅.

15. **`background-size: cover` stretches the image** — a non-aspect-matching background
    distorts. Use `background-size: 100% 100%` if the template author wants an exact
    page fill (matches the canvas), or `cover` with `background-position: center` and
    document both. Make the behavior template-selectable (`backgroundFit: cover|stretch|contain`)
    rather than hardcoding `cover`. Update REQ-RENDER-05 step 4.

16. **Image elements assume `imageUrl` is a public URL** (§80/§236). But storage may
    require a signed URL (Plan 7). **Required:** `backgroundImageLoader` + image
    element resolver must obtain a SIGNED URL via Plan 7's signed-URL service before the
    render (Chromium cannot access protected storage), and that signed URL must be
    short-lived (scoped to render duration + a few seconds). Add a "resolve storage
    signed URL for image elements + background" step to the pipeline (before HTML
    assembly). Cross-plan dependency on Plan 7.

### F. Batch / partial-failure recovery

17. **Plan 06 batch returns raw `{ certificateId, pdfPath, success, error? }`**, but
    Plan 04 `CertificateBatchService.generateBatch` expects to chain each render into a
    full generation pipeline (create cert → call render → update status → link storage
    → notify → audit). The two batch contracts don't interlock cleanly:
    - Plan 04 loops at the Certificate level (DB create per recipient).
    - Plan 06 loops at the render level (assumes certs already created).
    **Required:** clarify the boundary. Recommended: Plan 04's batch loops per
    recipient and calls `PdfRenderService.renderCertificate` (the SINGLE-cert entry
    point) per item; `PdfRenderService.renderBatch` is then only the BATCH-RENDER
    optimization (one browser, reused) used by Frontend preview flows (Plan 17), NOT by
    Plan 04's generation loop. OR: Plan 04 calls `renderBatch` once and links the
    returned `pdfPath`s to the already-created cert rows. Either is fine — but the
    spec must state WHICH. Currently Plan 04 §3.2 does NOT call `renderBatch`; it loops
    `generateCertificate`. So `PdfRenderService.renderBatch` is effectively the
    preview-batch path (Plan 17). Make this explicit in BOTH plans.

18. **`maxErrors` abort leaves the BATCH in an inconsistent state** for Plan 04's batch.
    If Plan 06 aborts at 5 consecutive failures but Plan 04's per-recipient loop expects
    best-effort completion, the abort must propagate as a partial result (succeeded rows
    preserved, remaining rows marked `failed` with reason `batch_max_errors`). Wire
    `maxErrors` semantics across both plans.

### G. Async / serverless scalability (cross-plan with Plan 04)

19. **No queue / no async batch path.** As flagged in the Plan 04 review, a 1000-cert
    batch will not fit in one serverless invocation. `PdfRenderService.renderBatch` +
    Plan 04's batch loop both need the async `certificate_batch_jobs` path (Plan 1 table
    + Plan 22 worker) described in Plan 04 review #12. Plan 06's `batchRenderer` should
    be invocable from the cron worker (Plan 22) — ensure `renderService.renderBatch` is
    SSR-callable (no `ctx` arg) ✅ (the contract takes no ctx, good).

### H. Remaining risks (accept and track)

- **PDF metadata title/author/subject/keywords** (REQ-RENDER-10 #4) — Puppeteer
  `page.pdf({ tagged: true, ... })` does NOT expose arbitrary metadata (title/author);
  that's a `pdf-lib` post-processing step. The plan should add an explicit
  `pdf-lib` post-step (`PDFDocument.load(buf)` → `setTitle/setAuthor/setSubject` →
  `save`) and note `pdf-lib` is already installed (`^1.17.1`). Add a `metadataWriter.ts`
  sub-step, or drop the metadata requirement as out-of-scope.
- **Re-render overwrites the same storage path** (REQ-RENDER-10 AC4) — but
  `StorageService.createFile` is an INSERT, not an upsert. Plan 7 must expose a
  `replaceFile(path, bytes)` or the engine must delete-then-create (with audit safety).
  Flag to Plan 7.
- **Fonts missing on the public `@vercel` Chromium build (`@sparticuz/chromium`)**
  ship NO Arabic fonts — the bundled-Cairo baseline above (#12) is mandatory, not
  merely a fallback. Document this loudly.
- **No timeout on `browser.launch()` itself** — add `protocolTimeout` + launch timeout
  (e.g. 10s) so a stuck launch doesn't block the whole request; fail with
  `puppeteer_launch_failed`.

### Action checklist (implementer must reconcile)

1. Fix every `getServerTranslations(locale, "ns")` two-arg call → single-arg + `errorsTranslations`.
2. Place render error keys under the shared `ErrorsLabels` extension (sync with Plan 04).
3. Correct the "StorageService.createFile does not exist" note — use `createFile` / `linkFileToEntity`.
4. Rename `RenderService` → `PdfRenderService` to match Plan 04.
5. Make `--single-process` + idle-pool conditional on non-serverless runtime.
6. Clarify batch ownership: Plan 06 `renderBatch` is the preview-batch path; Plan 04 loops `generateCertificate` (single-render) per recipient.
7. Add `backgroundFileId(+hash)` to the cache key.
8. Resolve storage SIGNED URLs for image/background elements before render (depends on Plan 7).
9. Cache the base64 @font-face block per font family; ship bundled Arabic fonts (Cairo/Amiri) under a vercel-bundled asset path.
10. Add `pdf-lib` metadata post-step for title/author/subject OR drop the metadata requirement.
11. Inline SVG QR (skip base64-of-svg) for sharper print output.
