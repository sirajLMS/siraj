# Design: PDF Rendering Engine (Plan 06)

## Document Information

- **Feature Name**: Certificate PDF Rendering Engine
- **Target Directory**: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/requirements.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/11-pdf-rendering-deps.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md` (lines 651–663, 1015–1018)
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/07-storage-file-system.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md`

---

## 1. Architecture Overview

### 1.1 Hybrid Rendering Strategy

The certificate PDF rendering engine uses a **hybrid approach**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Certificate PDF Rendering Pipeline               │
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐               │
│  │ Template  │──▶│ Variable     │──▶│ Template HTML   │               │
│  │ (pdfme    │   │ Resolver     │   │ Builder         │               │
│  │  schema)  │   │              │   │ (→ HTML string) │               │
│  └──────────┘   └──────────────┘   └────────┬────────┘               │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐               │
│                                     │ Puppeteer       │               │
│                                     │ Launcher        │               │
│                                     │ (HTML → PDF)    │               │
│                                     └────────┬────────┘               │
│                                              │                        │
│                                     ┌────────┴────────┐               │
│                                     │ PDF Buffer       │               │
│                                     └────────┬────────┘               │
│                              ┌───────────────┼───────────────┐        │
│                              ▼               ▼               ▼        │
│                        ┌──────────┐  ┌──────────────┐ ┌───────────┐  │
│                        │ sha256   │  │ sharp thumb  │ │ Storage   │  │
│                        │ hash     │  │ (PNG preview)│ │ save+link │  │
│                        └──────────┘  └──────────────┘ └───────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │          CertificateRendererService (orchestrator)            │  │
│  │  cachedReadSingleFlight("ec:cert:render:...")                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- **pdfme template schema** (`@pdfme/ui`, `@pdfme/schemas`) — stores the template element definitions (positions, types, properties, variable bindings). Plan 07's visual template editor uses `@pdfme/ui` for drag-and-drop authoring. The schema data is persisted in the `certificate_template_versions` table (Plan 01).
- **Puppeteer** (`puppeteer@25.4.0`, already installed) — renders the final PDF by converting the pdfme template schema to absolutely-positioned HTML, injecting Arabic fonts via `@font-face`, and calling `page.pdf()`. This gives full HTML/CSS layout freedom and easy RTL font embedding.
- **`@sparticuz/chromium`** — provides the Chromium binary for Puppeteer in Vercel serverless functions (Vercel's runtime does not include a bundled Chrome).

### 1.2 File Layout

```
backend/services/certificates/
├── index.ts                       ← barrel: re-exports all cert service namespaces
├── renderer.service.ts            ← CertificateRendererService namespace (orchestrator)
├── template-html-builder.ts       ← buildHtmlFromTemplate(): elements → positioned HTML string
├── variable-resolver.ts           ← resolveVariables(): recipient data → Map<key, value>
├── puppeteer-launcher.ts          ← launchPuppeteer(): env-aware Chromium launcher
└── (from Plan 04)
    ├── generation.service.ts      ← CertificateGenerationService (calls renderPdf)
    ├── template.service.ts        ← CertificateTemplateService
    ├── certificate.service.ts     ← CertificateService (CRUD, verification)
    └── cache-invalidation.ts      ← invalidateCertificateTemplateWrite, invalidateCertificateWrite
```

> **Note:** Files `generation.service.ts`, `template.service.ts`, `certificate.service.ts`, and `cache-invalidation.ts` are created in Plan 04 (Services & Business Logic). This plan adds the **rendering-specific** files: `renderer.service.ts`, `template-html-builder.ts`, `variable-resolver.ts`, `puppeteer-launcher.ts`, and `index.ts`. It also updates `cache-invalidation.ts` to wire `invalidateCertificateTemplateWrite` / `invalidateCertificateWrite` to call `invalidateTag` for the render cache.

### 1.3 Dependency Graph

```
renderer.service.ts
  ├── imports variable-resolver.ts     (resolveVariables)
  ├── imports template-html-builder.ts (buildHtmlFromTemplate)
  ├── imports puppeteer-launcher.ts    (launchPuppeteer)
  ├── imports StorageService           (createFileAndGet, linkFileToEntity)
  ├── imports cachedReadSingleFlight   (EntityCacheService)
  ├── imports invalidateTag            (EntityCacheService)
  ├── imports logger                   (@/backend/lib/logger)
  ├── imports getServerTranslations    (@/shared/locale/server-graphql)
  ├── imports qrcode                   (npm: QR code generation)
  └── imports sharp                    (npm: thumbnail generation)

template-html-builder.ts
  ├── accepts variables Map (resolved by variable-resolver)
  ├── accepts template elements (from pdfme schema, Plan 01 types)
  └── imports logger (@/backend/lib/logger)

variable-resolver.ts
  └── accepts VariableResolutionContext (student, course, certificate, institution, locale)

puppeteer-launcher.ts
  ├── imports puppeteer (npm)
  └── imports @sparticuz/chromium (npm, conditional on Vercel env)
```

---

## 2. Detailed File Designs

### 2.1 `renderer.service.ts` — `CertificateRendererService`

**Purpose:** Orchestrates the full rendering pipeline: variable resolution → HTML building → Puppeteer PDF generation → storage save → thumbnail generation → caching.

**Pattern compliance:**
- Namespace pattern: `export namespace CertificateRendererService { ... }` (no class instances)
- Import types from `@/backend/types` (certificate types from Plan 02)
- Error handling: `throw new Error(tErrors.cert.*)` with localized messages from `getServerTranslations(locale, "errors")`
- Logging: `import { logger } from "@/backend/lib/logger"` (never `console.*`)
- Caching: `cachedReadSingleFlight` from `@/backend/services/cache`

**Type definitions (imported from `@/backend/types`):**

```typescript
// From Plan 02 — backend/types/certificates/certificate.types.ts
import type {
  CertificateTemplateReturnType,    // template + current version + elements
  CertificateTemplateElementReturnType, // single element (text, image, qr, shape)
  CertificateReturnType,             // certificate record
  CertificateRenderResult,           // { filePath, fileSize, contentHash }
  ThumbnailResult,                    // { filePath, fileSize }
  VariableResolutionContext,          // { student, course, program, certificate, institution, locale }
} from "@/backend/types";
```

**Public API:**

```typescript
export namespace CertificateRendererService {

  /**
   * Full render pipeline: template + recipient data → cached PDF + storage link.
   * Uses cachedReadSingleFlight to coalesce concurrent requests.
   *
   * @param input.template - The template with current version + elements
   * @param input.recipientGroup - The recipient group context (students, variables)
   * @param input.certificateId - The certificate record to link the PDF to
   * @param input.locale - "ar" | "en" for font/text direction
   * @param input.tErrors - Localized error labels
   * @returns { filePath, fileSize, contentHash }
   */
  export async function renderPdf(input: {
    template: CertificateTemplateReturnType;
    recipientGroup: { id: string; students: VariableResolutionContext["student"][] };
    certificateId: string;
    locale: string;
    tErrors: ErrorsLabels;
  }): Promise<CertificateRenderResult>;

  /**
   * Build the HTML string from template + resolved variables.
   * Does NOT launch Puppeteer — can be used for debugging, previews, or
   * as a standalone util.
   */
  export function renderHtml(input: {
    template: CertificateTemplateReturnType;
    variables: Map<string, string>;
    locale: string;
  }): string;

  /**
   * Generate a QR code PNG buffer encoding the verification URL.
   * @param verificationUrl - Full URL, e.g. "https://siraj.app/verify/ABC123"
   * @returns PNG Buffer
   */
  export async function generateQrCode(verificationUrl: string): Promise<Buffer>;

  /**
   * Generate a PNG thumbnail from a PDF buffer using sharp.
   * @param pdfBuffer - The PDF file bytes
   * @param certificateId - For constructing the thumbnail file path
   * @returns { filePath, fileSize }
   */
  export async function generateThumbnail(
    pdfBuffer: Buffer,
    certificateId: string,
  ): Promise<ThumbnailResult>;
}
```

**`renderPdf` internal flow:**

```typescript
export async function renderPdf(input): Promise<CertificateRenderResult> {
  const { template, recipientGroup, certificateId, locale, tErrors } = input;

  if (!template?.elements?.length) {
    throw new Error(tErrors.cert.templateEmpty);
  }
  if (!recipientGroup?.students?.length) {
    throw new Error(tErrors.cert.recipientGroupEmpty(recipientGroup.id));
  }

  const templateVersionId = template.currentVersionId;
  const cacheKey = `ec:cert:render:${templateVersionId}:${recipientGroup.id}`;
  const cacheTags = ["cert:render", `cert:tmpl:${template.id}`];
  const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  // Permission checks happen BEFORE cachedReadSingleFlight (caller's responsibility)

  return cachedReadSingleFlight<CertificateRenderResult>(
    cacheKey,
    CACHE_TTL,
    () => doRenderPdf(input),  // the actual expensive render
    cacheTags,
  );
}

async function doRenderPdf(input): Promise<CertificateRenderResult> {
  const { template, certificateId, locale, tErrors } = input;

  // 1. Resolve variables from recipient data
  const variables = resolveVariables({
    recipientGroup: input.recipientGroup,
    locale,
  });

  // 2. Build HTML string from template + variables
  const html = renderHtml({ template, variables, locale });

  // 3. Launch Puppeteer and render to PDF
  let browser;
  try {
    browser = await launchPuppeteer();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // 4. Save to storage
    const filePath = `public/certificates/${certificateId}.pdf`;
    if (!StorageService.validatePath(filePath)) {
      throw new Error(tErrors.cert.storageFailed);
    }

    // Write to storage provider (local FS / Vercel Blob)
    const storageService = await getStorageService();
    await storageService.writeFile(filePath, pdfBuffer);

    // Create DB record + link to certificate
    await StorageService.createFileAndGet(filePath);
    await StorageService.linkFileToEntity({
      referenceTable: "certificates",
      referenceId: certificateId,
      usageType: "certificate_pdf",
      filePath,
    });

    // 5. Compute content hash + file size
    const contentHash = createHash("sha256").update(pdfBuffer).digest("hex");
    const fileSize = BigInt(pdfBuffer.length);

    // 6. Generate thumbnail (fire-and-forget with warning on failure)
    try {
      await generateThumbnail(pdfBuffer, certificateId);
    } catch (thumbErr) {
      logger.warn("Thumbnail generation failed (non-blocking)", {
        certificateId,
        error: String(thumbErr),
      });
    }

    logger.info("Certificate PDF rendered successfully", {
      certificateId,
      templateVersionId: template.currentVersionId,
      fileSize: fileSize.toString(),
      renderDurationMs: Date.now() - startTime,
    });

    return { filePath, fileSize, contentHash };
  } catch (error) {
    logger.error("Certificate PDF render failed", {
      certificateId,
      templateVersionId: template.currentVersionId,
      error: String(error),
    });
    throw new Error(tErrors.cert.renderFailed);
  } finally {
    if (browser) await browser.close();
  }
}
```

**`renderHtml` implementation (delegates to `template-html-builder.ts`):**

```typescript
export function renderHtml(input: {
  template: CertificateTemplateReturnType;
  variables: Map<string, string>;
  locale: string;
}): string {
  return buildHtmlFromTemplate({
    elements: input.template.elements,
    templateWidth: input.template.width,
    templateHeight: input.template.height,
    backgroundColor: input.template.backgroundColor,
    fontFamily: input.template.fontFamily,
    variables: input.variables,
    locale: input.locale,
  });
}
```

**`generateQrCode` implementation:**

```typescript
import QRCode from "qrcode";

export async function generateQrCode(verificationUrl: string): Promise<Buffer> {
  if (!verificationUrl || !verificationUrl.startsWith("http")) {
    throw new Error(tErrors.cert.invalidVerificationUrl);
  }
  const pngBuffer = await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: "M",
    width: 200,
    margin: 1,
  });
  return pngBuffer;
}
```

**`generateThumbnail` implementation:**

```typescript
import sharp from "sharp";

export async function generateThumbnail(
  pdfBuffer: Buffer,
  certificateId: string,
): Promise<ThumbnailResult> {
  try {
    const thumbnailBuffer = await sharp(pdfBuffer, { pages: 1 })
      .resize({ width: 400, withoutEnlargement: true })
      .png()
      .toBuffer();

    const filePath = `public/certificates/${certificateId}-thumb.png`;
    if (!StorageService.validatePath(filePath)) {
      throw new Error("Invalid thumbnail path");
    }

    const storageService = await getStorageService();
    await storageService.writeFile(filePath, thumbnailBuffer);
    await StorageService.createFileAndGet(filePath);
    await StorageService.linkFileToEntity({
      referenceTable: "certificates",
      referenceId: certificateId,
      usageType: "certificate_thumbnail",
      filePath,
    });

    return { filePath, fileSize: BigInt(thumbnailBuffer.length) };
  } catch (error) {
    logger.warn("Thumbnail generation failed", { certificateId, error: String(error) });
    // Non-fatal — thumbnail is optional
    throw error;
  }
}
```

### 2.2 `template-html-builder.ts` — `buildHtmlFromTemplate`

**Purpose:** Converts pdfme template schema elements to absolutely-positioned HTML string for Puppeteer rendering.

**No namespace** — this is a utility function, not a domain service. Exported as a pure function.

**Type definitions:**

```typescript
// Element types mirror pdfme schema (from Plan 01 types)
export interface BuildableElement {
  id: string;
  type: "text" | "image" | "qrCode" | "shape";
  x: number;        // top-left X in px
  y: number;        // top-left Y in px
  width: number;    // px
  height: number;   // px
  zIndex: number;
  // Type-specific properties
  text?: {
    content: string;            // may contain {{variable}} placeholders
    fontSize: number;
    color: string;              // hex color
    fontFamily: string;
    alignment: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
  };
  image?: {
    base64Data: string;
    mimeType: string;
  };
  qrCode?: {
    verificationUrl: string;
  };
  shape?: {
    borderStyle?: string;
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
  };
}
```

**Key function:**

```typescript
export interface BuildHtmlInput {
  elements: BuildableElement[];
  templateWidth: number;
  templateHeight: number;
  backgroundColor?: string;
  fontFamily?: string;
  variables: Map<string, string>;
  locale: string;
}

export function buildHtmlFromTemplate(input: BuildHtmlInput): string {
  const fontFaces = buildFontFaceDeclarations(input.locale);
  const resolvedElements = input.elements
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(el => renderElement(el, input.variables, input.locale))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${input.templateWidth}px;
      height: ${input.templateHeight}px;
      margin: 0;
      padding: 0;
      background-color: ${input.backgroundColor ?? "#ffffff"};
      font-family: ${input.fontFamily ?? "sans-serif"};
      position: relative;
    }
    ${fontFaces}
  </style>
</head>
<body>
${resolvedElements}
</body>
</html>`;
}
```

**Element rendering functions:**

```typescript
function renderElement(
  el: BuildableElement,
  variables: Map<string, string>,
  locale: string,
): string {
  const baseStyle = `position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; z-index:${el.zIndex}`;

  switch (el.type) {
    case "text":
      return renderTextElement(el, baseStyle, variables, locale);
    case "image":
      return renderImageElement(el, baseStyle);
    case "qrCode":
      return renderQrCodeElement(el, baseStyle);
    case "shape":
      return renderShapeElement(el, baseStyle);
    default:
      logger.warn("Unknown template element type", { type: el.type, id: el.id });
      return "";
  }
}

