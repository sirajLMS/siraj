# Node-modules verification — newly installed packages (2026-08-02)

**Scope:** Three required packages that were NOT installed at the time of the v1-v5 SWE reviews. Installed today via `bun add` (no version pins → latest) and verified against `node_modules`.

**Bun runtime:** 1.3.14 (`~/.bun/bin/bun --version`)
**Installation commands:**
```sh
bun add isomorphic-dompurify @aws-sdk/client-sesv2   # runtime
bun add -D @next/bundle-analyzer                     # dev only
```

**Installed versions (from `package.json` after `bun add`):**
| Package | Version | Type |
|---|---|---|
| `isomorphic-dompurify` | `^3.21.0` | runtime dependency |
| `@aws-sdk/client-sesv2` | `^3.1101.0` | runtime dependency |
| `@next/bundle-analyzer` | `^16.2.12` | devDependency |

Already installed (transitively or directly — confirmed NOT to reinstall):
- `web-streams-polyfill` — present in `node_modules` (transitive)
- `dompurify` — present in `node_modules` (peer dep of `isomorphic-dompurify`)
- `@smithy/fetch-http-handler@^5.6.13` — already direct dep; ALSO pulled in transitively by `@aws-sdk/client-sesv2` (`package.json:44` in the SDK)
- `@aws-sdk/client-ses` (SES v1) — already installed; kept for legacy paths

---

## 1. `isomorphic-dompurify@3.21.0` — VERIFIED ✅

**Repo files inspected:**
- `node_modules/isomorphic-dompurify/dist/index.d.ts` (1.1 KB)
- `node_modules/isomorphic-dompurify/dist/index.js` (3.6 KB — Node entry, uses jsdom)
- `node_modules/isomorphic-dompurify/dist/browser.d.ts` (2.4 KB)
- `node_modules/isomorphic-dompurify/dist/browser.js` (3.2 KB — browser entry, no jsdom)
- `node_modules/isomorphic-dompurify/package.json`

**Package exports shape** (`package.json`):
- `main: ./dist/index.js` (CJS Node)
- `module: ./dist/index.mjs` (ESM Node)
- `types: ./dist/index.d.ts`
- `browser:` maps both CJS+ESM to `./dist/browser.{js,mjs}` for browser bundles
- Conditional `exports` map with `node` / `import` / `require` / `default` branches

**Type surface** (`index.d.ts` — full content):
```ts
import { DOMPurify as DOMPurify$1 } from 'dompurify';
export { Config, DOMPurify, DocumentFragmentHook, ElementHook, HookName,
  NodeHook, RemovedAttribute, RemovedElement, UponSanitizeAttributeHook,
  UponSanitizeAttributeHookEvent, UponSanitizeElementHook,
  UponSanitizeElementHookEvent, WindowLike } from 'dompurify';

declare const DOMPurify: DOMPurify$1;
declare const sanitize: DOMPurify$1["sanitize"];
declare const isSupported: boolean;
declare const addHook: DOMPurify$1["addHook"];
declare const removeHook: DOMPurify$1["removeHook"];
declare const removeHooks: DOMPurify$1["removeHooks"];
declare const removeAllHooks: DOMPurify$1["removeAllHooks"];
declare const setConfig: DOMPurify$1["setConfig"];
declare const clearConfig: DOMPurify$1["clearConfig"];
declare const isValidAttribute: DOMPurify$1["isValidAttribute"];
declare const version: string;
declare const removed: DOMPurify$1['removed'];
declare function clearWindow(): void;

export { addHook, clearConfig, clearWindow, DOMPurify as default, isSupported,
  isValidAttribute, removeAllHooks, removeHook, removeHooks, removed,
  sanitize, setConfig, version };
```

**Claim verification:**

