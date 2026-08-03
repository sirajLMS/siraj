# Siraj PDF & Rendering Dependencies Analysis

> **Target file path:** `/home/ahmed/Projects/siraj-cert/.ai/draft_plans/cert/siraj_analysis/11-pdf-rendering-deps.md`
> **Headline finding:** Siraj declares a **full** PDF/image/rendering toolchain in `package.json`, but **none of these libraries are imported or used anywhere in the Siraj source code** (`app/`, `backend/`, `frontend/`, `shared/`, or `scripts/`). The only exception is **`sharp`**, used in two icon-generation helper scripts. They appear to have been added to `package.json` in anticipation of building a certificate generation feature (mirroring the external **CGVS** reference project being analyzed under `.ai/draft_plans/cert/cgvs_analysis/`).

---

## 1. Declared Rendering Dependencies (package.json + bun.lock)

All are in `/home/ahmed/Projects/siraj-cert/package.json`. Confirmed **installed** versions resolved in `/home/ahmed/Projects/siraj-cert/bun.lock`:

### Production dependencies (`dependencies`)

| Library | Declared | Installed (lock) | Purpose (intended) |
|---|---|---|---|
| `@pdf-lib/fontkit` | `^1.1.1` | `1.1.1` | Custom/Unicode (Arabic) font embedding for pdf-lib |
| `@pdfme/common` | `^6.1.12` | `6.1.12` | pdfme core (template-driven PDF) — pulls `@pdfme/pdf-lib@6.1.5` |
| `@pdfme/schemas` | `^6.1.12` | `6.1.12` | pdfme built-in element schemas (text/image/qr/barcode); transitive `fontkit@2.x`, `bwip-js` |
| `@pdfme/ui` | `^6.1.12` | `6.1.12` | pdfme visual designer/editor UI (antd, dnd-kit, react-moveable, `@pdfme/converter` w/ `@napi-rs/canvas` + `pdfjs-dist`) |
| `pdf-lib` | `^1.17.1` | `1.17.1` | Low-level PDF creation/assembly |
| `puppeteer` | `^25.4.0` | `25.4.0` | Headless Chromium → PDF from HTML (server-side) |
| `html-to-image` | `^1.11.13` | `1.11.13` | Client-side DOM → PNG/JPEG snapshots |
| `opentype.js` | `^2.0.0` | `2.0.0` | OpenType font parsing & glyph shaping; has CLI `ot` |
| `webfontloader` | `^1.6.28` | `1.6.28` | Async web-font loading (Google Fonts / CSS) in browser |
| `@types/webfontloader` | `^1.6.38` | — | Types for webfontloader |

### Dev dependencies (`devDependencies`)

| Library | Declared | Installed (lock) | Purpose |
|---|---|---|---|
| `sharp` | `^0.35.3` | `0.35.3` | Node native image processing (resize/convert) — **the only rendering lib actually used in code** |
| `@types/opentype.js` | `^1.3.9` | — | Types for opentype.js |

Notable build/install config in `package.json`:
- `"ignoreScripts": ["sharp"]` (line 243) — sharp's native postinstall is suppressed.
- `"trustedDependencies": ["sharp"]` (line 246) — explicit trust for sharp's native binary install.

### pdfme transitive stack (from `bun.lock`)

The pdfme family drags in significant additional tooling (relevant if adopted for certificates):

```
@pdfme/common@6.1.12       → @pdfme/pdf-lib@6.1.5, acorn@8.17.0, buffer, zod
@pdfme/schemas@6.1.12      → @pdfme/pdf-lib, fontkit@^2.0.2, bwip-js@^4.11.1,
                             air-datepicker, date-fns, dompurify, lucide, signature_pad
@pdfme/converter@6.1.5     → @napi-rs/canvas@^0.1.100, pdfjs-dist@^5.7.284,
                             remark-gfm, remark-parse, unified   (server-side PDF↔image conversion)
@pdfme/pdf-lib@6.1.5       → @pdf-lib/standard-fonts, @pdf-lib/upng, color, node-html-better-parser, pako
@pdfme/ui@6.1.12           → @dnd-kit/{core,sortable,utilities}, antd@6, react-moveable,
                             react-selecto, hotkeys-js, dompurify, lucide-react   (visual designer)
```

