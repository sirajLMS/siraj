# Tasks — Plan 06: PDF Rendering Engine

## Document Information

| Field | Value |
|---|---|
| **Feature Name** | Certificate PDF Rendering Engine |
| **Plan #** | 06 |
| **Dependencies** | Plan 4 (Services & Business Logic) |
| **Task Count** | 12 tasks across 4 phases |

---

## Dependency Graph

```
T01 (qrcode dep)
  │
  ▼
T02 (puppeteerConfig) ──► T03 (puppeteerManager)
                              │
                              ▼
T04 (elementRenderer) ──► T05 (variableResolver)      T06 (qrCodeGenerator)
  │                         │                           │
  ▼                         ▼                           │
T07 (backgroundImageLoader)  T08 (fontLoader)           │
  │                         │                           │
  └────────────┬────────────┘                           │
               ▼                                          │
          T09 (shapeRenderer)                              │
               │                                          │
               ▼                                          │
          T10 (renderCache)                                │
               │                                          │
               ▼                                          │
          T11 (renderService) ◄───────────────────────────┘
               │
               ▼
          T12 (batchRenderer)
```

---

## Instruction Verification Table

| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Acceptance Criteria Mapping

| Task | Covers Requirements |
|---|---|
| T01 | REQ-RENDER-04 (qrcode dependency) |
| T02 | REQ-RENDER-11 (Puppeteer config) |
| T03 | REQ-RENDER-11 (Puppeteer lifecycle) |
| T04 | REQ-RENDER-01, REQ-RENDER-02 (element rendering) |
| T05 | REQ-RENDER-06 (variable resolution) |
| T06 | REQ-RENDER-04 (QR generation) |
| T07 | REQ-RENDER-05 (background image) |
| T08 | REQ-RENDER-03 (Arabic fonts) |
| T09 | REQ-RENDER-12 (shape rendering) |
| T10 | REQ-RENDER-07 (render caching) |
| T11 | REQ-RENDER-01, REQ-RENDER-09, REQ-RENDER-10 (service orchestration, errors, storage) |
| T12 | REQ-RENDER-08 (batch rendering) |

---

## Phase 1: Infrastructure & Dependencies

### T01: Add `qrcode` Dependency

**Objective:** Install the `qrcode` npm package and its TypeScript types for QR code SVG generation.

**Subtasks:**
- [ ] Add `qrcode` (^1.5.4) to `package.json` dependencies
- [ ] Add `@types/qrcode` (^1.5.5) to `package.json` devDependencies
- [ ] Run `bun install` to install the new packages
- [ ] Verify import works: `import QRCode from "qrcode";` in a test file
- [ ] Create `backend/services/cert/render/__tests__/qrCodeGenerator.test.ts` placeholder

**Files to Create/Modify:**
- `package.json` (modify — add dependencies)
- `backend/services/cert/render/__tests__/qrCodeGenerator.test.ts` (create placeholder)

**Dependencies:** None

**Requirements References:** REQ-RENDER-04

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t01","files":["package.json"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T02: Create Puppeteer Configuration

**Objective:** Create the Puppeteer launch configuration module with serverless-safe arguments and environment-based settings.