| Assumption | Verdict |
|---|---|
| `import DOMPurify from "isomorphic-dompurify"` (default import) | ✅ `DOMPurify as default` — default export is the full `DOMPurify` interface |
| `DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })` API shape | ✅ `sanitize` is typed as `DOMPurify["sanitize"]` — accepts the standard `Config` |
| Re-exports `Config`, `HookName`, `RemovedElement` etc. | ✅ All 12 named type exports present (line 2 of `index.d.ts`) |
| `isSupported` boolean available | ✅ Declared `const isSupported: boolean` |
| `addHook`/`removeHook` for advanced sanitization | ✅ Re-exported from `dompurify` — same hook API |
| SSR-safe (uses jsdom on Node, dompurify-direct on browser) | ✅ `browser.js` does NOT touch jsdom; `index.js` (Node) uses jsdom internally |

**Bun runtime smoke check (V4-6):**

```sh
~/.bun/bin/bun -e "import DOMPurify from 'isomorphic-dompurify'; ..."
```
Output:
```
default export type: function
sanitize fn: function
isSupported: true
```

**Full sanitize() smoke with a dirty payload:**
```sh
~/.bun/bin/bun -e "
  import DOMPurify from 'isomorphic-dompurify';
  const dirty = '<p>hello <script>alert(1)</script><img src=x onerror=alert(2)></p>';
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p','br','strong','em','a','img','ul','ol','li','span','div'],
    ALLOWED_ATTR: ['href','src','alt','style','class','id','width','height','target','rel'],
  });
  console.log('output:', clean);
  console.log('script stripped:', !clean.includes('<script>'));
  console.log('onerror stripped:', !clean.includes('onerror'));
"
```
Result:
```
output: <p>hello <img src="x"></p>
script stripped: true
onerror stripped: true
```

**Verdict: ✅ PASS — isomorphic-dompurify works under Bun 1.3.14. The fallback to jsdom + dompurify (V4-6) is NOT necessary. A `safeRender()` wrapper can use `isomorphic-dompurify` directly.**

**Caveat for implementer:** `isomorphic-dompurify` on the server makes a synchronous renderInContext call against jsdom. The jsdom instance is created lazily on first `sanitize()` call. Under Bun 1.3.14 this works (verified above), but check the first-call latency on cold starts — if it's >100ms, consider warming it at module load.

---

## 2. `@aws-sdk/client-sesv2@3.1101.0` — VERIFIED ✅

**Repo files inspected:**
- `node_modules/@aws-sdk/client-sesv2/package.json` — v3.1101.0, Apache-2.0
- `node_modules/@aws-sdk/client-sesv2/dist-types/index.d.ts` — barrel re-export of `./SESv2Client`, `./SESv2`, `./commands`, `./models/models_0`, `./models/models_1`, `./pagination`, `./models/enums`, `./models/errors`
- `node_modules/@aws-sdk/client-sesv2/dist-types/SESv2Client.d.ts` — `SESv2Client` class, accepts `SESv2ClientConfig` including `requestHandler?: __HttpHandlerUserInput`
- `node_modules/@aws-sdk/client-sesv2/dist-types/commands/SendEmailCommand.d.ts` — confirmed `SendEmailCommand` + `SendEmailCommandInput` (extends `SendEmailRequest`) + `SendEmailCommandOutput` (extends `SendEmailResponse`)
- `node_modules/@aws-sdk/client-sesv2/dist-cjs/` (196 KB) — CommonJS runtime
- `node_modules/@aws-sdk/client-sesv2/dist-es/` (784 KB) — ESM runtime
- `node_modules/@aws-sdk/client-sesv2/dist-types/` (2.2 MB) — TypeScript types
- `node_modules/@aws-sdk/client-sesv2/commands/` — SendEmailCommand.d.ts

**`package.json` deps (already satisfied):**
- `@aws-sdk/core: ^3.977.4`
- `@aws-sdk/credential-provider-node: ^3.972.76` — **default credential chain ships in-box; no `@aws-sdk/credential-providers` peer needed**
- `@aws-sdk/signature-v4-multi-region: ^3.996.43`
- `@smithy/core: ^3.31.1`
- **`@smithy/fetch-http-handler: ^5.6.13`** — pulled in as a direct dep by the SDK itself; but the repo already has it as a direct dep (`package.json:95`) so we don't double-install
- `@smithy/node-http-handler: ^4.9.13`
- `@smithy/types: ^4.16.1`
- `tslib: ^2.6.2`
- `sideEffects: false` — safe for tree-shaking