function renderTextElement(el, baseStyle, variables, locale): string {
  const text = resolvePlaceholders(el.text!.content, variables);
  const rtl = isRtlText(text, locale);
  const style = `${baseStyle}; font-size:${el.text!.fontSize}px; color:${el.text!.color}; font-family:${el.text!.fontFamily}; text-align:${el.text!.alignment}; font-weight:${el.text!.bold ? "bold" : "normal"}; font-style:${el.text!.italic ? "italic" : "normal"}; ${rtl ? "direction:rtl; unicode-bidi:embed;" : ""}`;
  return `<div style="${style}">${escapeHtml(text)}</div>`;
}

function renderImageElement(el, baseStyle): string {
  return `<img src="data:${el.image!.mimeType};base64,${el.image!.base64Data}" style="${baseStyle}" />`;
}

function renderQrCodeElement(el, baseStyle): string {
  // QR codes are pre-rendered by generateQrCode and passed as base64
  // In the HTML builder, we output a placeholder that the service fills
  return `<img src="data:image/png;base64,${el.qrCode!.qrBase64 ?? ""}" style="${baseStyle}" alt="QR" />`;
}

function renderShapeElement(el, baseStyle): string {
  const shape = el.shape!;
  const border = shape.borderStyle
    ? `border:${shape.borderStyle} ${shape.borderWidth ?? 1}px ${shape.borderColor ?? "#000000"};`
    : "";
  const bg = shape.backgroundColor ? `background-color:${shape.backgroundColor};` : "";
  const radius = shape.borderRadius ? `border-radius:${shape.borderRadius}px;` : "";
  return `<div style="${baseStyle}; ${border} ${bg} ${radius}"></div>`;
}
```

**Helper functions:**

```typescript
function resolvePlaceholders(content: string, variables: Map<string, string>): string {
  return content.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key: string) => {
    return variables.get(key) ?? "";  // empty string for missing variables
  });
}

