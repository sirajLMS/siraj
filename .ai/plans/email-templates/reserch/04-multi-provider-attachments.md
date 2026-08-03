# Multi-Provider Email Attachments & Inline Images — Verification Report

## Verdict: PARTIALLY VERIFIED / NEEDS UPDATE

The plan at `/home/ahmed/.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md` proposes a multi-provider email registry with five adapters (Resend, AWS SES, Postmark, Mailgun, Nodemailer SMTP) and a unified `EmailAttachment` type. The package names and the general shape of each provider's attachment API are correct, but **several per-provider specifics are wrong or stale**:

1. **AWS SES** — The plan says `SendEmailCommand` with `Attachments`/`RawMessage`. The reality is split: SES v2's `SendEmailCommand` (`Content.Simple.Attachments[]`) supports attachments and inline images directly with a `ContentId` field — **but** the maximum message size for the v2 `Simple` path is **40 MB**, while the legacy `SendRawEmailCommand` (v1 API) is capped at **10 MB** and requires full raw-MIME construction. The plan conflates the two paths.
2. **Mailgun** — The plan correctly identifies `mailgun.js` (not the deprecated `mailgun-js`) and the `inline` field. But the inline field is a **separate top-level message property** (not a `Content-ID` header the caller sets); the SDK sets the header from the attachment `filename`, and you reference it in HTML as `cid:<filename>`.
3. **Postmark** — Correctly identified. Attachment content is **base64-string only** (no Buffer support over the JSON API). `ContentID` must include the literal `cid:` prefix (e.g. `"cid:image.jpg"`).
4. **Nodemailer** — Correctly identified. `attachments[]` supports `content` (string / Buffer / stream), `path`, and `cid`. Types ship via `@types/nodemailer` (DefinitelyTyped), not in-package.
5. **Resend** — Already confirmed by a prior sub-agent. SDK ships in-package types; `attachments[].content` accepts `Buffer | string` (base64). Inline images use `attachments[].contentId` and reference `cid:<contentId>` in HTML.

> The plan's claim that each adapter will mirror `ResendEmailAdapter` at ~80 LOC is **optimistic**: SES (raw-MIME path), Nodemailer (streaming + transporter setup), and Mailgun (FormData construction) each carry provider-specific setup that exceeds 80 LOC once attachments + inline images + delivery-row bookkeeping are included.

---

## The Original Claim (verbatim)

```ts
export interface EmailAttachment {
  readonly filename: string;
  readonly content: Buffer | string;
  readonly contentType?: string;
  readonly contentId?: string; // inline image: `cid:contentId`
}
```

The five proposed adapters:
- Resend: `resend` SDK `resend.emails.send({ attachments, ... })` — confirmed
- AWS SES: `@aws-sdk/client-ses` (`SendEmailCommand` with `Attachments`/`RawMessage`)
- Postmark: `postmark` npm package — attachment shape
- Mailgun: `mailgun.js` (not the deprecated `mailgun-js`) — attachment + inline image (`inline` field)
- Nodemailer SMTP: `nodemailer` — `attachments[]` with `cid`, `content` Buffer/path

---

## Primary Sources Consulted