This means **pdfme alone gives you**: a React template designer (`@pdfme/ui`), server-side PDF↔PNG conversion via `@napi-rs/canvas` + `pdfjs-dist` (`@pdfme/converter`), QR/barcode via `bwip-js`, embedded font shaping via `fontkit`, and signature capture via `signature_pad`.

---

## 2. Actual Usage Across the Siraj Codebase

I searched `app/`, `backend/`, `frontend/`, `shared/`, and `scripts/` for each library **by import*:

```
pdf-lib / @pdfme         → NO matches in source
puppeteer                → NO matches in source
html-to-image            → NO matches in source
@pdf-lib/fontkit         → NO matches in source
fontkit (direct)         → NO matches in source
webfontloader / WebFont  → NO matches in source
opentype / opentype.js   → NO matches in source
sharp                    → ONLY scripts/generate-icons.ts and scripts/svg-to-ico.ts
```

Verified via targeted grep over the four source roots — e.g.:

- `grep -rln "from ['\"]pdf-lib['\"]|@pdfme|puppeteer['\"]" .` → No matches.
- `grep -rl "createCanvas|node-canvas|@napi-rs/canvas" app/ backend/ frontend/ shared/ scripts/` → none.
- `grep -rl "qrcode|QRCode|qr_code|generateQR" app/ backend/ frontend/ shared/ scripts/` → none.
- `grep -rl "webfontloader|WebFont" frontend/` → none.
- `grep -rl "opentype" frontend/ backend/ shared/` (excl node_modules) → none.
- `grep -rl "signature_pad|react-signature|SignaturePad" app/ backend/ frontend/ shared/` → none.

**Conclusion:** Every PDF/render library except `sharp` is a **phantom dependency** — declared and installed but with zero imports. They appear staged for the certificate feature.

## 3. The Single Real User: `sharp` (Icon Generation)

### `/home/ahmed/Projects/siraj-cert/scripts/generate-icons.ts`
Wired to `package.json` script `"generate:icons": "bun scripts/generate-icons.ts"`. Reads an SVG (`public/favicon.svg` by default) and produces PNG + ICO assets.

```ts
import sharp from "sharp";
import toIco from "to-ico";

const icoSizes = [16, 32, 48, 256];

// SVG → PNG buffers → ICO
async function convertSvgToIco(svgBuffer, outputDir) {
  const pngBuffers = await Promise.all(
    icoSizes.map(size => sharp(svgBuffer).resize(size, size).png().toBuffer())
  );
  const icoBuffer = await toIco(pngBuffers);
  // ... writes favicon.ico
}

// SVG → multiple PNG sizes (512 → icon.png, 180 → apple-icon.png, …)
async function convertSvgToPng(svgBuffer, outputDir) {
  for (const { size, filename } of pngSizes) {
    const pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    // ... writes PNG
  }
}
```

### `/home/ahmed/Projects/siraj-cert/scripts/svg-to-ico.ts`
Companion one-shot variant (same `sharp` + `to-ico` pattern), used for `app/favicon.ico`.

These are **the only render-pipeline touchpoints** in Siraj today. There is no shared `sharp` utility module, no image-processing service, no thumbnail pipeline.

---

## 4. Invoice PDF "Generation" — There Is None

### `/home/ahmed/Projects/siraj-cert/app/api/invoices/[id]/download/route.ts`

The invoice download route does **not** generate a PDF. It verifies access, looks up an **already-stored** PDF file record, and **redirects** to the generic storage file-serving route:

```ts
import { BillingManagementService, StorageService } from "@/backend/services";

export async function GET(request, { params }) {
  const { id: invoiceId } = await params;
  // ... auth + locale ...
  await BillingManagementService.verifyInvoiceAccess(userId, invoiceId, context, tErrors);

  const files  = await StorageService.getFilesForInvoice(invoiceId, "invoice_pdf", 50);
  const pdfFile = files[0];
  if (!pdfFile?.filePath)
    return NextResponse.json({ error: "No PDF available for this invoice" }, { status: 404 });

  if (!StorageService.validatePath(pdfFile.filePath)) { /* 500 */ }

  return NextResponse.redirect(
    new URL(`/api/storage/files/${pdfFile.filePath}`, request.url)
  );
}
```

