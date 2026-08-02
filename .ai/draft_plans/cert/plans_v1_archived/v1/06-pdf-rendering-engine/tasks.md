# Tasks: PDF Rendering Engine (Plan 06)

## Document Information

- **Feature Name**: Certificate PDF Rendering Engine
- **Target Directory**: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine`
- **Estimate**: 11 tasks, 2–4 hours each
- **Dependencies**: Plan 04 (Services & Business Logic) must be completed first
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/requirements.md`
  - Design: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/design.md`

---

## Task 1: Install qrcode + @sparticuz/chromium Dependencies

**Estimated time:** 2–3 hours
**Requirements:** Req 1 (PDF Rendering Pipeline), Req 4 (QR Code Generation), Req 8 (Vercel Serverless Compatibility)

### Subtasks

- [ ] 1.1 Install `qrcode` and `@types/qrcode` via `bun add qrcode && bun add -d @types/qrcode`
- [ ] 1.2 Install `@sparticuz/chromium` via `bun add @sparticuz/chromium`
- [ ] 1.3 Verify installation by checking `package.json` and `bun.lock` entries
- [ ] 1.4 Write a quick smoke script to verify `qrcode.toBuffer()` produces a PNG buffer from a test URL
- [ ] 1.5 Write a quick smoke script to verify `chromium.executablePath()` resolves a path on the current platform
- [ ] 1.6 Run `bun tsgo` to verify no type errors from new packages
- [ ] 1.7 Run `bun biome:check` to verify formatting of any modified files

### Quality Loop

After all subtasks: run `bun tsgo`, `bun biome:check`, and `bun run lint` (via lint queue client). All must pass with zero errors.

### Instruction Verification

Read `backend/AGENTS.md` (backend architecture pattern — dependency management patterns) and `backend/services/AGENTS.md` (service layer rules — no external calls in tests).

### _Requirements_

- Req 4.1: `qrcode` npm package for QR code generation
- Req 8.1: `@sparticuz/chromium` for Vercel serverless Chromium binary
- Req 8.4: Vercel packaging configuration

---

## Task 2: Create `variable-resolver.ts` (Resolve Student Data → Template Variables)

**Estimated time:** 2–3 hours
**Requirements:** Req 10 (Variable Resolution), Req 3 (Arabic/RTL Font Handling — date formatting)

### Subtasks

- [ ] 2.1 Create `backend/services/certificates/variable-resolver.ts`
- [ ] 2.2 Define `VariableResolutionContext` interface (student, course, program, certificate, institution, locale)
- [ ] 2.3 Implement `resolveVariables(context: VariableResolutionContext): Map<string, string>` with all variable keys (student.firstName, student.lastName, student.fullName, student.email, course.title, course.code, program.name, certificate.verificationCode, certificate.issueDate, certificate.grade, certificate.score, institution.name, institution.logoUrl, certificate.verificationUrl)
- [ ] 2.4 Implement `resolveVariable(key, context)` single-key resolver function
- [ ] 2.5 Implement Hijri/Gregorian date formatting: use `moment-hijri` for `ar` locale, `date-fns` for `en` locale — check existing Siraj date utility patterns first
- [ ] 2.6 Build verification URL from `process.env.NEXT_PUBLIC_APP_URL` + `/verify/${verificationCode}`
- [ ] 2.7 Log a `logger.warn` for any unresolved variable key (non-fatal)
- [ ] 2.8 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client on the new file

### Quality Loop

```bash
bun tsgo                          # Type check
bun biome:check                   # Biome format + lint
# Lint via queue client:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task2","files":["backend/services/certificates/variable-resolver.ts"]}'
```

### Instruction Verification

Read `backend/services/AGENTS.md` (service layer rules) and `backend/AGENTS.md` (type definition pattern — import types from `@/backend/types`). Verify the `VariableResolutionContext` interface aligns with types to be defined in Plan 02.

### _Requirements_

- Req 10.1–10.6: Variable resolution from student/recipient data, dot-path traversal, missing variable handling, date/number localization
- Req 3.4: date-aware formatting for Arabic (Hijri) vs English (Gregorian)

---

## Task 3: Create `template-html-builder.ts` (Template Elements → Positioned HTML)

**Estimated time:** 3–4 hours
**Requirements:** Req 2 (Template Element Rendering), Req 3 (Arabic/RTL Font Handling)

### Subtasks

- [ ] 3.1 Create `backend/services/certificates/template-html-builder.ts`
- [ ] 3.2 Define `BuildableElement` interface (type, x, y, width, height, zIndex, text/image/qrCode/shape properties)
- [ ] 3.3 Define `BuildHtmlInput` interface (elements, templateWidth, templateHeight, backgroundColor, fontFamily, variables, locale)
- [ ] 3.4 Implement `buildHtmlFromTemplate(input): string` — main entry point producing full HTML document
- [ ] 3.5 Implement `renderElement(el, variables, locale)` — dispatches to type-specific renderers
- [ ] 3.6 Implement `renderTextElement` — `<div style="position:absolute; left:Xpx; top:Ypx; font-size:Npx; color:...; font-family:...; text-align:...; font-weight:...; font-style:...; {rtl styles}">resolved text</div>`
- [ ] 3.7 Implement `renderImageElement` — `<img src="data:{mime};base64,{data}" style="position:absolute; left:Xpx; top:Ypx; width:Wpx; height:Hpx" />`
- [ ] 3.8 Implement `renderQrCodeElement` — `<img src="data:image/png;base64,{qrBase64}" style="position:absolute; ..." />`
- [ ] 3.9 Implement `renderShapeElement` — `<div style="position:absolute; border:...; background:...; border-radius:..."></div>`
- [ ] 3.10 Implement `resolvePlaceholders(content, variables)` — replace `{{variableKey}}` patterns with resolved values, empty string for missing
- [ ] 3.11 Implement `isRtlText(text, locale)` — detect Arabic characters (Unicode range `\u0600-\u06FF`) or Arabic locale
- [ ] 3.12 Implement `escapeHtml(text)` — escape `&`, `<`, `>`, `"`, `'` in text content
- [ ] 3.13 Implement `buildFontFaceDeclarations(locale)` — read Arabic font files from `public/fonts/arabic/`, base64-encode, inject `@font-face` in `<style>`.
- [ ] 3.14 Handle background image as first element with `z-index: 0`
- [ ] 3.15 Sort elements by `zIndex` for correct layering
- [ ] 3.16 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task3","files":["backend/services/certificates/template-html-builder.ts"]}'
```

### Instruction Verification

Read `backend/AGENTS.md` (backend architecture pattern), `backend/services/AGENTS.md` (service layer rules — this is a utility, not a domain service, but must still follow logger pattern). Verify HTML escaping and RTL detection logic.

### _Requirements_

- Req 2.1–2.8: All element type rendering (text, image, QR code, shape), z-index ordering, background handling
- Req 3.1–3.6: Arabic font embedding, `@font-face` injection, RTL detection, font size warning

---

## Task 4: Create `generateQrCode` Utility (QR Code Generation)

**Estimated time:** 2 hours
**Requirements:** Req 4 (QR Code Generation)

### Subtasks

- [ ] 4.1 Add `generateQrCode(verificationUrl): Promise<Buffer>` function — can be a standalone export in `renderer.service.ts` or a separate utility file `qr-code-generator.ts`
- [ ] 4.2 Import `QRCode` from `qrcode` npm package: `import QRCode from "qrcode"`
- [ ] 4.3 Validate `verificationUrl` — must be non-empty and start with `http://` or `https://`; throw localized error `tErrors.cert.invalidVerificationUrl` if invalid
- [ ] 4.4 Generate QR code using `QRCode.toBuffer(url, { errorCorrectionLevel: "M", width: 200, margin: 1 })`
- [ ] 4.5 Return `Buffer` (PNG format)
- [ ] 4.6 Add a helper `generateQrCodeBase64(verificationUrl): Promise<string>` that returns the base64 string for HTML embedding
- [ ] 4.7 Log via `logger.error` if generation fails, re-throw with localized error
- [ ] 4.8 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task4","files":["backend/services/certificates/renderer.service.ts"]}'
```

### Instruction Verification

Read `backend/services/AGENTS.md` (service layer rules — localized errors via `tErrors.cert.*`), `backend/AGENTS.md` (error handling patterns). Verify the `qrcode` package import and usage matches installed version.

### _Requirements_

- Req 4.1: `generateQrCode(verificationUrl)` produces PNG buffer
- Req 4.2: Error correction level `M`, minimum 200x200px
- Req 4.3: Empty/invalid URL throws localized error
- Req 4.4: Base64 data URI conversion for HTML embedding
- Req 4.5: Verification URL from `NEXT_PUBLIC_APP_URL` env

---

## Task 5: Create `puppeteer-launcher.ts` (Vercel/Chromium Configuration)

**Estimated time:** 2–3 hours
**Requirements:** Req 8 (Vercel Serverless Compatibility)

### Subtasks

- [ ] 5.1 Create `backend/services/certificates/puppeteer-launcher.ts`
- [ ] 5.2 Import `puppeteer` from `puppeteer` and `chromium` from `@sparticuz/chromium`
- [ ] 5.3 Implement environment detection: `const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL`
- [ ] 5.4 Implement `launchPuppeteer(): Promise<Browser>` — Vercel path: `puppeteer.launch({ headless: chromium.headless, executablePath: await chromium.executablePath(), args: chromium.args, defaultViewport: chromium.defaultViewport })`
- [ ] 5.5 Local dev path: `puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })`
- [ ] 5.6 Add JSDoc documenting that the caller MUST close the browser in a `finally` block
- [ ] 5.7 Log launch configuration (env, executablePath) via `logger.debug` for diagnostics
- [ ] 5.8 Handle `@sparticuz/chromium` import on platforms where it may not be fully available (wrap in dynamic import or conditional)
- [ ] 5.9 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task5","files":["backend/services/certificates/puppeteer-launcher.ts"]}'
```