| URL | What it confirmed |
|---|---|
| https://resend.com/docs/api-reference/emails/send-email | Resend `attachments` field: `content` (Buffer or Base64 string), `filename`, `path`, `contentType`, `contentId`. Max 40 MB/email after Base64 encoding. |
| https://resend.com/docs/send-with-nodejs | Resend Node.js SDK usage; `attachments` typed as `Attachment[]`; example with `content: invoiceBuffer`. |
| https://docs.aws.amazon.com/ses/latest/dg/attachments.html | SES v2 attachments doc; `Simple.Attachments[]` with `RawContent`, `ContentDisposition: INLINE`, `FileName`, `ContentId`, `ContentTransferEncoding: BASE64`. 40 MB limit for v2 send. |
| https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sesv2/command/SendEmailCommand/ | `Sesv2.SendEmailCommand` shape: `Content.Simple.Attachments[]` with `RawContent: Uint8Array` (Buffer), `ContentId`, `ContentDisposition`, `ContentTransferEncoding`. |
| https://docs.aws.amazon.com/ses/latest/APIReference/API_SendRawEmail.html | `SendRawEmail` (v1): 10 MB max; raw MIME message; entire message must be base64-encoded. |
| https://www.npmjs.com/package/@aws-sdk/client-ses | Package published as `@aws-sdk/client-ses` (v3 line); SES v2 commands live under the `sesv2` export. |
| https://postmarkapp.com/developer/api/email-api | Postmark `/email` body: `Attachments[]` with `Name`, `Content` (**base64-string**), `ContentType`, and `ContentID` (with literal `cid:` prefix, e.g. `"cid:image.jpg"`). Batch payload max 50 MB including attachments; up to 500 messages per batch. |
| https://www.npmjs.com/package/postmark | `postmark` v5.1.0, MIT, ActiveCampaign-maintained. Native Fetch (no axios dep). Node ≥ 18. |
| https://github.com/mailgun/mailgun.js/tree/v12.7.0 | `mailgun.js` v12.7.0 (also v13.3.0 published 2026-07). Message params: `attachment` and `inline` are **separate top-level fields**; inline files must be referenced in HTML as `cid:<filename>`. `{ data, filename }` object form. |
| https://github.com/mailgun/mailgun.js#readme | Same — `inline` field example: `messageParams.inline = { filename: 'test.jpg', data }`. |
| https://nodemailer.com/message/attachments/ | `attachments[]`: `filename`, `content` (string/Buffer/Stream), `path` (fs path / URL / data URI), `contentType`, `cid`, `encoding` (for base64 strings), `raw`. |
| https://nodemailer.com/message/embedded-images/ | Inline images use `cid` field; reference `src="cid:unique@nodemailer"` in HTML; image content-type with `cid` auto-sets `Content-Disposition: inline`. |
| https://www.npmjs.com/package/nodemailer | `nodemailer` v9.0.3 (2026-06-30). MIT-0. README explicitly says: "Nodemailer has official support for Node.js only. For anything related to TypeScript, you need to directly contact the authors of the type definitions (`@types/nodemailer`)." |
| https://www.npmjs.com/package/mailgun.js | `mailgun.js` v13.3.0 (2026-07-24). Requires Node ≥ 18; depends on `axios`, `base-64`, `url-join`. Ships TS types via `mailgun.js/definitions`. |
| https://www.npmjs.com/package/resend | `resend` — in-package TypeScript types (current SDK). |

---

## Per-Provider Findings

### 1. Resend

- **npm package name (exact, 2026):** `resend`
- **TypeScript types:** Ship **in-package** (first-class TS SDK). No `@types/resend` needed.
- **`send()` signature:**
  ```ts
  resend.emails.send({
    from: string,
    to: string | string[],
    subject: string,
    html?: string,
    text?: string,
    attachments?: Array<{
      filename: string;
      content?: Buffer | string; // Buffer OR base64 string (NO data-URI prefix)
      path?: string;              // hosted URL
      contentType?: string;
      contentId?: string;        // inline image id, referenced as `cid:<contentId>` in HTML
    }>,
    // ... cc, bcc, replyTo, headers, tags, scheduledAt, template
  }): Promise<{ data: { id: string } | null; error: { name: string; message: string } | null }>
  ```