Supporting code:
- `backend/db/repo/storage/storage.repository.ts:667` — `getFilesForInvoice(…)` queries the file table by `usageType` (`"invoice_pdf"`).
- `backend/services/storage/storage.service.ts:214` — `getFilesForInvoice` thin service wrapper.
- `backend/services/billing/billing-payment-proof.helpers.ts:44,124` — uses the same repo for *payment-proof* uploads (the only real "billing file" flow), still no PDF bytes produced.

### Where invoice PDFs actually come from: seeding
- `backend/db/seeds/billing/seed-invoices.ts:90-94` — seeds an invoice file whose **PDF bytes already live** at `documents/sample-invoice.pdf` and are copied to `public/invoices/{idempotencyKey}.pdf` with `usageType: "invoice_pdf"`.

```ts
assetRelativePath: "documents/sample-invoice.pdf",
bucketPath:        `public/invoices/${inserted.idempotencyKey}.pdf`,
usageType:         "invoice_pdf",
```

### File serving (no rendering)
`/home/ahmed/Projects/siraj-cert/app/api/storage/files/[[...path]]/route.ts` is a **static file streamer** with byte-range support. It maps extension → MIME via `extToMime` (`shared/utils/storage.utils.ts`), and streams from disk for `public/` / `avatars/` (unauthenticated) or authenticated local storage. It performs **no PDF/image transformation**.

### MIME support (storage utils — `shared/utils/storage.utils.ts`)
```
Allowed upload MIME: image/jpeg, image/png, image/gif, image/webp,
                     application/pdf,
                     application/vnd.openxmlformats-officedocument.wordprocessingml.document
extToMime maps: jpg/png/gif/webp/pdf/docx → MIME
```
PDF is treated purely as a binary blob to store/serve.

---

## 5. Font Handling — None in App Code

- `webfontloader`, `opentype.js`, `@pdf-lib/fontkit`, and pdfme's transitive `fontkit@2.x` are all installed but **unused** in any `frontend/`, `backend/`, or `shared/` source file.
- No glyph shaping, embedded-font loading, or fontkit PDF embedding code exists.
- The only "font presence" is the declaration of `@types/webfontloader` and `@types/opentype.js`.

These are clearly staged for embedding Arabic/Unicode fonts into generated certificate PDFs.

---

## 6. HTML-to-Image & Puppeteer — None in App Code

- `html-to-image@1.11.13` and `puppeteer@25.4.0` are installed but **imported nowhere** in Siraj source.
- No client-side snapshot logic, no `puppeteer.launch()`, no `page.pdf()` calls anywhere.
- Likely intended (mirroring the CGVS plan, below): **Puppeteer** for server-side HTML→PDF certificate rendering on Vercel/Node, **html-to-image** for client-side certificate preview thumbnails.