function isRtlText(text: string, locale: string): boolean {
  if (locale === "ar") return true;
  // Detect Arabic characters in text
  return /[\u0600-\u06FF]/.test(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}

function buildFontFaceDeclarations(locale: string): string {
  if (locale !== "ar") return "";
  // Embed Arabic fonts as base64 data URIs
  // Read from public/fonts/arabic/ directory
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts", "arabic", "Amiri-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      logger.warn("Arabic font not found at expected path", { fontPath });
      return "";
    }
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");
    return `
      @font-face {
        font-family: 'Amiri';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `;
  } catch (err) {
    logger.warn("Failed to embed Arabic font", { error: String(err) });
    return "";
  }
}
```

### 2.3 `variable-resolver.ts` — `resolveVariables`

**Purpose:** Takes recipient data context (student, course, program, certificate, institution) and resolves template variable placeholders to display strings.

**Pure function** — no namespace, no service layer, no DB access.

**Type definitions:**

```typescript
export interface VariableResolutionContext {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email?: string;
  };
  course?: {
    id: string;
    title: string;
    code?: string;
    durationHours?: number;
  };
  program?: {
    id: string;
    name: string;
  };
  certificate: {
    id: string;
    verificationCode: string;
    issueDate: Date;
    grade?: string;
    score?: number;
  };
  institution: {
    name: string;
    logoUrl?: string;
  };
  locale: string;
}
```

**Key function:**

```typescript
import { formatHijriDate, formatGregorianDate } from "@/shared/lib/date-utils"; // existing Siraj utils