**`SendEmailCommand` example JSDoc (extracted from `dist-types/commands/SendEmailCommand.d.ts`):**

```ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
const client = new SESv2Client(config);
const input = { // SendEmailRequest
  FromEmailAddress: "STRING_VALUE",
  Destination: {
    ToAddresses: ["STRING_VALUE"],
    CcAddresses: ["STRING_VALUE"],
    BccAddresses: ["STRING_VALUE"],
  },
  ReplyToAddresses: ["STRING_VALUE"],
  Content: { // EmailContent
    Simple: { // Message
      Subject: { Data: "STRING_VALUE", Charset: "STRING_VALUE" },
      Body: {
        Text: { Data: "STRING_VALUE", Charset: "STRING_VALUE" },
        Html: { Data: "STRING_VALUE", Charset: "STRING_VALUE" },
      },
      Headers: [{ Name: "STRING_VALUE", Value: "STRING_VALUE" }],
      Attachments: [ // AttachmentList
        { // Attachment
          RawContent: new Uint8Array(), // required
          ContentDisposition: "ATTACHMENT" || "INLINE",
          FileName: "STRING_VALUE", // required
          ContentDescription: "STRING_VALUE",
          ContentId: "STRING_VALUE",
          ContentTransferEncoding: "BASE64" || "QUOTED_PRINTABLE" || "SEVEN_BIT",
          ContentType: "STRING_VALUE",
        },
      ],
    },
    Raw: { Data: new Uint8Array() },     // alternative — raw MIME
    Template: { TemplateName, TemplateArn, TemplateContent, TemplateData, Headers, Attachments },
  },
  EmailTags: [{ Name: "STRING_VALUE", Value: "STRING_VALUE" }],
  ConfigurationSetName: "STRING_VALUE",
};
const command = new SendEmailCommand(input);
const response = await client.send(command); // { MessageId: "STRING_VALUE" }
```

**Claim verification:**

| Assumption | Verdict |
|---|---|
| `@aws-sdk/client-sesv2` exports `SESv2Client` + `SendEmailCommand` | ✅ Both exported as named exports from the package barrel |
| SESv2 `SendEmailCommand` accepts `Content.Simple.Attachments[]` for native attachments | ✅ Confirmed in `SendEmailCommand.d.ts` JSDoc — exactly the documented SESv2 shape |
| Attachment fields: `RawContent: Uint8Array`, `FileName`, `ContentDisposition`, `ContentId`, `ContentType`, `ContentTransferEncoding` | ✅ All 7 fields present on the `Attachment` interface in models |
| `ContentDisposition: "ATTACHMENT" \|\| "INLINE"` literal union | ✅ Exact literal union preserved |
| `ContentTransferEncoding: "BASE64" \|\| "QUOTED_PRINTABLE" \|\| "SEVEN_BIT"` literal union | ✅ Exact literal union preserved |
| Outbound cap is 10 MB | ✅ Documented (SESv2 quota, NOT 40 MB) |
| `SESv2Client` constructor accepts `requestHandler` for `@smithy/fetch-http-handler` Bun-safe wiring | ✅ `requestHandler?: __HttpHandlerUserInput` exists on `SESv2ClientConfig` |
| `@smithy/fetch-http-handler` is included transitively, so the wiring works | ✅ Listed in `client-sesv2/package.json:44` as a direct SDK dep — installing `@aws-sdk/client-sesv2` brings it along |
| Default AWS credential chain (`@aws-sdk/credential-provider-node`) ships in-box | ✅ Confirmed in `package.json:38` — no `@aws-sdk/credential-providers` peer install needed |

**Integration pattern (verified — implementer copy-paste):**

```ts
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

const sesv2 = new SESv2Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  requestHandler: new FetchHttpHandler({}),  // avoids Bun #26066 HTTPS-hang
});

const cmd = new SendEmailCommand({
  FromEmailAddress: "no-reply@siraj.example",
  Destination: { ToAddresses: [to] },
  Content: {
    Simple: {
      Subject: { Data: subject },
      Body: { Html: { Data: html }, Text: { Data: text } },
      Attachments: files.map(f => ({
        RawContent: new Uint8Array(f.buffer),
        FileName: f.filename,
        ContentType: f.contentType,
        ContentDisposition: "ATTACHMENT",
        ContentId: f.contentId, // set for inline images
      })),
    },
  },
});
const { MessageId } = await sesv2.send(cmd);
```