- **Attachment field name + value type:** `attachments[].content` accepts `Buffer` OR a **base64 string** (no `data:@file/png;base64,` prefix — stripping that prefix is the #1 Resend StackOverflow gotcha). `attachments[].path` accepts a publicly fetchable URL.
- **Inline images / `cid:`:** Set `attachments[].contentId = "logo123"` and reference `<img src="cid:logo123">` in `html`.
- **Caveats:**
  - Max **40 MB total per email after Base64 encoding of attachments**.
  - Base64 content must NOT include the data-URI scheme prefix (`data:...;base64,`).
  - `react` (React element) and `html`/`text` are mutually exclusive.
- **Official code snippet:**
  ```ts
  import { Resend } from 'resend';
  const resend = new Resend('re_xxxxxxxxx');
  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Invoice attached',
    html: '<p>See <img src="cid:logo"/></p>',
    attachments: [
      { filename: 'invoice.pdf', content: invoiceBuffer },
      { filename: 'logo.png', content: logoBuffer, contentId: 'logo' },
    ],
  });
  ```

### 2. AWS SES (`@aws-sdk/client-ses`)

- **npm package name (exact, 2026):** `@aws-sdk/client-ses` (AWS SDK for JS v3). Both `SendEmailCommand` (v2 simple/raw/templated) and the legacy `SendRawEmailCommand` (v1 raw MIME) are exported from this package — the v2 commands live under the `sesv2` export.
- **TypeScript types:** Ship **in-package** (all AWS SDK v3 packages bundle generated TS types).
- **`send()` signature (v2 `SendEmailCommand`, simple content with attachments):**
  ```ts
  new SendEmailCommand({
    FromEmailAddress: 'sender@example.com',
    Destination: { ToAddresses: ['recipient@example.com'] },
    Content: {
      Simple: {
        Subject: { Data: 'Email with attachment' },
        Body: { Html: { Data: '<img src="cid:logo123"/>' } },
        Attachments: [
          {
            RawContent: new Uint8Array(...),         // Buffer → Uint8Array; REQUIRED
            FileName: 'logo.png',                    // REQUIRED
            ContentDisposition: 'INLINE' | 'ATTACHMENT',
            ContentId: 'logo123',
            ContentTransferEncoding: 'BASE64' | 'QUOTED_PRINTABLE' | 'SEVEN_BIT',
            ContentType: 'image/png',
            ContentDescription: '...',
          },
        ],
      },
      // OR Raw: { Data: new Uint8Array(...) }  // full raw MIME message
    },
  })
  ```
- **Attachment field name + value type:**
  - v2 `Simple` path: `Content.Simple.Attachments[].RawContent` is a **`Uint8Array`** (wrap a `Buffer` — `Buffer` is a `Uint8Array` subtype). Base64-encoding is handled by the SDK / SES itself when you set `ContentTransferEncoding: 'BASE64'`.
  - v1 / v2 `Raw` path: `Content.Raw.Data` is a single `Uint8Array` of the **complete raw MIME message** (headers + multipart body), already assembled by the client (typically via `nodemailer` or `mailcomposer`). The whole message must be base64-encoded on the wire.
- **Inline images / `cid:`:** On the `Simple` path, set `ContentDisposition: 'INLINE'`, `ContentId: '<id>'`, `ContentTransferEncoding: 'BASE64'`, and reference `<img src="cid:<id>">` in the HTML body. On the `Raw` path, you construct the `multipart/related` MIME with a `Content-ID: <id>` header on the inline part yourself.
- **Caveats (CRITICAL — the plan is wrong here):**
  - **`SendEmailCommand` v2 `Simple` path DOES support attachments + inline images natively as of 2024+ SES API v2** — no raw-MIME construction required. The plan's implication that SES attachments always require `SendRawEmailCommand` is outdated.
  - However, **`SendRawEmailCommand` (v1) max message size is 10 MB**, while **`SendEmail` v2 supports up to 40 MB** (matching Resend). Choose the command based on payload size, not capability.
  - Unsupported attachment MIME types list (executable, script, etc.) applies to both paths — see `docs.aws.amazon.com/ses/latest/dg/mime-types.html`.
  - Default `ContentTransferEncoding` is `SEVEN_BIT` — you must explicitly set `BASE64` for binary inline images to render correctly.
  - Default `ContentDisposition` is `ATTACHMENT` — must be explicitly `INLINE` for inline images.
- **Official code snippet (v2 Simple + inline attachment):**
  ```js
  import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-ses';
  const ses = new SESv2Client({ region: 'us-east-1' });
  await ses.send(new SendEmailCommand({
    FromEmailAddress: 'sender@example.com',
    Destination: { ToAddresses: ['recipient@example.com'] },
    Content: {
      Simple: {
        Subject: { Data: 'Email with attachment' },
        Body: { Html: { Data: '<img src="cid:logo123" alt="Logo"/>' } },
        Attachments: [{
          RawContent: Buffer.from(logoBytes),
          ContentDisposition: 'INLINE',
          FileName: 'logo.png',
          ContentId: 'logo123',
          ContentTransferEncoding: 'BASE64',
        }],
      },
    },
  }));
  ```

### 3. Postmark

- **npm package name (exact, 2026):** `postmark` (v5.1.0, ActiveCampaign/Postmark-maintained). No `@postmark/...` scoped variant — the flat name is the official client.
- **TypeScript types:** Ship **in-package** (the README/wiki confirms TS is part of the build; the package source is TypeScript). No `@types/postmark` needed.
- **`send()` signature:**
  ```ts
  import { ServerClient } from 'postmark';
  const client = new ServerClient('server-token');
  await client.sendEmail({
    From: 'sender@example.com',
    To: 'receiver@example.com',
    Subject: 'Subject',
    HtmlBody: '<img src="cid:image.jpg"/>',
    TextBody: 'fallback',
    Attachments: [
      {
        Name: 'readme.txt',
        Content: 'dGVzdCBjb250ZW50',          // base64 string ONLY
        ContentType: 'text/plain',
      },
      {
        Name: 'image.jpg',
        Content: 'dGVzdCBjb250ZW50',
        ContentType: 'image/jpeg',
        ContentID: 'cid:image.jpg',            // NOTE: includes literal "cid:" prefix
      },
    ],
    MessageStream: 'outbound',
  });
  ```
- **Attachment field name + value type:** `Attachments[].Content` is a **base64-encoded string** only — the JSON API does NOT accept Buffers. `Name`, `ContentType`, and optional `ContentID` round out the shape.
- **Inline images / `cid:`:** Set `Attachments[].ContentID = "cid:image.jpg"` (the value MUST include the `cid:` prefix), and reference `<img src="cid:image.jpg">` in `HtmlBody`.
- **Caveats:**
  - **No Buffer support over the API** — adapter must call `buffer.toString('base64')` before sending.
  - Batch endpoint `/email/batch` accepts up to **500 messages per call, 50 MB total payload** (including attachments).
  - Single `/email` endpoint has the same per-message 50 MB attachment cap.
  - `MessageStream` defaults to `"outbound"` (transactional) if omitted.
  - Custom `Headers[]` use `{ Name, Value }` shape (capitalised keys).
- **Official code snippet (from Postmark developer docs):**
  ```json
  {
    "From": "sender@example.com",
    "To": "receiver@example.com",
    "Subject": "Test",
    "HtmlBody": "<b>Hello</b> <img src=\"cid:image.jpg\"/>",
    "Attachments": [
      { "Name": "readme.txt", "Content": "dGVzdCBjb250ZW50", "ContentType": "text/plain" },
      { "Name": "image.jpg", "ContentID": "cid:image.jpg", "Content": "dGVzdCBjb250ZW50", "ContentType": "image/jpeg" }
    ],
    "MessageStream": "outbound"
  }
  ```

### 4. Mailgun (`mailgun.js`)

- **npm package name (exact, 2026):** `mailgun.js` (**NOT** `mailgun-js` — the latter is deprecated). Current published versions: **v13.3.0** (2026-07-24) and v12.7.0.
- **TypeScript types:** Ship **in-package** under the `mailgun.js/definitions` submodule:
  ```ts
  import { MailgunClientOptions, MessagesSendResult } from 'mailgun.js/definitions';
  import { Interfaces, Enums } from 'mailgun.js/definitions';
  ```
- **`send()` signature (client):**
  ```ts
  import Mailgun from 'mailgun.js';
  const mailgun = new Mailgun(FormData);            // global FormData (Node 18+) or `form-data`
  const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
  await mg.messages.create(DOMAIN, {
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Subject',
    html: '<img src="cid:logo.jpg"/>',
    attachment: [{ filename: 'file.pdf', data: buffer }],   // regular attachments
    inline:      [{ filename: 'logo.jpg', data: imgBuffer }], // inline images (separate field!)
  });
  ```
- **Attachment field name + value type:**
  - `attachment` — a single object or an array of `{ filename, data }`. `data` can be a **Buffer, a readable Stream, or a Blob**. Must use `multipart/form-data` encoding (the SDK handles this when you pass Buffers/Streams).
  - `inline` — same shape, but a **separate top-level message field** for inline images.
- **Inline images / `cid:`:** Mailgun sets the `Content-ID` header from the `filename` of the `inline` entry. Reference it in HTML as `cid:<filename>` (e.g. `filename: 'test.jpg'` → `<img src="cid:test.jpg">`). **Do not** set a `Content-ID` header manually — the SDK/HTTP API derives it from the filename.
- **Caveats:**
  - You MUST pass a `FormData` constructor to `new Mailgun(FormData)` (the library is transport-agnostic). Use the global `FormData` (Node 18+) or the `form-data` npm package.
  - For **EU infrastructure**, pass `url: 'https://api.eu.mailgun.net'` to `mailgun.client(...)`.
  - Requires Node ≥ 18.
  - `attachment` and `inline` are mutually exclusive per file — a file is either an attachment or inline.
  - Multiple attachments: pass an **array** (passing a single object attaches one file).
  - Browser use requires a proxy due to CORS.
- **Official code snippet:**
  ```js
  import Mailgun from 'mailgun.js';
  const mg = new Mailgun(FormData).client({ username: 'api', key: process.env.MAILGUN_API_KEY });
  await mg.messages.create('sandbox-123.mailgun.org', {
    from: 'Excited User <mailgun@sandbox-123.mailgun.org>',
    to: ['test@example.com'],
    subject: 'Test subject',
    html: '<div><img alt="image" src="cid:test.jpg"/></div> Some extra text',
    inline: { filename: 'test.jpg', data: await fsPromises.readFile(filepath) },
  });
  ```

### 5. Nodemailer (SMTP)

- **npm package name (exact, 2026):** `nodemailer` (v9.0.3, 2026-06-30, MIT-0).
- **TypeScript types:** **NOT in-package.** README is explicit: *"Nodemailer has official support for Node.js only. For anything related to TypeScript, you need to directly contact the authors of the type definitions (`@types/nodemailer`)."* Install `@types/nodemailer` separately.
- **`send()` signature:**
  ```ts
  import nodemailer from 'nodemailer';
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com', port: 587, secure: false,
    auth: { user: '...', pass: '...' },
  });
  await transporter.sendMail({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Subject',
    html: '<img src="cid:unique@nodemailer"/>',
    attachments: [
      { filename: 'invoice.pdf', content: buffer },          // Buffer
      { filename: 'notes.txt',   content: fs.createReadStream('notes.txt') }, // Stream
      { filename: 'file.txt',    path: '/abs/path/file.txt' },               // path, streamed
      { filename: 'logo.png',    path: logoPath, cid: 'unique@nodemailer' },   // inline image
      { filename: 'b64.txt',     content: 'aGVsbG8=', encoding: 'base64' },   // base64 string
    ],
  });
  ```
- **Attachment field name + value type:** `attachments[]` is an array of objects with:
  - `filename` (string)
  - `content` — string / **Buffer** / readable **Stream**
  - `path` — file-system path / HTTP(S) URL / data URI (streamed, preferred for large files; data URIs limited to 50 MB encoded)
  - `contentType` (string, optional; else derived from `filename`)
  - `cid` (string, optional — Content-ID for inline embedding)
  - `encoding` — only used when `content` is a string (e.g. `'base64'`)
  - `raw` — pre-built MIME part (advanced)
  - `href` — alternative URL source
- **Inline images / `cid:`:** Set `attachments[].cid = 'unique@nodemailer'` and reference `<img src="cid:unique@nodemailer">` in `html`. When the attachment has a `cid` AND the content type starts with `image/`, Nodemailer **auto-sets `Content-Disposition: inline`** and groups the part into `multipart/related` with the HTML body. Without an `html` body, `cid` attachments degrade to regular attachments.
- **Caveats:**
  - `@types/nodemailer` is **required** for TypeScript users.
  - Data URIs must be passed via `path`, NOT `content` (passing via `content` breaks rendering).
  - Data URIs capped at 50 MB encoded.
  - For `secure: true`, use port 465; for all other ports use `secure: false` (TLS still negotiated via STARTTLS if supported).
  - Nodemailer uses `c-ares` for DNS (not the system resolver) — custom `/etc/hosts` entries are ignored; hard-code IPs if needed.
  - Gmail is notoriously unreliable from Nodemailer; the README explicitly recommends avoiding it.
- **Official code snippet:**
  ```js
  const message = {
    from: 'alice@example.com',
    to: 'bob@example.com',
    subject: 'Screenshot',
    html: '<img src="cid:screenshot@example.com" alt="Screenshot"/>',
    attachments: [{
      filename: 'screenshot.png',
      content: fs.readFileSync('/tmp/screenshot.png'), // Buffer
      cid: 'screenshot@example.com',
    }],
  };
  await transporter.sendMail(message);
  ```

---

## Unified `EmailAttachment` Type Mapping

The plan proposes a single canonical type:

```ts
export interface EmailAttachment {
  readonly filename: string;
  readonly content: Buffer | string;
  readonly contentType?: string;
  readonly contentId?: string; // inline image: `cid:contentId`
}
```

For each adapter, the conversion from `EmailAttachment` → provider-native shape is:

| Plan field | Resend | AWS SES v2 `Simple` | Postmark | Mailgun | Nodemailer |
|---|---|---|---|---|---|
| `filename` | `attachments[].filename` (verbatim) | `Attachments[].FileName` (verbatim) | `Attachments[].Name` (verbatim) | `inline`/`attachment` entry's `filename` (verbatim; derives `Content-ID`) | `attachments[].filename` (verbatim) |
| `content` (Buffer) | `attachments[].content` (Buffer pass-through; SDK accepts Buffer or base64) | `Attachments[].RawContent` (`new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)` — Buffer IS a Uint8Array so direct assignment works) | `Attachments[].Content` = `buffer.toString('base64')` (string only — adapter MUST base64-encode) | `inline`/`attachment` entry's `data` (Buffer or Stream pass-through) | `attachments[].content` (Buffer pass-through) OR `attachments[].path` for fs paths |
| `content` (string) | Treat as base64 string; pass directly to `attachments[].content` (**strip any `data:...;base64,` prefix first**) | Wrap as `Buffer.from(string, 'base64')` then assign to `RawContent` | Pass string directly to `Attachments[].Content` (assumed already base64) | Pass string to `inline`/`attachment` `data` **with `encoding: 'base64'`** (or pre-convert to Buffer) | If `content` is a base64 string, set `attachments[].content = string` AND `attachments[].encoding = 'base64'` |
| `contentType` | `attachments[].contentType` (optional; else derived from filename) | `Attachments[].ContentType` (optional; else SES derives it) | `Attachments[].ContentType` (recommended — Postmark defaults to `application/octet-stream`) | Not exposed via the `mailgun.js` message params — Mailgun derives from `filename` | `attachments[].contentType` (optional; else Nodemailer derives from filename extension) |
| `contentId` (inline image) | `attachments[].contentId` (set raw id, e.g. `"logo123"`); reference `<img src="cid:logo123">` in HTML | `Attachments[].ContentId` (set raw id, e.g. `"logo123"`) **AND** `ContentDisposition: 'INLINE'` **AND** `ContentTransferEncoding: 'BASE64'`; reference `<img src="cid:logo123">` | `Attachments[].ContentID` — MUST include the literal `cid:` prefix, i.e. `"cid:image.jpg"`; reference `<img src="cid:image.jpg">` | Put the file under `inline` (NOT `attachment`); the SDK derives `Content-ID` from `filename`; reference `<img src="cid:<filename>">` in HTML (so `contentId` in the plan should equal `filename` — or the adapter should override `filename` to match `contentId`) | `attachments[].cid` (set raw id, e.g. `"unique@nodemailer"`); Nodemailer auto-sets `Content-Disposition: inline` for image types with a `cid`; reference `<img src="cid:unique@nodemailer">` |

### Adapter implementation notes (gotchas per provider)

- **Resend adapter:** lowest-effort — `content` accepts Buffer natively, `contentId` is a plain string. Single gotcha: strip data-URI prefixes when the caller passes a base64 string.
- **SES adapter:** the most complex. Decisions the adapter must make:
  1. SES Simple path vs Raw path. Default to **`SendEmailCommand` v2 `Simple`** for ≤40 MB; fall back to `SendRawEmailCommand` only for messages exceeding the v2 Simple limit or requiring hand-crafted MIME nesting.
  2. Always set `ContentDisposition`, `ContentId`, `ContentTransferEncoding`, and `ContentType` explicitly on inline-image attachments — SES defaults (`ATTACHMENT` / `SEVEN_BIT`) silently break inline rendering.
  3. Buffer → `Uint8Array` conversion: a Node `Buffer` already satisfies `Uint8Array`, but if the plan's `content` is a base64 string, decode it: `Buffer.from(str, 'base64')`.
- **Postmark adapter:** MUST base64-encode Buffers (`buffer.toString('base64')`) before sending — there is no Buffer transport over JSON. The `ContentID` field conventionally includes the literal `cid:` prefix (the only provider in this set that does so).
- **Mailgun adapter:** MUST separate inline images (`inline` field) from regular attachments (`attachment` field) at the message-params level. The `contentId` from the plan does NOT map directly — Mailgun derives the `Content-ID` header from `filename`. If the caller's `contentId` differs from `filename`, the adapter should override `filename` to match `contentId` (or normalise both to the same value). Passing Buffers requires `multipart/form-data`, which the SDK handles automatically only if you constructed the client with a `FormData` constructor.
- **Nodemailer adapter:** distinguishes `content` (string/Buffer/Stream) from `path` (fs path / URL / data URI). If the plan's `content` is a string, the adapter must decide whether it's plain text or base64 — recommend adding an `encoding?: 'base64'` discriminator on `EmailAttachment` (or always normalising to Buffer in the registry layer). For inline images, set `cid` directly; Nodemailer handles `Content-Disposition: inline` automatically for image content types.
- **Shared registry-layer concern:** the plan's `EmailAttachment.content: Buffer | string` is ambiguous for SES, Postmark, and Nodemailer (does the string mean base64? plain text? a file path?). Recommend **either** (a) tightening the type to `content: Buffer` with an optional `contentBase64?: string` discriminator, **or** (b) adding `encoding?: 'base64' | 'utf8' | 'binary'` so each adapter can interpret the string unambiguously. As written, adapters will have to guess.

### "~80 LOC per adapter" claim

The existing `ResendEmailAdapter` (at `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts`) is ~230 LOC including delivery-row bookkeeping, recipient redirection for tests, exception handlers, and config validation — not 80. Adding attachments + inline images will push each new adapter to **250–350 LOC**:

- SES: command construction + Buffer→Uint8Array + inline-disposition defaults + raw-MIME fallback wrapper.
- Postmark: Buffer→base64 conversion + `cid:` prefix normalisation on `ContentID`.
- Mailgun: `FormData` construction + `inline`/`attachment` split + filename/contentId reconciliation.
- Nodemailer: transporter lifecycle + path-vs-content decision + encoding discriminator.

The plan's "~80 LOC" estimate is roughly the size of just the **happy-path `send` method**; it undercounts the delivery-row persistence + error-handling surface each adapter reuses. The registry design is sound, but adapters should reuse shared helpers (delivery-row creation, status update, error mapping) from a common base rather than copy-pasting the `ResendEmailAdapter` skeleton.