export function resolveVariables(context: VariableResolutionContext): Map<string, string> {
  const variables = new Map<string, string>();

  // Student variables
  variables.set("student.firstName", context.student.firstName);
  variables.set("student.lastName", context.student.lastName);
  variables.set("student.fullName", context.student.fullName ?? `${context.student.firstName} ${context.student.lastName}`);
  variables.set("student.email", context.student.email ?? "");

  // Course variables
  if (context.course) {
    variables.set("course.title", context.course.title);
    variables.set("course.code", context.course.code ?? "");
    variables.set("course.durationHours", String(context.course.durationHours ?? 0));
  }

  // Program variables
  if (context.program) {
    variables.set("program.name", context.program.name);
  }

  // Certificate variables
  variables.set("certificate.verificationCode", context.certificate.verificationCode);
  variables.set(
    "certificate.issueDate",
    context.locale === "ar"
      ? formatHijriDate(context.certificate.issueDate)
      : formatGregorianDate(context.certificate.issueDate),
  );
  variables.set("certificate.grade", context.certificate.grade ?? "");
  variables.set("certificate.score", String(context.certificate.score ?? ""));

  // Institution variables
  variables.set("institution.name", context.institution.name);
  variables.set("institution.logoUrl", context.institution.logoUrl ?? "");

  // Verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://siraj.app";
  variables.set("certificate.verificationUrl", `${baseUrl}/verify/${context.certificate.verificationCode}`);

  return variables;
}