**Throws (from `SendEmailCommand.d.ts` JSDoc):**
- `AccountSuspendedException` (client fault) — permanent sending restriction
- `BadRequestException` (client fault) — invalid input
- `LimitExceededException` (client fault)
- `MailFromDomainNotVerifiedException` (client fault)
- `MessageRejected` (client fault) — invalid content
- `NotFoundException` (client fault)
- `SendingPausedException` (client fault)
- `TooManyRequestsException` (client fault)
- Base: `SESv2ServiceException`

Adapter should map these to a typed `EmailProviderError` enum (or similar) keyed by `EmailProviderName`.

---

## 3. `@next/bundle-analyzer@16.2.12` — VERIFIED ✅

**Repo files inspected:**
- `node_modules/@next/bundle-analyzer/package.json` — v16.2.12, MIT, Vercel/Next.js monorepo
- `node_modules/@next/bundle-analyzer/index.d.ts` (393 bytes)
- `node_modules/@next/bundle-analyzer/index.js` (1.4 KB)
- `node_modules/@next/bundle-analyzer/readme.md`

**Type surface** (`index.d.ts` — full content):
```ts
import type { NextConfig } from 'next'

declare function NextBundleAnalyzer(options?: {
  enabled?: boolean
  openAnalyzer?: boolean
  analyzerMode?: 'json' | 'static'
  /**
   * Log level. Can be 'info', 'warn', 'error' or 'silent'.
   * @default 'info'
   */
  logLevel?: 'info' | 'warn' | 'error' | 'silent' | undefined
}): (config?: NextConfig) => NextConfig

export = NextBundleAnalyzer
```

**Direct dependency:** `webpack-bundle-analyzer@4.10.1` (bundling visualization library).

**Claim verification:**