### Instruction Verification

Read `backend/AGENTS.md` (backend architecture — no `console.*`, use `logger`), `backend/services/AGENTS.md` (SSR-safe, no external calls without explicit passthrough). Verify that `@sparticuz/chromium` is installed (Task 1).

### _Requirements_

- Req 8.1: `@sparticuz/chromium` used on Vercel for Chromium binary
- Req 8.2: Vercel config: `executablePath`, `args`, `headless` from chromium
- Req 8.3: Local dev: Pup▮peteer bundled Chromium, `headless: true`
- Req 8.5: Launch failure throws localized error `tErrors.cert.renderFailed`
- Req 8.6: Environment detection via `VERCEL` env variable

---

## Task 6: Create `renderer.service.ts` (Orchestration: renderHtml → renderPdf → save → link)

**Estimated time:** 3–4 hours
**Requirements:** Req 1 (PDF Rendering Pipeline), Req 5 (Render Caching), Req 6 (Storage Integration), Req 7 (Thumbnail Generation), Req 11 (Error Handling)

### Subtasks

- [ ] 6.1 Create `backend/services/certificates/renderer.service.ts`
- [ ] 6.2 Define `export namespace CertificateRendererService { ... }` (namespace pattern, not class)
- [ ] 6.3 Implement `renderPdf(input: { template, recipientGroup, certificateId, locale, tErrors }): Promise<CertificateRenderResult>` — top-level entry with cache check
- [ ] 6.4 In `renderPdf`, validate input (non-empty template elements, non-empty recipient group) — throw localized errors
- [ ] 6.5 Set up cache key `ec:cert:render:${templateVersionId}:${recipientGroupId}` with TTL 604800 (7 days) and tags `["cert:render", "cert:tmpl:${templateId}"]`
- [ ] 6.6 Call `cachedReadSingleFlight<CertificateRenderResult>(cacheKey, ttl, () => doRenderPdf(input), tags)` — delegates expensive work to loader
- [ ] 6.7 Implement `doRenderPdf(input)` — the actual render pipeline:
  - [ ] 6.7.1 Resolve variables: `resolveVariables({ recipientGroup, locale })` → `Map<string, string>`
  - [ ] 6.7.2 Build HTML: `renderHtml({ template, variables, locale })`
  - [ ] 6.7.3 Launch Puppeteer: `launchPuppeteer()` → `Browser`
  - [ ] 6.7.4 Set page content: `page.setContent(html, { waitUntil: "networkidle0" })`
  - [ ] 6.7.5 Generate PDF: `page.pdf({ format: "A4", printBackground: true, margin: { all: 0 } })`
  - [ ] 6.7.6 Close browser in `finally` block
  - [ ] 6.7.7 Validate storage path: `StorageService.validatePath("public/certificates/${certificateId}.pdf")`
  - [ ] 6.7.8 Write to storage provider: `getStorageService()` → `writeFile(filePath, pdfBuffer)`
  - [ ] 6.7.9 Create DB record: `StorageService.createFileAndGet(filePath)`
  - [ ] 6.7.10 Link to entity: `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_pdf", filePath })`
  - [ ] 6.7.11 Compute SHA-256 content hash: `crypto.createHash("sha256").update(pdfBuffer).digest("hex")`
  - [ ] 6.7.12 Compute file size: `BigInt(pdfBuffer.length)`
  - [ ] 6.7.13 Generate thumbnail: `generateThumbnail(pdfBuffer, certificateId)` — wrap in try/catch (non-blocking)
  - [ ] 6.7.14 Log success: `logger.info("Certificate PDF rendered", { certificateId, templateVersionId, fileSize, durationMs })`
  - [ ] 6.7.15 Return `{ filePath, fileSize, contentHash }`