/**
 * Resolve a single dot-path variable key from the context object.
 * Used when only one variable needs resolving (e.g., preview).
 */
export function resolveVariable(
  key: string,
  context: VariableResolutionContext,
): string {
  const all = resolveVariables(context);
  return all.get(key) ?? "";
}
```

### 2.4 `puppeteer-launcher.ts` — `launchPuppeteer`

**Purpose:** Environment-aware Puppeteer launcher that uses `@sparticuz/chromium` on Vercel and the bundled Chromium locally.

```typescript
import puppeteer, { type Browser } from "puppeteer";
import chromium from "@sparticuz/chromium";

/**
 * Launch a Puppeteer browser instance.
 * - On Vercel (VERCEL=1): uses @sparticuz/chromium for the Chromium binary
 * - In local dev: uses Puppeteer's bundled Chromium with headless mode
 *
 * @returns Puppeteer Browser instance (caller must close it in a finally block)
 */
export async function launchPuppeteer(): Promise<Browser> {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL !== undefined;

  if (isVercel) {
    // Vercel serverless: use @sparticuz/chromium
    return puppeteer.launch({
      headless: chromium.headless,
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
    });
  }

  // Local development: use Puppeteer's bundled Chromium
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
```

**Vercel configuration (`vercel.json` update):**

```jsonc
{
  "fluid": true,
  "crons": [ /* existing crons */ ],
  "functions": {
    "app/api/certificates/**/*.ts": {
      "maxDuration": 60,
      "includeFiles": "node_modules/@sparticuz/chromium/**"
    }
  }
}
```

> **Note:** The `includeFiles` pattern ensures the Chromium binary (a ~50MB compressed `br` or `gz` file) is included in the serverless function bundle. The `maxDuration: 60` gives Puppeteer enough time to launch, render, and close within Vercel's max 60s timeout for Pro/Enterprise plans.

### 2.5 `index.ts` — Barrel

```typescript
export * from "./renderer.service";
export * from "./variable-resolver";
// template-html-builder and puppeteer-launcher are internal utilities
// re-exported only if needed by Plan 04's generation service:
export { buildHtmlFromTemplate } from "./template-html-builder";
export { launchPuppeteer } from "./puppeteer-launcher";
```

### 2.6 Cache Invalidation Helpers (updates to Plan 04's `cache-invalidation.ts`)

These are defined in Plan 04 but wired in this plan to invalidate the render cache:

```typescript
// backend/services/certificates/cache-invalidation.ts (updated in this plan)
import { invalidateTag, invalidateTags } from "@/backend/services/cache";

/**
 * Invalidate render cache for a specific template.
 * Call when template is edited or a new version is published.
 */
export async function invalidateCertificateTemplateWrite(templateId: string): Promise<void> {
  try {
    await invalidateTag(`cert:tmpl:${templateId}`);
    logger.info("Invalidated certificate template render cache", { templateId });
  } catch (err) {
    logger.warn("Failed to invalidate certificate template render cache", {
      templateId,
      error: String(err),
    });
  }
}

/**
 * Invalidate render cache for a specific certificate.
 * Call when a certificate is revoked or re-generated.
 */
export async function invalidateCertificateWrite(certificateId: string): Promise<void> {
  try {
    await invalidateTag(`cert:cert:${certificateId}`);
    logger.info("Invalidated certificate render cache", { certificateId });
  } catch (err) {
    logger.warn("Failed to invalidate certificate render cache", {
      certificateId,
      error: String(err),
    });
  }
}
```

### 2.7 Backend Services Barrel Update (`backend/services/index.ts`)

After all files are created, add the certificates barrel:

```typescript
// Add to existing exports in backend/services/index.ts:
export * from "@/backend/services/certificates";
```

---

## 3. Pattern Compliance Summary

### 3.1 Service Namespace Pattern

| Rule | Compliance |
|------|------------|
| Namespace, not class | `export namespace CertificateRendererService` |
| Pure async functions | `renderPdf`, `renderHtml`, `generateQrCode`, `generateThumbnail` are all standalone async/sync functions |
| Types from `@/backend/types` | Import `CertificateTemplateReturnType`, `CertificateRenderResult`, etc. from Plan 02 |
| SSR-safe (no GraphQL context deps) | Accepts `tErrors` and `locale` as explicit parameters, not from `ctx` |
| Localized errors via `getServerTranslations` | All errors use `tErrors.cert.*` namespace keys |

### 3.2 EntityCacheService Caching

| Rule | Compliance |
|------|------------|
| `cachedReadSingleFlight` for expensive operations | Render pipeline is cached with single-flight to coalesce concurrent requests |
| Cache key identity+role scoped | `ec:cert:render:${templateVersionId}:${recipientGroupId}` |
| Fail-open on cache provider errors | `cachedReadSingleFlight` wraps provider errors in try/catch internally |
| Permission checks BEFORE cache lookup | Caller (Plan 04's generation service) gates permissions before calling `renderPdf` |
| Named invalidation helpers | `invalidateCertificateTemplateWrite(templateId)`, `invalidateCertificateWrite(certificateId)` |
| Tag-based invalidation | Tags: `["cert:render", "cert:tmpl:${templateId}"]` |
| Invalidation wrapped in try/catch | Both invalidation helpers wrap `invalidateTag` in try/catch, fail-open |

### 3.3 StorageService Integration

| Rule | Compliance |
|------|------------|
| `linkFileToEntity` for file ownership | `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId, usageType: "certificate_pdf", filePath })` |
| `validatePath` guard | Path validated before write/link operations |
| Reuse existing file-serving route | `GET /api/storage/files/[[...path]]` — no new route needed |
| `createFileAndGet` for DB record | Called after bytes land on storage provider |
| `usageType` convention | `"certificate_pdf"` for primary PDF, `"certificate_thumbnail"` for preview PNG |

### 3.4 Logging

| Rule | Compliance |
|------|------------|
| `import { logger } from "@/backend/lib/logger"` | All log calls use `logger.info`, `logger.warn`, `logger.error` |
| NEVER `console.*` | ESLint enforced; no `console.*` anywhere in new files |

### 3.5 Error Handling

| Style | Usage in this plan |
|-------|-------------------|
| Style 1 — `throw new Error(tErrors.cert.*)` | Permission/validation errors (empty template, empty recipient group, invalid URL) |
| Style 2 — `NotFoundError`/`ForbiddenError` | N/A (template/certificate lookups happen in Plan 04's services) |
| Style 3 — Typed domain error with code | N/A for this plan (reserved for Plan 04's template input validation) |

---

## 4. Dependencies

### 4.1 Dependencies to Add

| Package | Type | Purpose | Justification |
|---------|------|---------|---------------|
| `qrcode` | dependencies | QR code PNG generation | Not currently installed; `bwip-js` is transitive via pdfme but `qrcode` is simpler/simpler API for URL encoding |
| `@sparticuz/chromium` | dependencies | Chromium binary for Vercel serverless Puppeteer | Vercel does not include Chrome; required for serverless PDF rendering |
| `@types/qrcode` | devDependencies | TypeScript types for `qrcode` | Required for type-safe QR code generation |

### 4.2 Already Installed (no changes needed)

| Package | Version | Purpose |
|---------|---------|---------|
| `puppeteer` | 25.4.0 | Headless Chromium → PDF from HTML |
| `sharp` | 0.35.3 (dev) | Image processing (thumbnail generation) |
| `@pdfme/common` | 6.1.12 | pdfme core (template schema types) |
| `@pdfme/schemas` | 6.1.12 | pdfme built-in element schemas |
| `@pdfme/ui` | 6.1.12 | pdfme visual designer (Plan 07) |
| `html-to-image` | 1.11.13 | Not used in this plan (client-side preview uses direct React render) |

### 4.3 Vercel Packaging

The `vercel.json` must be updated to:

1. Include `@sparticuz/chromium` in the serverless function bundle via `functions[].includeFiles`
2. Increase `maxDuration` for certificate API routes to 60 seconds (Puppeteer cold start + render time)
3. The `@sparticuz/chromium` binary ships as a pre-built `.br` (Brotli) or `.gz` (gzip) file (~50MB compressed) that is extracted at runtime

```jsonc
{
  "fluid": true,
  "crons": [
    // existing crons...
  ],
  "functions": {
    "app/api/certificates/**/*.ts": {
      "maxDuration": 60,
      "includeFiles": "node_modules/@sparticuz/chromium/**"
    }
  }
}
```

> **Warning:** The `@sparticuz/chromium` package increases the serverless function bundle size significantly (~50MB compressed). Monitor Vercel's function size limits (250MB for Pro plan). If issues arise, consider using `@vercel/og` (ImageResponse) as an alternative for simpler templates, or moving PDF rendering to a dedicated Vercel function with a longer timeout.

---

## 5. UX/Navigation Specification

### 5.1 Direct UI Routes

**This plan is a backend rendering engine — there are no direct UI routes in this plan.** The rendering service is called by:

- **Plan 04** (`CertificateGenerationService.generateCertificates(...)`) — triggers batch generation by calling `CertificateRendererService.renderPdf(...)` per certificate
- **Plan 08** — certificate download and verification UI provides download links that redirect to the existing storage file-serving route

### 5.2 File Serving

Certificate PDFs are served via the **existing** storage file route:

```
GET /api/storage/files/public/certificates/{certificateId}.pdf
```

No new API route is created in this plan. The certificate download flow (Plan 08) will:

1. Query the certificate record to get the `filePath` linked via `StorageService.linkFileToEntity`
2. Redirect to `/api/storage/files/${filePath}` — identical to the invoice download pattern (`app/api/invoices/[id]/download/route.ts`)

### 5.3 Client-Side Preview

Client-side certificate preview (Plan 07/08) renders template elements as **absolutely-positioned React components** — NO `html-to-image` call and NO server-side Puppeteer call is needed for preview. The preview uses:

```tsx
// Preview approach (Plan 07/08, not this plan):
<div style={{ position: "relative", width: templateWidth, height: templateHeight }}>
  {elements.map(el => (
    <div style={{
      position: "absolute",
      left: el.x, top: el.y,
      width: el.width, height: el.height,
      fontSize: el.text?.fontSize,
      // ... other style props from template schema
    }}>
      {el.type === "text" ? resolvedText : null}
      {el.type === "image" ? <img src={el.image.src} /> : null}
      {el.type === "qrCode" ? <QrCode value={verificationUrl} /> : null}
    </div>
  ))}