**Subtasks:**
- [ ] Create `backend/services/cert/puppeteer/puppeteerConfig.ts`
- [ ] Define launch arguments (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-gpu`, `--disable-dev-shm-usage`, `--single-process`)
- [ ] Define environment variable reads (`PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_RENDER_TIMEOUT_MS`, `PUPPETEER_IDLE_TIMEOUT_MS`)
- [ ] Define PDF options builder (width/height from template, printBackground=true, zero margins)
- [ ] Export `getPuppeteerConfig()` and `getPdfOptions(template)` functions
- [ ] Create test: `backend/services/cert/puppeteer/__tests__/puppeteerConfig.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/puppeteer/puppeteerConfig.ts` (create)
- `backend/services/cert/puppeteer/__tests__/puppeteerConfig.test.ts` (create)

**Dependencies:** None

**Requirements References:** REQ-RENDER-11

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t02","files":["backend/services/cert/puppeteer/puppeteerConfig.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T03: Create Puppeteer Manager

**Objective:** Implement the Puppeteer browser lifecycle manager with lazy launch, idle timeout, crash recovery, and semaphore guard.

**Subtasks:**
- [ ] Create `backend/services/cert/puppeteer/puppeteerManager.ts`
- [ ] Implement lazy browser launch (browser starts on first `getPage()` call)
- [ ] Implement idle timeout (default 60s, closes browser when no active renders)
- [ ] Implement crash detection (detect `disconnected` event, mark for relaunch)
- [ ] Implement semaphore guard (single concurrent browser instance per process)
- [ ] Implement `getPage()` → returns `Promise<PuppeteerPage>`
- [ ] Implement `releasePage(page)` → releases page (browser stays open)
- [ ] Implement `closeBrowser()` → forcefully close and cleanup
- [ ] Implement `isBrowserRunning()` → returns boolean
- [ ] Use `logger` from `@/backend/lib/logger` for all logging (NEVER `console.*`)
- [ ] Create test: `backend/services/cert/puppeteer/__tests__/puppeteerManager.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/puppeteer/puppeteerManager.ts` (create)
- `backend/services/cert/puppeteer/__tests__/puppeteerManager.test.ts` (create)

**Dependencies:** T02

**Requirements References:** REQ-RENDER-11 (AC1-AC5)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t03","files":["backend/services/cert/puppeteer/puppeteerManager.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

## Phase 2: Rendering Components

### T04: Create Element Renderer

**Objective:** Implement the element-to-HTML converter for all 6 element types with positioning, styling, z-index, and RTL support.

**Subtasks:**
- [ ] Create `backend/services/cert/render/elementRenderer.ts`
- [ ] Implement `renderElements(elements, resolvedVars, locale)` → returns HTML string for all elements
- [ ] Implement `renderElement(element, resolvedVars, locale)` → returns HTML for single element
- [ ] Implement `static_text` rendering: escaped text in positioned div with font-size, color, alignment, font-family
- [ ] Implement `data_text` rendering: resolved dynamic text in positioned div with element styling
- [ ] Implement `data_date` rendering: resolved date formatted per `dateFormat` pattern (YYYY-MM-DD, DD/MM/YYYY, Do MMMM YYYY, Arabic D MMMM YYYY)
- [ ] Implement `image` rendering: `<img>` tag with src, width/height, absolute positioning
- [ ] Apply z-index ordering (higher z-index elements appear above lower)
- [ ] Apply rotation transforms (`transform: rotate({rotation}deg)`)
- [ ] Apply `dir="rtl"` for elements with `languageConstraint = "ar"`
- [ ] Create test: `backend/services/cert/render/__tests__/elementRenderer.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/elementRenderer.ts` (create)
- `backend/services/cert/render/__tests__/elementRenderer.test.ts` (create)

**Dependencies:** None (T01-T03 not strictly required, but T02-T03 needed for integration tests)

**Requirements References:** REQ-RENDER-01 (AC1-AC4), REQ-RENDER-02 (AC1-AC7)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t04","files":["backend/services/cert/render/elementRenderer.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T05: Create Variable Resolver

**Objective:** Implement the variable resolution engine that extracts values from student, variable, and certificate sources with type formatting.

**Subtasks:**
- [ ] Create `backend/services/cert/render/variableResolver.ts`
- [ ] Implement `resolve(template, certificate, recipient, perRecipientValues)` → returns `Record<string, unknown>`
- [ ] Implement student source resolution (name, email, nationality, gender, dateOfBirth, etc.)
- [ ] Implement variable source resolution (per-recipient values → template variable preview → default)
- [ ] Implement certificate source resolution (verificationCode, releaseDate, issuedAt)
- [ ] Implement NUMBER formatting (apply `decimalPlaces`)
- [ ] Implement DATE formatting (apply `dateFormat` pattern with locale-aware month names)
- [ ] Implement SELECT formatting (resolve selected option's display label)
- [ ] Implement missing required variable detection → throw `RenderError` with code `missing_required_variable`
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for error messages
- [ ] Create test: `backend/services/cert/render/__tests__/variableResolver.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/variableResolver.ts` (create)
- `backend/services/cert/render/__tests__/variableResolver.test.ts` (create)

**Dependencies:** None

**Requirements References:** REQ-RENDER-06 (AC1-AC5)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t05","files":["backend/services/cert/render/variableResolver.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `shared/AGENTS.md` — i18n system rules
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T06: Create QR Code Generator

**Objective:** Implement QR code SVG generation for certificate verification URLs.

**Subtasks:**
- [ ] Create `backend/services/cert/render/qrCodeGenerator.ts`
- [ ] Import `qrcode` npm package
- [ ] Implement `generate(verificationUrl: string, size: number)` → returns SVG data-URI string
- [ ] Set error correction level to "M" (medium) for print reliability
- [ ] Construct verification URL: `{app_base_url}/verify/{certificate.verificationCode}`
- [ ] Read `app_base_url` from environment variable `NEXT_PUBLIC_APP_URL` (or equivalent)
- [ ] Handle QR library errors → throw `RenderError` with code `qr_generation_failed`
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for error message
- [ ] Create test: `backend/services/cert/render/__tests__/qrCodeGenerator.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/qrCodeGenerator.ts` (create)
- `backend/services/cert/render/__tests__/qrCodeGenerator.test.ts` (create)

**Dependencies:** T01 (qrcode package)

**Requirements References:** REQ-RENDER-04 (AC1-AC3)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t06","files":["backend/services/cert/render/qrCodeGenerator.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T07: Create Background Image Loader

**Objective:** Implement the background image fetcher that retrieves images from storage and base64-encodes them for HTML embedding.

**Subtasks:**
- [ ] Create `backend/services/cert/render/backgroundImageLoader.ts`
- [ ] Import `StorageService` from `@/backend/services/storage` (Plan 7)
- [ ] Implement `load(backgroundFileId: string)` → returns `{ base64: string, mimeType: string }`
- [ ] Fetch image bytes via `StorageService.getFileBytes(fileId)`
- [ ] Base64-encode the image bytes
- [ ] Determine MIME type from file extension (jpeg, png, gif, webp)
- [ ] Handle missing file → throw `RenderError` with code `background_not_found`
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for error message
- [ ] Return null (no background) if `backgroundFileId` is null/undefined
- [ ] Create test: `backend/services/cert/render/__tests__/backgroundImageLoader.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/backgroundImageLoader.ts` (create)
- `backend/services/cert/render/__tests__/backgroundImageLoader.test.ts` (create)

**Dependencies:** Plan 7 (StorageService must exist)

**Requirements References:** REQ-RENDER-05 (AC1-AC3)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t07","files":["backend/services/cert/render/backgroundImageLoader.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T08: Create Arabic Font Loader

**Objective:** Implement the Arabic font loader that reads font files, base64-encodes them, and generates `@font-face` CSS for HTML embedding.

**Subtasks:**
- [ ] Create `backend/services/cert/render/fontLoader.ts`
- [ ] Define supported Arabic font families (Cairo, Amiri) configurable via `CERT_FONT_DIR` env
- [ ] Implement `loadArabicFonts(fontConfig)` → returns `@font-face` CSS string
- [ ] Read font files from `CERT_FONT_DIR` directory (default: `./assets/fonts/arabic`)
- [ ] Base64-encode font files and embed as `@font-face` with `data:font/woff2;base64,...` URI
- [ ] Apply `font-family` to HTML elements with `languageConstraint = "ar"`
- [ ] Implement fallback: if font file missing, log warning and use system fallback font
- [ ] If no fallback available → throw `RenderError` with code `font_not_found`
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for error message
- [ ] Create test: `backend/services/cert/render/__tests__/fontLoader.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/fontLoader.ts` (create)
- `backend/services/cert/render/__tests__/fontLoader.test.ts` (create)

**Dependencies:** None

**Requirements References:** REQ-RENDER-03 (AC1-AC4)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t08","files":["backend/services/cert/render/fontLoader.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

## Phase 3: Caching & Service Orchestration

### T09: Create Shape Renderer

**Objective:** Implement CSS-based shape rendering for rectangle, circle, and line elements.

**Subtasks:**
- [ ] Create `backend/services/cert/render/shapeRenderer.ts`
- [ ] Implement `renderShape(element)` → returns HTML string
- [ ] Implement `rectangle` rendering: positioned div with width/height, background-color (fill), border (stroke + width)
- [ ] Implement `circle` rendering: positioned div with border-radius 50%, equal width/height, background-color (fill)
- [ ] Implement `line` rendering: positioned div with height = stroke width, background-color = stroke color, rotation for diagonal lines
- [ ] Apply `opacity` from element properties
- [ ] Apply `rotation` transform from element properties (in degrees)
- [ ] Create test: `backend/services/cert/render/__tests__/shapeRenderer.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/shapeRenderer.ts` (create)
- `backend/services/cert/render/__tests__/shapeRenderer.test.ts` (create)

**Dependencies:** None

**Requirements References:** REQ-RENDER-12 (AC1-AC4)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t09","files":["backend/services/cert/render/shapeRenderer.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T10: Create Render Cache

**Objective:** Implement the render cache system with SHA-256 key computation, TTL-based expiry, and storage-based caching.

**Subtasks:**
- [ ] Create `backend/services/cert/render/renderCache.ts`
- [ ] Implement `computeCacheKey(templateId, templateVersion, variableValuesHash, fontConfigHash)` → returns SHA-256 hash
- [ ] Implement `get(cacheKey)` → returns `Promise<Buffer | null>` (checks TTL 24h)
- [ ] Implement `set(cacheKey, pdfBuffer)` → stores PDF in storage at `certificates/cache/{cacheKey}.pdf`
- [ ] Implement `invalidateByTemplate(templateId, version)` → deletes cache files matching template+version
- [ ] Import `StorageService` from `@/backend/services/storage` (Plan 7)
- [ ] Use storage `usageType = "certificate_pdf_cache"` for cache files
- [ ] TTL check: compare storage file `createdAt` + 24h against current time
- [ ] Cache store failures are non-blocking (log warning, return PDF anyway)
- [ ] Create test: `backend/services/cert/render/__tests__/renderCache.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/render/renderCache.ts` (create)
- `backend/services/cert/render/__tests__/renderCache.test.ts` (create)

**Dependencies:** Plan 7 (StorageService)

**Requirements References:** REQ-RENDER-07 (AC1-AC4)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t10","files":["backend/services/cert/render/renderCache.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

### T11: Create Render Service (Main Orchestrator)

**Objective:** Implement the main `RenderService` that orchestrates the full render pipeline: variable resolution → element rendering → cache check → Puppeteer render → storage write → cache store.

**Subtasks:**
- [ ] Create `backend/services/cert/renderService.ts`
- [ ] Implement `renderCertificate(template, certificate, recipientData, locale)` → returns `RenderResult`
- [ ] Implement pipeline steps:
  1. Resolve variables (T05 — `variableResolver.resolve()`)
  2. Compute cache key (T10 — `renderCache.computeCacheKey()`)
  3. Check cache → return cached PDF if hit (T10 — `renderCache.get()`)
  4. Load background image (T07 — `backgroundImageLoader.load()`)
  5. Load Arabic fonts (T08 — `fontLoader.loadArabicFonts()`)
  6. Render elements to HTML (T04 — `elementRenderer.renderElements()`)
  7. Generate QR codes (T06 — `qrCodeGenerator.generate()`)
  8. Render shapes (T09 — `shapeRenderer.renderShape()`)
  9. Construct full HTML document (background + fonts + elements)
  10. Launch Puppeteer page (T03 — `puppeteerManager.getPage()`)
  11. Set HTML content + `page.pdf()` with options from T02 config
  12. Write PDF to storage at `certificates/{templateId}/{certificateId}.pdf` (Plan 7 — `StorageService.writeFile()`)
  13. Register file usage with `usageType = "certificate_pdf"` (Plan 4)
  14. Set PDF metadata (title, author, subject, keywords)
  15. Store in cache (T10 — `renderCache.set()`)
  16. Release Puppeteer page (T03 — `puppeteerManager.releasePage()`)
  17. Return `RenderResult` with path, storageFileId, downloadUrl, fromCache, renderTimeMs
- [ ] Implement error handling: catch each pipeline step, return typed `RenderError` with appropriate error code
- [ ] Implement cleanup: ensure Puppeteer page is released in all paths (try/finally)
- [ ] Use `logger` from `@/backend/lib/logger` for all logging
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for error messages
- [ ] Create test: `backend/services/cert/__tests__/renderService.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/renderService.ts` (create)
- `backend/services/cert/__tests__/renderService.test.ts` (create)

**Dependencies:** T04, T05, T06, T07, T08, T09, T10, T03, T02, Plan 7

**Requirements References:** REQ-RENDER-01 (AC1-AC5), REQ-RENDER-09 (all error codes), REQ-RENDER-10 (AC1-AC4)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t11","files":["backend/services/cert/renderService.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions

---

## Phase 4: Batch Rendering & Knowledge Propagation

### T12: Create Batch Renderer

**Objective:** Implement sequential batch rendering with progress events, max error threshold, and single browser instance reuse.

**Subtasks:**
- [ ] Create `backend/services/cert/batch/batchRenderer.ts`
- [ ] Import `RenderService` from `@/backend/services/cert/renderService` (T11)
- [ ] Implement `renderBatch(template, batchItems, options)` → returns `BatchRenderResult`
- [ ] Sequential rendering: process each `BatchRenderItem` one at a time
- [ ] Reuse single Puppeteer browser instance (T03 — `puppeteerManager` retains browser across renders)
- [ ] Emit progress events: `render_started`, `render_completed`, `render_failed`, `batch_complete`
- [ ] Implement consecutive error counter with `maxErrors` threshold (default: 5)
- [ ] When `maxErrors` reached: abort batch, return partial results with `batch_max_errors` error
- [ ] Return `BatchRenderResult`: array of `{ certificateId, pdfPath, success, error? }`
- [ ] Use `getServerTranslations(locale).errorsTranslations.certificate` for `batch_max_errors` message
- [ ] Use `getServerTranslations(locale).dashboardTranslations.certificateGeneration` for progress messages with Arabic pluralization
- [ ] Use `logger` from `@/backend/lib/logger` for all logging
- [ ] Create test: `backend/services/cert/batch/__tests__/batchRenderer.test.ts`

**Files to Create/Modify:**
- `backend/services/cert/batch/batchRenderer.ts` (create)
- `backend/services/cert/batch/__tests__/batchRenderer.test.ts` (create)

**Dependencies:** T11

**Requirements References:** REQ-RENDER-08 (AC1-AC5)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-06-t12","files":["backend/services/cert/batch/batchRenderer.ts"]}'
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — service layer conventions
- `backend/AGENTS.md` — backend patterns
- `.agents/instructions/backend.instructions.md` — backend instructions
- `shared/AGENTS.md` — i18n system rules (Arabic pluralization)

---

### T13: Knowledge Propagation & Documentation

**Objective:** Synthesize all implementation learnings into canonical docs, update AGENTS.md files, and create the outcome knowledge document.

**Subtasks:**
- [ ] Read all outcome files in `.ai/plans/06-pdf-rendering-engine/outcome/`
- [ ] Create `docs/services/pdf-rendering-engine.md` consolidating:
  - Puppeteer lifecycle pattern (lazy launch, idle timeout, crash recovery)
  - Cache key computation and invalidation strategy
  - Element-to-HTML conversion patterns for all 6 types
  - Arabic font loading and RTL rendering
  - Batch rendering pattern (sequential, progress events, maxErrors)
  - Error handling matrix (8 error codes, cleanup protocol)
- [ ] Update `backend/services/AGENTS.md` — add "PDF Rendering" section with key rules referencing new doc
- [ ] Update `backend/AGENTS.md` — add rendering engine reference to services section
- [ ] Update root `AGENTS.md` Important References — add `docs/services/pdf-rendering-engine.md`
- [ ] Update `.agents/instructions/backend.instructions.md` — add rendering section if new conventions
- [ ] Run global quality check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
- [ ] Write outcome file: `.ai/plans/06-pdf-rendering-engine/outcome/T13-knowledge-propagation-outcome.md`
- [ ] Mark task T13 as `[x]` in `tasks.md`

**Files to Create/Modify:**
- `docs/services/pdf-rendering-engine.md` (create)
- `backend/services/AGENTS.md` (modify)
- `backend/AGENTS.md` (modify)
- `AGENTS.md` (modify — root Important References)
- `.agents/instructions/backend.instructions.md` (modify — if new conventions)

**Dependencies:** T01-T12 (all implementation tasks must be complete)

**Requirements References:** All (knowledge consolidation)

**Quality Loop:**
```bash
bun tsgo
bun biome:check
bun run lint
```

**Instruction Verification:**
- `backend/services/AGENTS.md` — verify new section matches conventions
- `backend/AGENTS.md` — verify reference is correct
- `AGENTS.md` — verify Important References section format

---

## Progress Tracking

| Task | Status |
|---|---|
| T01: Add `qrcode` Dependency | [ ] |
| T02: Create Puppeteer Configuration | [ ] |
| T03: Create Puppeteer Manager | [ ] |
| T04: Create Element Renderer | [ ] |
| T05: Create Variable Resolver | [ ] |
| T06: Create QR Code Generator | [ ] |
| T07: Create Background Image Loader | [ ] |
| T08: Create Arabic Font Loader | [ ] |
| T09: Create Shape Renderer | [ ] |
| T10: Create Render Cache | [ ] |
| T11: Create Render Service | [ ] |
| T12: Create Batch Renderer | [ ] |
| T13: Knowledge Propagation & Documentation | [ ] |