- [ ] 6.8 Implement `renderHtml(input: { template, variables, locale }): string` — delegates to `buildHtmlFromTemplate`
- [ ] 6.9 Implement `generateThumbnail(pdfBuffer, certificateId): Promise<ThumbnailResult>` — use `sharp` to resize first page to 400px width PNG, save to storage, link with `usageType: "certificate_thumbnail"`
- [ ] 6.10 Wrap all stages in try/catch with localized error handling: `throw new Error(tErrors.cert.renderFailed)` for Puppeteer failures, `tErrors.cert.storageFailed` for storage failures
- [ ] 6.11 Log all errors via `logger.error` with context (certificateId, templateVersionId, error stack) before re-throwing
- [ ] 6.12 Import types from `@/backend/types` (CertificateTemplateReturnType, CertificateRenderResult, ThumbnailResult, VariableResolutionContext) — NOT local type definitions
- [ ] 6.13 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task6","files":["backend/services/certificates/renderer.service.ts"]}'
```

### Instruction Verification

Read `backend/AGENTS.md` (type definition pattern — import from `@/backend/types`, single canonical object type), `backend/services/AGENTS.md` (namespace pattern, localized errors, SSR-safe, cachedReadSingleFlight usage), and `docs/services/entity-cache-service.md` (EntityCacheService patterns — fail-open, permission checks before cache, key formats).

### _Requirements_

- Req 1.1–1.7: Full render pipeline, storage save, content hash, error handling, logging, independent `renderHtml`
- Req 5.1–5.8: Render caching with `cachedReadSingleFlight`, cache key format, tags, TTL, fail-open, permission before cache, invalidation
- Req 6.1–6.6: Storage integration — save path, `createFileAndGet`, `linkFileToEntity`, `validatePath`, reuse existing route, regeneration unlink
- Req 7.1–7.5: Thumbnail generation via `sharp`, resize to 400px, storage link, fallback on failure
- Req 11.1–11.8: Error handling and localization for all pipeline stages

---

## Task 7: Create `generateThumbnail` Utility (Sharp-Based PNG Thumbnail)

**Estimated time:** 2 hours
**Requirements:** Req 7 (Thumbnail Generation)

### Subtasks

- [ ] 7.1 Implement `generateThumbnail(pdfBuffer: Buffer, certificateId: string): Promise<ThumbnailResult>` within `CertificateRendererService` namespace (in `renderer.service.ts`)
- [ ] 7.2 Import `sharp` from `sharp` (already installed as devDependency — verify it is available)
- [ ] 7.3 Use `sharp(pdfBuffer, { pages: 1 }).resize({ width: 400, withoutEnlargement: true }).png().toBuffer()` to generate thumbnail
- [ ] 7.4 Save to storage: `const thumbPath = "public/certificates/${certificateId}-thumb.png"`
- [ ] 7.5 Validate path: `StorageService.validatePath(thumbPath)`
- [ ] 7.6 Write to storage provider: `getStorageService().writeFile(thumbPath, thumbnailBuffer)`
- [ ] 7.7 Create DB record: `StorageService.createFileAndGet(thumbPath)`
- [ ] 7.8 Link to entity: `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_thumbnail", filePath: thumbPath })`
- [ ] 7.9 Return `{ filePath: thumbPath, fileSize: BigInt(thumbnailBuffer.length) }`
- [ ] 7.10 Wrap in try/catch — if `sharp` fails (format incompatibility), log `logger.warn` and rethrow (non-blocking for the render pipeline — the caller in `doRenderPdf` wraps this in its own try/catch)
- [ ] 7.11 Run per-file quality loop: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
# If this function is part of renderer.service.ts, the lint from Task 6 covers it.
# If it's in a separate file, run lint on that file:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task7","files":["backend/services/certificates/renderer.service.ts"]}'
```

### Instruction Verification

Read `backend/AGENTS.md` (storage patterns — `StorageService.linkFileToEntity` with `referenceTable` and `usageType`), `backend/services/AGENTS.md` (logger pattern). Verify `sharp` is available (check `package.json` devDependencies — `sharp@0.35.3`).

### _Requirements_

- Req 7.1: `generateThumbnail(pdfBuffer)` produces PNG via `sharp`
- Req 7.2: Resize to max 400px width, maintain aspect ratio
- Req 7.3: Save to `public/certificates/${certificateId}-thumb.png`, link with `usageType: "certificate_thumbnail"`
- Req 7.4: `sharp` failure → warn and continue (non-blocking)
- Req 7.5: Return `{ filePath, fileSize }`

---

## Task 8: Wire EntityCacheService Caching (Cache Keys, Tags, Invalidation Helpers)

**Estimated time:** 2–3 hours
**Requirements:** Req 5 (Render Caching)

### Subtasks

- [ ] 8.1 Ensure `renderPdf` in `renderer.service.ts` calls `cachedReadSingleFlight` with key `ec:cert:render:${templateVersionId}:${recipientGroupId}` (should be done in Task 6, verify here)
- [ ] 8.2 Verify cache TTL is 604800 seconds (7 days) — must be ≤ `CACHE_TAG_INDEX_TTL` (86400s). **Note:** If 7-day TTL exceeds tag index TTL, reduce to 86400 (1 day) and document. Update design.md if needed.
- [ ] 8.3 Verify cache tags: `["cert:render", "cert:tmpl:${template.id}"]`
- [ ] 8.4 Create or update `backend/services/certificates/cache-invalidation.ts` (from Plan 04 — add render-specific invalidation helpers)
- [ ] 8.5 Implement `invalidateCertificateTemplateWrite(templateId)` — calls `invalidateTag("cert:tmpl:${templateId}")`, wrapped in try/catch, logs via `logger.warn` on failure
- [ ] 8.6 Implement `invalidateCertificateWrite(certificateId)` — calls `invalidateTag("cert:cert:${certificateId}")`, wrapped in try/catch, logs via `logger.warn` on failure
- [ ] 8.7 Import `invalidateTag` from `@/backend/services/cache` (EntityCacheService)
- [ ] 8.8 Verify both invalidation helpers are fail-open (never throw to caller)
- [ ] 8.9 Ensure permission checks happen BEFORE `cachedReadSingleFlight` — verify in `renderPdf` that the caller (generation service from Plan 04) gates permissions first
- [ ] 8.10 Export invalidation helpers from `backend/services/certificates/index.ts` barrel
- [ ] 8.11 Run per-file quality loop on `cache-invalidation.ts` and `renderer.service.ts`: `bun tsgo` + `bun biome:check` + lint queue client

### Quality Loop

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task8","files":["backend/services/certificates/cache-invalidation.ts","backend/services/certificates/renderer.service.ts","backend/services/certificates/index.ts"]}'
```