</div>
```

This mirrors the CGVS recommendation (lines 1015–1018): "render template elements as absolutely-positioned React components over the background image (no need for html-to-image for preview — just render directly)."

---

## 6. Outcome & Knowledge Transfer Protocol

### 6.1 Knowledge Capture

Each task outcome file must document:

1. **Files created/modified** — exact paths and line counts
2. **Key decisions** — why `qrcode` over `bwip-js`, why `@sparticuz/chromium` over `@vercel/og`, why hybrid pdfme+Puppeteer
3. **Patterns applied** — namespace service, cachedReadSingleFlight, StorageService.linkFileToEntity, tErrors.cert.* localization
4. **Gotchas discovered** — Puppeteer cold start on Vercel, font embedding size limits, sharp PDF processing limitations, cache TTL constraints (≤ CACHE_TAG_INDEX_TTL = 86400s)

### 6.2 Knowledge Propagation

Upon completion of this plan:

1. **Update `backend/services/AGENTS.md`** — add a section on the certificate rendering pipeline, Puppeteer usage patterns, and Vercel serverless Chromium configuration
2. **Update `backend/services/certificates/AGENTS.md`** (if it exists) or create it — document the renderer service namespace, variable resolver pattern, and storage integration for PDF files
3. **Update `docs/services/`** — add `docs/services/certificate-rendering.md` documenting the hybrid rendering architecture, font embedding strategy, and Vercel considerations
4. **Update `vercel.json`** — ensure the Chromium includeFiles pattern is documented and tested
5. **Plan 07 dependency** — Plan 07 (Template Management UI) must read the outcome files to understand the pdfme template schema interface that the rendering engine consumes
6. **Plan 08 dependency** — Plan 08 (Certificate Generation & Verification UI) must read the outcome files to understand the file serving route and download flow

### 6.3 Outcome Files

All outcome files are written to `.ai/draft_plans/cert/plans/06-pdf-rendering-engine/outcome/`:

| File | Content |
|------|---------|
| `01-deps-install-outcome.md` | qrcode + @sparticuz/chromium installation, verification, package.json diff |
| `02-variable-resolver-outcome.md` | Variable resolution context structure, date formatting (Hijri/Gregorian), key resolution strategy |
| `03-template-html-builder-outcome.md` | Element-to-HTML conversion logic, font embedding approach, RTL handling, placeholder syntax |
| `04-qr-code-gen-outcome.md` | qrcode package usage, error correction level, data URI conversion |
| `05-puppeteer-launcher-outcome.md` | Vercel vs local dev detection, @sparticuz/chromium config, launch args, close lifecycle |
| `06-renderer-service-outcome.md` | Full pipeline orchestration, caching integration, storage write/link flow, error boundaries |
| `07-thumbnail-gen-outcome.md` | sharp PDF→PNG processing, resize strategy, link to storage |
| `08-cache-wiring-outcome.md` | cachedReadSingleFlight key/tags/TTL, invalidation helpers, fail-open verification |
| `09-vercel-json-outcome.md` | functions includeFiles, maxDuration, bundle size analysis |
| `10-quality-loop-outcome.md` | tsgo + biome + lint results for all files, any issues fixed |
| `11-knowledge-propagation-outcome.md` | AGENTS.md updates, docs created, references added |
| `00-summary-outcome.md` | Plan-level architecture summary, all files created, dependency state, verification results |

---

## 7. Data Flow Summary

### 7.1 Render Pipeline (Happy Path)

```
CertificateGenerationService.generateCertificates(templateId, recipientGroupId)
  │
  ├─ 1. Load template (Plan 04: CertificateTemplateService.getById)
  ├─ 2. Load recipient group (Plan 04: recipient group service)
  ├─ 3. For each student in recipient group:
  │    └─ CertificateRendererService.renderPdf({ template, recipientGroup, certificateId, locale, tErrors })
  │
  │    ┌─ cachedReadSingleFlight("ec:cert:render:{versionId}:{groupId}")
  │    │   └─ Cache HIT → return { filePath, fileSize, contentHash }
  │    │
  │    │   Cache MISS → doRenderPdf(input):
  │    │     ├─ resolveVariables({ recipientGroup, locale }) → Map<string, string>
  │    │     ├─ renderHtml({ template, variables, locale }) → HTML string
  │    │     ├─ launchPuppeteer() → Browser
  │    │     ├─ page.setContent(html) + page.pdf() → PDF Buffer
  │    │     ├─ StorageService.writeFile("public/certificates/{id}.pdf", pdfBuffer)
  │    │     ├─ StorageService.createFileAndGet(filePath)
  │    │     ├─ StorageService.linkFileToEntity({ referenceTable: "certificates", ... })
  │    │     ├─ crypto.createHash("sha256") → contentHash
  │    │     ├─ generateThumbnail(pdfBuffer, certificateId) → PNG thumbnail + storage link
  │    │     └─ return { filePath, fileSize, contentHash }  ← cached with tags
  │    │
  │    └─ Return result to generation service
  │
  └─ 4. Update certificate record with filePath/contentHash (Plan 04)