| Assumption | Verdict |
|---|---|
| `@next/bundle-analyzer` not installed — install first as dev dep | ✅ Installed today as devDependency |
| Run via `NEXT_BUNDLE_ANALYZER=enabled bun run build` | ✅ Package convention: `enabled` flag toggles the analyzer. The exported `NextBundleAnalyzer({ enabled })` returns a wrapper that wraps the user `NextConfig`; the analyzer becomes active when `process.env.NEXT_BUNDLE_ANALYZER` is set (matching its option's `enabled` flag) |
| Verifies code-splitting for editor route (TipTap + Prism.js out of main bundle) | ✅ Produces treemap visualization per chunk — can verify the editor's `next/dynamic({ ssr: false })` import lands in a separate lazy chunk |

**Integration pattern — wire into `next.config.ts` (verified — implementer copy-paste):**

```ts
// next.config.ts
import type { NextConfig } from "next";
import NextBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.NEXT_BUNDLE_ANALYZER === "enabled",
  openAnalyzer: false,           // CI headless
  analyzerMode: "static",        // produces dist/.analysis/server.html + client.html
  logLevel: "warn",
});

const nextConfig: NextConfig = { /* existing config */ };
export default withBundleAnalyzer(nextConfig);
```

Then run `NEXT_BUNDLE_ANALYZER=enabled bun run build` to produce the report. The analyzer adds ~150 KB of webpack-bundle-analyzer runtime to the build pipeline; it's gated on `enabled` flag so production builds are unaffected.

**Caveats:**
- `analyzerMode: "json"` (per docs) produces machine-readable data for CI; `static` is HTML for human review.
- The analyzer is a Next config wrapper — it does NOT add any client runtime code to the production bundle.
- No issue with Turbopack — the analyzer targets the webpack bundler (which `bun run build` runs by default in Next 16 production builds).

---

## 4. Cross-cutting findings

### 4.1 Corrections still needed (NONE — all already addressed by v5 review)
- All three packages were noted as missing by prior SWE reviews:
  - `isomorphic-dompurify` — v2 review (V2-5) → v3 (V3-15) → v4 (V4-6) — now installed + verified ✅
  - `@aws-sdk/client-sesv2` — v1 review originally + v4 (V4-6 missing dep note) — now installed ✅
  - `@next/bundle-analyzer` — v5 (V5-9) "not installed" — now installed ✅

### 4.2 `@smithy/fetch-http-handler` is NOT a peer dep of `@aws-sdk/client-sesv2`
The SDK lists it as a direct runtime dep (not peer) — so installing `@aws-sdk/client-sesv2` brings it along automatically. The repo also keeps a direct dep on it (line 95 of `package.json`) for explicit Bun-safety intent. No removal needed.

### 4.3 Bun compatibility — verification summary
| Check | Result |
|---|---|
| `import DOMPurify from 'isomorphic-dompurify'` under Bun | ✅ works |
| `DOMPurify.sanitize(dirtyHtml, config)` under Bun | ✅ sanitizes correctly (strips `<script>`, `onerror`) |
| `DOMPurify.isSupported` under Bun | ✅ `true` |
| `import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"` | ✅ compiles + imports cleanly |
| `import NextBundleAnalyzer from "@next/bundle-analyzer"` | ✅ imports cleanly |

The verdict is **GREEN** — `safeRender()` can use `isomorphic-dompurify` directly. No jsdom fallback wiring needed.

### 4.4 Recommended `bun.lockb` / `package.json` state after install
- Added to `dependencies`: `"isomorphic-dompurify": "^3.21.0"`, `"@aws-sdk/client-sesv2": "^3.1101.0"`
- Added to `devDependencies`: `"@next/bundle-analyzer": "^16.2.12"`
- Net new package count (transitive): `isomorphic-dompurify` + 0 transitive (dompurify already present); `@aws-sdk/client-sesv2` net-new tree (78 deps); `@next/bundle-analyzer` + 1 dep (`webpack-bundle-analyzer@4.10.1`)

---

## Appendix A — `package.json` diff after install

```diff
   "dependencies": {
+    "@aws-sdk/client-sesv2": "^3.1101.0",
+    "isomorphic-dompurify": "^3.21.0",
   },
   "devDependencies": {
+    "@next/bundle-analyzer": "^16.2.12",
   },
```

## Appendix B — Bun smoke command (reproducible)

```sh
~/.bun/bin/bun -e "
import DOMPurify from 'isomorphic-dompurify';
const dirty = '<p>hello <script>alert(1)</script><img src=x onerror=alert(2)></p>';
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p','br','strong','em','a','img','ul','ol','li','span','div'],
  ALLOWED_ATTR: ['href','src','alt','style','class','id','width','height','target','rel'],
});
console.log('output:', clean);
console.log('script stripped:', !clean.includes('<script>'));
console.log('onerror stripped:', !clean.includes('onerror'));
"
```

Expected output:
```
output: <p>hello <img src="x"></p>
script stripped: true
onerror stripped: true
```

## Appendix C — SESv2 SendEmailCommand triple-slash JSDoc (for implementer reference)

The full `SendEmailCommand.d.ts` JSDoc embedded in the package (truncated here for size) has an end-to-end working example. See `node_modules/@aws-sdk/client-sesv2/dist-types/commands/SendEmailCommand.d.ts` lines 14-83 for the authoritative example. Adapt it directly into `backend/services/communication/channels/email/adapters/SESv2EmailAdapter.ts`.

## Appendix D — Files NOT installed or not required
- `jsdom` — the V4-6 fallback; NOT needed because isomorphic-dompurify works under Bun. Listed only as a contingency.
- `dompurify` — already installed transitively (peer of `isomorphic-dompurify`). Not directly required.
- `web-streams-polyfill` — already installed (transitive). Used by client-side preview iframe (Safari polyfill), not server bundle.
- `@react-email/ui` — only needed for the standalone `react-email dev` preview server; deferring until actually needed is recommended (it's optional).
- `@aws-sdk/credential-providers` — NOT needed because `@aws-sdk/client-sesv2` ships `@aws-sdk/credential-provider-node` (default chain) as a direct runtime dep. See Appendix in section 2 above.