> ⚠️ Puppeteer on Vercel Serverless requires an external Chromium layer (`@sparticuz/chromium` or `vercel/og`'s bundled Chromium) — bundle-size and cold-start implications to flag during planning.

---

## 7. Template / HTML Rendering — No Engine Present

- No `handlebars`, `ejs`, `mustache` in `package.json` or source.
- The only `handlebars|ejs|mustache` matches were in config files (Bio**me**, tsconfig, lockfiles) and the unrelated chatwoot subproject — not templating engines.
- There is **no HTML-string template builder** (no React `renderToString` for PDF, no JSX-to-HTML pipeline) in Siraj. The closest thing to "rendering HTML" is ordinary Next.js React SSR/RSC serving web pages.

For certificates, a template-to-HTML step (template literal strings, JSX → `renderToString`, or `@pdfme/ui`'s template schema) will need to be **built from scratch**.

---

## 8. QR Code Generation — None

- Nothing named `qrcode`/`QRCode`/`qr_code`/`generateQR` exists in Siraj source or deps.
- The only `qr_code` references are in the **CGVS analysis drafts** (`.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md`, `02-database-schema.md`) describing CGVS's intended `template_qr_code_element` (element type `qr_code`, likely encoding a verification code/URL).
- PDFme's transitive `bwip-js@^4.11.1` (via `@pdfme/schemas`) can render QR/barcodes if the pdfme path is adopted; otherwise a dedicated `qrcode` lib must be added.

---

## 9. Canvas — No Direct Usage

- No `node-canvas`, no `@napi-rs/canvas` imported anywhere in Siraj source.
- `@napi-rs/canvas@^0.1.100` is pulled in **indirectly** by `@pdfme/converter` (server-side PDF↔image conversion) — available only if pdfme generation is wired up.
- No HTML5 `<canvas>`/`getContext("2d")` drawing code in the frontend beyond chart libs (`recharts`, `@xyflow/react`, `react-zoom-pan-pinch`) used for unrelated UI.

---

## 10. PDF Utilities — None

There is **no** `lib/pdf`, `services/pdf`, `utils/pdf`, or shared certificate/PDF helper module in Siraj. No file in `backend/lib/`, `backend/services/`, or `shared/utils/` exports PDF creation, merging, signing, or templating helpers. The PDF pipeline must be designed and scaffolded entirely new.

---

## 11. Context: The CGVS Reference Project & Existing Analysis Drafts

The directory `.ai/draft_plans/cert/cgvs_analysis/` contains draft analyses of an **external** reference project (CGVS) located at `/home/ahmed/Projects/cgvs/`. This is the project Siraj's certificate feature is being modeled on.

### CGVS deps (its `package.json`)
```
"html-to-image": "^1.11.13",
"puppeteer":     "^24.26.0",
"@google-cloud/storage": "^7.15.0"
```
Note CGVS uses **puppeteer 24.x**, Siraj upgraded to **25.4.0**. CGVS does NOT have pdf-lib/@pdfme/fontkit/opentype/webfontloader — those were **added to Siraj** beyond the CGVS baseline (suggests Siraj intends a richer font/PDF path than CGVS planned).

### What the drafts document (key excerpts from `01-generation-logic.md`)
- **Line 5** — "the actual generation/rendering pipeline has NOT been implemented yet… no rendering code (despite `puppeteer` and `html-to-image` being listed as dependencies) has been written."
- **Lines 73–75** — "`puppeteer` only used in `tests/browser-md5.ts` for file hashing, not PDF generation"; "`html-to-image` is in `package.json` but never imported in any source file."
- **Lines 651–663** — Planned (unbuilt) pipeline:
  - Build per-certificate HTML absolutely-positioning each template element (`position:absolute; left:{x}px; top:{y}px`), text with `fontSize/color/fontFamily/alignment`, images as `<img>`, QR codes as QR images.
  - **PDF**: `puppeteer.launch({headless:true})` → `page.setContent(html)` → `page.pdf()`.
  - **Image preview (client)**: `import { toPng, toJpeg } from 'html-to-image'`.
- **Lines 815–816** — Output formats planned: **PDF** (primary, via Puppeteer), **PNG/JPEG** (preview/preview/thumbnail, via html-to-image).
- **Lines 1015–1018** — Recommended pipeline:
  1. Puppeteer for **server-side** PDF: `HTML from template + elements + variable values → PDF`.
  2. **Client-side preview**: render elements as absolutely-positioned React over the background image (no html-to-image needed for preview — direct render).
  3. Visual editor via canvas/drag-and-drop (CGVS has `@xyflow/react` + `react-zoom-pan-pinch` but never built it — Siraj also has both installed, presumably for the same future editor).

### CGVS verification: I confirmed
- `puppeteer`/`html-to-image` have zero source imports in CGVS either (`grep -rln` over `app/components/lib`).
- CGVS `tests/browser-md5.ts` is the lone puppeteer touch — MD5 hashing for GCS signed URLs, **not** PDF.

### Implication for Siraj certificate feature
Siraj has gone **further than CGVS in dependency staging** (sans-CGVS additions: `pdf-lib`, `@pdf-lib/fontkit`, `@pdfme/{common,schemas,ui}`, `opentype.js`, `webfontloader`) while remaining **equal to CGVS in implementation: zero rendering code**. Siraj has not yet decided between two possible pipelines the dep set enables:

| Pipeline | Libs available | Pros | Cons |
|---|---|---|---|
| **A. HTML → Puppeteer PDF** | `puppeteer@25.4` | HTML/CSS layout freedom, easy Arabic via @font-face/web fonts, matches CGVS plan | Heavy Chromium on Vercel (needs external layer), cold-start cost |
| **B. Template-driven via pdfme** | `@pdfme/{common,schemas,ui}` + `fontkit` + `bwip-js` | Visual designer UI included, server-side render via `@pdfme/converter` (`@napi-rs/canvas`), native barcode/QR, no browser needed | pdfme font/RTL/Arabic shaping can be finicky; takes over layout model |
| **C. Low-level pdf-lib** | `pdf-lib@1.17.1` + `@pdf-lib/fontkit@1.1.1` + `opentype.js` | Full control, small footprint, serverless-friendly | Must manually place text/images, handle bidi Arabic shaping, draw QRs yourself |

All three are *available but unwired*. The plan stage must pick one (or hybrid, e.g. **pdfme UI editor** to author templates + **Puppeteer** to render final high-fidelity PDFs).

---

## 12. Summary Table — Status at a Glance

| Capability | Lib installed (v) | Used in Siraj source? | Where / Notes |
|---|---|---|---|
| Low-level PDF | `pdf-lib@1.17.1` | ❌ No | — |
| Custom font embedding | `@pdf-lib/fontkit@1.1.1` | ❌ No | — |
| Template PDF (designer+render) | `@pdfme/common,schemas,ui@6.1.12` | ❌ No | Drags in `@pdfme/converter` (`@napi-rs/canvas`, `pdfjs-dist`), `fontkit@2`, `bwip-js`, `signature_pad` |
| HTML → PDF (server) | `puppeteer@25.4.0` | ❌ No | Needs Chromium layer for Vercel |
| DOM → image (client) | `html-to-image@1.11.13` | ❌ No | Intended for previews |
| Font parsing | `opentype.js@2.0.0` | ❌ No | Has CLI `ot` |
| Web font loading | `webfontloader@1.6.28` | ❌ No | — |
| Image processing | `sharp@0.35.3` | ✅ Yes | `scripts/generate-icons.ts`, `scripts/svg-to-ico.ts` (SVG→PNG/ICO) |
| QR code | — | ❌ No | Only via pdfme's transitive `bwip-js`; no dedicated dep |
| Templates (HBS/EJS/…) | — | ❌ No | No template engine; no `renderToString` PDF path |
| Canvas (node) | — (indirect via pdfme) | ❌ No | `@napi-rs/canvas` only if pdfme wired |
| Signature capture | `signature_pad` (via pdfme) | ❌ No | — |
| Invoice PDF generation | — | ❌ No | `app/api/invoices/[id]/download/route.ts` only redirects to a **seeded/stored** file |
| PDF utility modules | — | ❌ No | No `lib/pdf`, `services/pdf`, `utils/pdf` exist |

---

## 13. Recommendations for the Certificate Feature Plan

1. **Pick a render pipeline first** (Puppeteer-HTML vs pdfme vs pdf-lib) — the dep set supports all three, but each dictates the template model, font-handling, and Vercel packaging strategy.
2. **Arabic/RTL font handling** is the highest technical risk: confirm whether `@pdf-lib/fontkit` (pdf-lib path), `fontkit@2` (pdfme path), or `@font-face` in Puppeteer's Chromium handles the target Arabic typefaces. `opentype.js` + `webfontloader` suggest exploration-of-glyphs was anticipated.
3. **Vercel packaging**: `puppeteer` will need `@sparticuz/chromium` or `vercel/og`; `sharp` is already trusted-configured; `@napi-rs/canvas` (from pdfme) is serverless-safe.
4. **Establish a PDF utility module** (`backend/services/pdf` or `backend/lib/pdf`) — none exists today. Mirror existing patterns (e.g. `StorageService.getFilesForInvoice`) for persisting generated certificate artifacts under a new `usageType` like `"certificate_pdf"`, reusing the existing file-serving route (`app/api/storage/files/[[...path]]`) and `extToMime` MIME map.
5. **Reuse** the existing storage file pipeline (seed/upload/serve pattern from invoices) — no need to invent a new document-delivery route.
6. **QR code** for verification: add a dedicated `qrcode` dependency, or adopt pdfme's `bwip-js` if going the pdfme route. Decision informs the `template_qr_code_element` design borrowed from CGVS.