```

### 7.2 Invalidation Flow

```
Template updated (Plan 04: CertificateTemplateService.update)
  └─ invalidateCertificateTemplateWrite(templateId)
     └─ invalidateTag("cert:tmpl:{templateId}")
        └─ removes all cache keys indexed under that tag

Certificate revoked (Plan 04: CertificateService.revoke)
  └─ invalidateCertificateWrite(certificateId)
     └─ invalidateTag("cert:cert:{certificateId}")
        └─ removes all cache keys indexed under that tag
```

### 7.3 Download/View Flow (Plan 08)

```
User clicks "Download PDF" in certificate UI
  └─ GET /api/certificates/{id}/download (Plan 08 API route)
     ├─ Verify access permissions
     ├─ StorageService.getFilesForCertificate(certificateId, "certificate_pdf")
     ├─ StorageService.validatePath(filePath)
     └─ NextResponse.redirect(new URL(`/api/storage/files/${filePath}`, request.url))
        └─ Existing storage file route streams the PDF bytes
```

---

## 8. Testing Strategy Outline

> Detailed test implementation is in Plan 10 (Testing & Knowledge Propagation). This section outlines the approach.

### 8.1 Unit Tests (`backend/services/certificates/*.test.ts`)

| Test area | Approach |
|-----------|----------|
| `variable-resolver.ts` | Pure function — test with various `VariableResolutionContext` objects (ar/en locales, missing fields, date formatting) |
| `template-html-builder.ts` | Pure function — test element-to-HTML conversion for each element type, RTL detection, font face injection, placeholder resolution |
| `renderer.service.ts` | Mock Puppeteer (`launchPuppeteer` → returns mocked `Browser`), mock `StorageService`, mock `cachedReadSingleFlight`, verify orchestration flow |
| `puppeteer-launcher.ts` | Test env detection (`VERCEL=1` vs unset), verify config differences |
| `generateQrCode` | Mock `qrcode.toBuffer`, verify URL validation, verify output is a Buffer |
| `generateThumbnail` | Mock `sharp`, verify resize params, verify storage link call |
| Cache invalidation | Mock `invalidateTag`, verify try/catch fail-open behavior |

### 8.2 Service Test Rules (from `backend/services/AGENTS.md`)

- No real network calls (mock Puppeteer, mock storage provider)
- No real Redis/Postgres for cache (mock `cachedReadSingleFlight`)
- Tests colocated in `backend/services/certificates/*.test.ts`
- Run via `bun run test:services`

### 8.3 Integration Tests (`test/integration/`)

- Puppeteer launch + render a simple HTML → verify PDF buffer is non-empty
- `@sparticuz/chromium` extraction in a Vercel-like environment
- These are smoke tests (single run), not in `backend/services/` per AGENTS.md rules

---

## 9. Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| Puppeteer cold start on Vercel (3–10s) | Medium | `cachedReadSingleFlight` coalesces concurrent requests; consider warming function or moving to a dedicated render function |
| `@sparticuz/chromium` bundle size (~50MB) | Medium | Monitor Vercel function size limits; consider `@vercel/og` fallback for simpler templates |
| Arabic font embedding bloats PDF size | Low | Use subset fonts (only needed glyphs); warn if >2MB |
| `sharp` cannot process some PDF variants | Low | Catch and return a blank placeholder thumbnail (non-blocking) |
| Cache stampede on first render | Low | `cachedReadSingleFlight` uses `SETNX` (Redis) or `insertIfNotExists` (Postgres) to coalesce concurrent requests |
| Puppeteer page crashes mid-render | Medium | `try/finally` ensures browser is closed; error logged and rethrown to caller |
| `qrcode` vs `bwip-js` duplication | Low | `qrcode` is a focused, lightweight library; `bwip-js` is pdfme's transitive dep for the editor UI. No real duplication. |