### Instruction Verification

Read `backend/services/AGENTS.md` (Hot-resolver & Read Caching — cache keys identity+role scoped, named invalidation helpers, fail-open contract, permission checks before cache lookup) and `docs/services/entity-cache-service.md` (EntityCacheService API — `cachedReadSingleFlight`, `invalidateTag`, tag indexing, CACHE_TAG_INDEX_TTL constraint).

### _Requirements_

- Req 5.1: `cachedReadSingleFlight` with key `ec:cert:render:${templateVersionId}:${recipientGroupId}` before Puppeteer
- Req 5.2: Cache hit returns cached result without rendering
- Req 5.3: Cache miss executes full pipeline, caches with tags `["cert:render", "cert:tmpl:${templateId}"]`
- Req 5.4: Template edit → `invalidateCertificateTemplateWrite(templateId)` → `invalidateTag`
- Req 5.5: Certificate revoke → `invalidateCertificateWrite(certificateId)` → `invalidateTag`
- Req 5.6: Cache provider failure → fall through to loader (fail-open)
- Req 5.7: Permission checks BEFORE cache lookup
- Req 5.8: Invalidation wrapped in try/catch, fails open

---

## Task 9: Update `vercel.json` for Puppeteer/Chromium Serverless Configuration

**Estimated time:** 1–2 hours
**Requirements:** Req 8 (Vercel Serverless Compatibility)

### Subtasks

- [ ] 9.1 Read existing `vercel.json` and preserve existing `fluid` and `crons` settings
- [ ] 9.2 Add `functions` configuration for certificate API routes:
  ```json
  "functions": {
    "app/api/certificates/**/*.ts": {
      "maxDuration": 60,
      "includeFiles": "node_modules/@sparticuz/chromium/**"
    }
  }
  ```
- [ ] 9.3 Verify the `includeFiles` pattern matches `@sparticuz/chromium`'s package structure — the `.br` or `.gz` binary file must be included
- [ ] 9.4 Document in a comment or nearby config why `maxDuration: 60` is needed (Puppeteer cold start + render time)
- [ ] 9.5 Run `bun tsgo` to verify no TypeScript config breaks from vercel.json changes (it shouldn't, but verify)
- [ ] 9.6 Document the Vercel packaging decision in the outcome file for Task 9
- [ ] 9.7 If the `functions` pattern causes issues with existing route configs, use `regions` or a separate serverless function approach instead — document the chosen approach

### Quality Loop

`vercel.json` is configuration, not TypeScript — no tsgo/biome needed. But verify JSON validity:

```bash
# Validate JSON
cat vercel.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

### Instruction Verification

Read `backend/AGENTS.md` (no specific Vercel rules, but verify no existing Vercel config conflicts). Check Vercel documentation for function configuration syntax — the current `vercel.json` uses `fluid: true` which may affect function configuration.

### _Requirements_

- Req 8.1: `@sparticuz/chromium` used on Vercel
- Req 8.4: Vercel `includeFiles` and `maxDuration` configuration
- Req 8.6: Environment detection via `VERCEL` env variable

---

## Task 10: Quality Loop — Per-File Verification + Instruction Compliance

**Estimated time:** 3–4 hours
**Requirements:** Req 0 (Execution Outcome Protocol), All requirements (verification)

### Subtasks

- [ ] 10.1 Run `bun tsgo` globally — must pass with zero errors. Fix any type errors in new files (`variable-resolver.ts`, `template-html-builder.ts`, `puppeteer-launcher.ts`, `renderer.service.ts`, `index.ts`, `cache-invalidation.ts`)
- [ ] 10.2 Run `bun biome:check` globally — must pass with zero errors/warnings. Fix any formatting/linting issues
- [ ] 10.3 Start the lint queue server: `~/.bun/bin/bun run scripts/lint-queue-server.ts` (if not already running)
- [ ] 10.4 Run `bun run lint` (full-repo lint via queue) — must pass with zero errors
- [ ] 10.5 For each new file, verify instruction compliance:
  - [ ] 10.5.1 `variable-resolver.ts` → Read `backend/AGENTS.md` (type pattern), `backend/services/AGENTS.md` (service rules). Check: types from `@/backend/types`, logger instead of console, no hardcoded error strings.
  - [ ] 10.5.2 `template-html-builder.ts` → Read same AGENTS files. Check: logger for warnings, no console, proper escaping.
  - [ ] 10.5.3 `puppeteer-launcher.ts` → Read same AGENTS files. Check: logger.debug for config, no console, env detection.
  - [ ] 10.5.4 `renderer.service.ts` → Read `backend/AGENTS.md`, `backend/services/AGENTS.md`, `docs/services/entity-cache-service.md`. Check: namespace pattern, cachedReadSingleFlight usage, StorageService.linkFileToEntity, tErrors.cert.* localization, logger usage.
  - [ ] 10.5.5 `cache-invalidation.ts` → Read `backend/services/AGENTS.md` (Hot-resolver caching section). Check: fail-open try/catch, named helpers, invalidateTag import.
- [ ] 10.6 Verify `backend/services/index.ts` barrel export includes `@/backend/services/certificates`
- [ ] 10.7 Verify `backend/services/certificates/index.ts` barrel exports all public functions
- [ ] 10.8 Run `bun quality-gate` if no issues found — it runs the full pipeline (tsgo → biome → lint → codescene → sonar)
- [ ] 10.9 Write outcome files for each task completed (Tasks 1–9) if not already written
- [ ] 10.10 Write the summary outcome file `outcome/00-summary-outcome.md`

### Quality Loop

This task IS the quality loop. No additional verification needed beyond successful `bun quality-gate`.

### Instruction Verification

Read ALL applicable AGENTS.md files (root, backend, backend/services) and instruction files (`.github/instructions/backend.instructions.md`). Verify each new file complies with all applicable rules.

### _Requirements_

- Req 0.4: Per-file verification (tsgo + biome + lint-queue)
- Req 0.5: Global quality run (tsgo + biome + lint, zero errors)
- Req 11.1–11.8: All error handling uses localized messages

---

## Task 11: Knowledge Propagation (Update AGENTS.md, Docs, Barrels)

**Estimated time:** 2–3 hours
**Requirements:** Req 12 (Outcome Knowledge Base & Progress Tracking)

### Subtasks

- [ ] 11.1 Update `backend/services/certificates/AGENTS.md` (create if it doesn't exist from Plan 04) — document:
  - [ ] The rendering pipeline architecture (hybrid pdfme + Puppeteer)
  - [ ] `CertificateRendererService` namespace and public API
  - [ ] Variable resolver pattern (`resolveVariables` → `Map<string, string>`)
  - [ ] Template HTML builder pattern (elements → positioned HTML)
  - [ ] Puppeteer launcher pattern (Vercel vs local dev)
  - [ ] Cache key format: `ec:cert:render:${templateVersionId}:${recipientGroupId}`
  - [ ] Cache invalidation helpers: `invalidateCertificateTemplateWrite`, `invalidateCertificateWrite`
  - [ ] Storage integration: `usageType: "certificate_pdf"`, `usageType: "certificate_thumbnail"`
  - [ ] Error namespace: `tErrors.cert.*`
- [ ] 11.2 Create `docs/services/certificate-rendering.md` — document the hybrid rendering approach, font embedding strategy, Vercel considerations, and the full data flow diagram
- [ ] 11.3 Update `backend/services/index.ts` — ensure `export * from "@/backend/services/certificates"` is added (or verify Plan 04 added it)
- [ ] 11.4 Update `backend/services/certificates/index.ts` barrel — export `CertificateRendererService`, `resolveVariables`, `buildHtmlFromTemplate`, `launchPuppeteer`, `invalidateCertificateTemplateWrite`, `invalidateCertificateWrite`
- [ ] 11.5 Write outcome files for each task:
  - [ ] 11.5.1 `outcome/01-deps-install-outcome.md`
  - [ ] 11.5.2 `outcome/02-variable-resolver-outcome.md`
  - [ ] 11.5.3 `outcome/03-template-html-builder-outcome.md`
  - [ ] 11.5.4 `outcome/04-qr-code-gen-outcome.md`
  - [ ] 11.5.5 `outcome/05-puppeteer-launcher-outcome.md`
  - [ ] 11.5.6 `outcome/06-renderer-service-outcome.md`
  - [ ] 11.5.7 `outcome/07-thumbnail-gen-outcome.md`
  - [ ] 11.5.8 `outcome/08-cache-wiring-outcome.md`
  - [ ] 11.5.9 `outcome/09-vercel-json-outcome.md`
  - [ ] 11.5.10 `outcome/10-quality-loop-outcome.md`
  - [ ] 11.5.11 `outcome/11-knowledge-propagation-outcome.md`
- [ ] 11.6 Write `outcome/00-summary-outcome.md` — plan-level summary of rendering engine architecture, all files created, dependency state, verification results, carry-forward notes for Plan 07 and Plan 08
- [ ] 11.7 Run final quality loop: `bun tsgo` + `bun biome:check` + `bun run lint` — all must pass
- [ ] 11.8 Verify outcome directory exists: `mkdir -p .ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome`

### Quality Loop

```bash
bun tsgo
bun biome:check
bun run lint   # Full-repo lint via queue
```

### Instruction Verification

Read root `AGENTS.md` (AI Agent Communication Rules — "NEVER create summary markdown files" BUT "Documentation files that are part of project structure (README.md, CONTRIBUTING.md)" are exceptions — `AGENTS.md` in `backend/services/certificates/` and `docs/services/certificate-rendering.md` are project documentation, not summary files). Verify outcome files follow the pattern from Plan 01's `requirements.md` Requirement 0.

### _Requirements_

- Req 12.1: Outcome files written for each task
- Req 12.2: Outcome files reference source analysis files and line numbers
- Req 12.3: Final summary outcome file `00-summary-outcome.md`
- Req 12.4: Subsequent plans (07, 08) read outcome files before implementation
- Req 12.5: Outcome files include task ID, title, completion date, verification results

---

## Task Dependency Graph

```
Task 1 (Install deps)
  ├── Task 4 (generateQrCode) — needs qrcode
  ├── Task 5 (puppeteer-launcher) — needs @sparticuz/chromium
  └── Task 7 (thumbnail) — needs sharp (already installed)

Task 2 (variable-resolver)
  └── Task 6 (renderer.service) — needs resolveVariables

Task 3 (template-html-builder)
  └── Task 6 (renderer.service) — needs buildHtmlFromTemplate

Task 4 (generateQrCode)
  └── Task 6 (renderer.service) — needs generateQrCode

Task 5 (puppeteer-launcher)
  └── Task 6 (renderer.service) — needs launchPuppeteer

Task 6 (renderer.service)
  ├── Task 7 (thumbnail — part of renderer.service)
  ├── Task 8 (cache wiring — part of renderer.service)
  └── Task 10 (quality loop)

Task 8 (cache wiring)
  └── Task 10 (quality loop)

Task 9 (vercel.json) — independent, can run in parallel with Tasks 2–8

Task 10 (quality loop) — depends on all Tasks 1–9

Task 11 (knowledge propagation) — depends on Task 10
```

**Recommended execution order:**

1. Task 1 (install deps) — no dependencies
2. Task 2 (variable-resolver) — no dependencies except types from Plan 02
3. Task 3 (template-html-builder) — no dependencies except types
4. Task 4 (generateQrCode) — depends on Task 1 (qrcode)
5. Task 5 (puppeteer-launcher) — depends on Task 1 (@sparticuz/chromium)
6. Task 9 (vercel.json) — independent, can run in parallel with Tasks 2–8
7. Task 6 (renderer.service) — depends on Tasks 2, 3, 4, 5
8. Task 7 (thumbnail) — part of Task 6, but can be verified separately
9. Task 8 (cache wiring) — depends on Task 6 (renderer.service scaffolding)
10. Task 10 (quality loop) — depends on all above
11. Task 11 (knowledge propagation) — depends on Task 10

---

## Verification Checklist (Final)

Before marking this plan complete:

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors (via lint queue)
- [ ] `package.json` has `qrcode`, `@types/qrcode`, `@sparticuz/chromium` in dependencies
- [ ] `vercel.json` has `functions.includedFiles` for `@sparticuz/chromium`
- [ ] `backend/services/certificates/renderer.service.ts` exists with `CertificateRendererService` namespace
- [ ] `backend/services/certificates/variable-resolver.ts` exists with `resolveVariables` function
- [ ] `backend/services/certificates/template-html-builder.ts` exists with `buildHtmlFromTemplate` function
- [ ] `backend/services/certificates/puppeteer-launcher.ts` exists with `launchPuppeteer` function
- [ ] `backend/services/certificates/index.ts` barrel exports all public functions
- [ ] `backend/services/certificates/cache-invalidation.ts` has `invalidateCertificateTemplateWrite` and `invalidateCertificateWrite`
- [ ] `backend/services/index.ts` exports `@/backend/services/certificates`
- [ ] `backend/services/certificates/AGENTS.md` documents the rendering pipeline
- [ ] `docs/services/certificate-rendering.md` documents the architecture
- [ ] All outcome files written to `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome/`
- [ ] No `console.*` in any new file (use `logger.*` from `@/backend/lib/logger`)
- [ ] No hardcoded error strings (all use `tErrors.cert.*` namespace)
- [ ] No relative imports (all use `@/*` path alias)
