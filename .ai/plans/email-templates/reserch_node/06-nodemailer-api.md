# Nodemailer Adapter API Verification

> Subagent research report. Verifies the installed `nodemailer@9.0.3` + `@types/nodemailer@8.0.1` packages against plan lines 317 & 558 (`SmtpEmailAdapter.ts` adapter; Bun compatibility check).

## VERDICT: VERIFIED (one minor `encoding`-literal-union refinement for the plan)

The adapter API surface the plan relies on (`createTransport`, `Transporter.sendMail`, `MailOptions`, `Attachment`, `SMTPOptions`) is intact in the installed packages. The only precision adjustment: the `Attachment.encoding` field is typed as a plain `string` (not a literal union `"base64" | "utf-8" | ...`) in the .d.ts — the OTT plan should treat it as `string` and constrain via JSDoc/runtime validation if it wants an enum.

---

## 1. Confirmed versions

| Package | Installed | Plan expected | `main` / `types` |
|---|---|---|---|
| `nodemailer` | `9.0.3` ✅ | `9.0.3` | `main: "lib/nodemailer.js"`, no `module`, no `types` field (ships **no own types**; relies on `@types/nodemailer`). |
| `@types/nodemailer` | `8.0.1` ✅ | `8.0.1` | `types: "index.d.ts"` (DefinitelyTyped, `typeScriptVersion: "5.3"`). |

Confirmed from `node_modules/nodemailer/package.json` and `node_modules/@types/nodemailer/package.json`.

---

## 2. `createTransport` signature

`node_modules/@types/nodemailer/index.d.ts:45-73` — 7 overloads, all returning `Transporter<…SentMessageInfo, …Options>`. The relevant ones for the SMTP adapter:

```ts
// index.d.ts:45-48 — SMTP (single connection / pool defaults)
export function createTransport(
    transport: SMTPPool | SMTPPool.Options,
    defaults?: SMTPPool.Options,
): Transporter<SMTPPool.SentMessageInfo, SMTPPool.Options>;

// index.d.ts:65-69 — SMTP plain (the overload most apps hit)
export function createTransport(
    transport?: SMTPTransport | SMTPTransport.Options | string,
    defaults?: SMTPTransport.Options,
): Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;
```

`Transporter<T, D>` is an alias for the `Mail<T, D>` class — `index.d.ts:14`:

```ts
export type Transporter<T = any, D extends TransportOptions = TransportOptions> = Mail<T, D>;
```

`SendMailOptions = Mail.Options` — `index.d.ts:12`.

**Return**: `Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>` (i.e. a `Mail` subclass instance). `SentMessageInfo` for SMTP (`smtp-transport/index.d.ts`) is `{ envelope, messageId, accepted[], rejected[], pending[], response }`.

---

## 3. `Transporter.sendMail` signature

`node_modules/@types/nodemailer/lib/mailer/index.d.ts:196-202`. Four overloads — both callback and Promise forms:

```ts
sendMail(
    mailOptions: Mail.Options & Partial<DefaultTransportOptions>,
    callback: (err: Error | null, info: T) => void,
): void;                                    // mailer/index.d.ts:196-199
sendMail(mailOptions: Mail.Options, callback: (err: Error | null, info: T) => void): void;  // :200
sendMail(mailOptions: Mail.Options & Partial<DefaultTransportOptions>): Promise<T>;          // :201
sendMail(mailOptions: Mail.Options): Promise<T>;                                            // :202
```

**Promise-returning when the callback parameter is omitted.** Under `async/await` — `await transporter.sendMail(opts)` → `Promise<SMTPTransport.SentMessageInfo>`. ✅ matches the plan's intended `await transporter.sendMail({...})` usage.

Also: `verify()` returns `Promise<true>` (mailer/index.d.ts:188-189); `close(): void` (line 178); `isIdle(): boolean` (line 181).

---

## 4. Full `Mail.Options` (= `SendMailOptions`) interface — verbatim

`node_modules/@types/nodemailer/lib/mailer/index.d.ts:101-167`. **Every field**, exact types:

| Field | Type | Line |
|---|---|---|
| `from` | `string \| Address \| Array<string \| Address> \| undefined` | 102 |
| `sender` | `string \| Address \| undefined` | 104 |
| `to` | `string \| Address \| Array<string \| Address> \| undefined` | 105 |
| `cc` | `string \| Address \| Array<string \| Address> \| undefined` | 107 |
| `bcc` | `string \| Address \| Array<string \| Address> \| undefined` | 109 |
| `replyTo` | `string \| Address \| Array<string \| Address> \| undefined` | 111 |
| `inReplyTo` | `string \| Address \| undefined` | 113 |
| `references` | `string \| string[] \| undefined` | 115 |
| `subject` | `string \| undefined` | 117 |
| `text` | `string \| Buffer \| Readable \| AttachmentLike \| undefined` | 119 |
| `html` | `string \| Buffer \| Readable \| AttachmentLike \| undefined` | 121 |
| `watchHtml` | `string \| Buffer \| Readable \| AttachmentLike \| undefined` | 123 |
| `amp` | `string \| Buffer \| Readable \| AmpAttachment \| undefined` | 125 |
| `icalEvent` | `string \| Buffer \| Readable \| IcalAttachment \| undefined` | 127 |
| `headers` | `Headers \| undefined` (Headers = object map or array) | 129 |
| `list` | `ListHeaders \| undefined` | 131 |
| `attachments` | `Attachment[] \| undefined` | 133 |
| `alternatives` | `Attachment[] \| undefined` | 135 |
| `envelope` | `Envelope \| MimeNode.Envelope \| undefined` | 137 |
| `messageId` | `string \| undefined` | 139 |
| `date` | `Date \| string \| undefined` | 141 |
| `encoding` | `string \| undefined` | 143 |
| `raw` | `string \| Buffer \| Readable \| AttachmentLike \| undefined` | 145 |
| `textEncoding` | `TextEncoding \| undefined` where `TextEncoding = "quoted-printable" \| "base64"` | 147 |
| `disableUrlAccess` | `boolean \| undefined` | 149 |
| `disableFileAccess` | `boolean \| undefined` | 151 |
| `dkim` | `DKIM.Options \| undefined` | 153 |
| `normalizeHeaderKey` | `(key: string) => string` (method, optional) | 155 |
| `priority` | `"high" \| "normal" \| "low" \| undefined` | 156 |
| `attachDataUrls` | `boolean \| undefined` | 158 |
| `xMailer` | `false \| string` | 160 |

`Address` (mailer/index.d.ts:30-34): `{ name?: string \| undefined; address: string }`.

This confirms every field the plan enumerates (To, From, Subject, HTML, Text, Attachments) plus expands the picture (cc, bcc, replyTo, headers, envelope, messageId, priority, etc.).

---

## 5. `Attachment` interface — verbatim

`node_modules/@types/nodemailer/lib/mailer/index.d.ts:38-58`. `AttachmentLike` is defined first (line 38-42), then `Attachment extends AttachmentLike` (line 45-58):

```ts
// mailer/index.d.ts:38-42
interface AttachmentLike {
    /** String, Buffer or a Stream contents for the attachment */
    content?: string | Buffer | Readable | undefined;
    /** path to a file or an URL (data uris are allowed as well) if you want to stream the file instead of including it */
    path?: string | Url | undefined;
}

// mailer/index.d.ts:45-58
interface Attachment extends AttachmentLike {
    filename?: string | false | undefined;                 // :47
    cid?: string | undefined;                              // :49
    encoding?: string | undefined;                         // :51  <-- NOTE: plain string, NOT a literal union
    contentType?: string | undefined;                      // :53
    contentTransferEncoding?: "7bit" | "base64" | "quoted-printable" | false | undefined;  // :55
    contentDisposition?: "attachment" | "inline" | undefined;  // :57
    headers?: Headers | undefined;                          // :59
    raw?: string | Buffer | Readable | AttachmentLike | undefined;  // :61
}
```

Inherited from `AttachmentLike` (via `extends`): `content?: string | Buffer | Readable | undefined` and `path?: string | Url | undefined`.

### Cross-check vs. plan §"Attachment type fields"

| Plan claim | .d.ts reality | Status |
|---|---|---|
| `filename` | `filename?: string \| false \| undefined` | ✅ |
| `content` (`Buffer \| string \| Stream`) | `content?: string \| Buffer \| Readable \| undefined` (`Readable` = `NodeJS.ReadableStream`) | ✅ |
| `cid` | `cid?: string \| undefined` | ✅ |
| `path` | `path?: string \| Url \| undefined` | ✅ (also accepts `url.Url` and data-URI strings) |
| `contentType` | `contentType?: string \| undefined` | ✅ |
| `encoding` (`"base64" \| "utf-8" \| ...` literal union) | **`encoding?: string \| undefined`** — **plain `string`, NOT a literal union** | ⚠️ Minor refinement — see verdict |
| (implied) `raw`, `contentDisposition`, `contentTransferEncoding`, `headers` | All present | ✅ Plan omitted these but they exist. |

**Refinement needed by the plan**: the OTT plan describes `encoding` as a literal union `"base64" | "utf-8" | "hex" | "binary" | "7bit" | "8bit"`. The installed `@types/nodemailer@8.0.1` types it as **bare `string`**. The valid runtime values are documented (online docs: `'base64'`, `'hex'`, `'binary'`, `'utf8'`/`'utf-8'`, etc.), but TypeScript will not narrow — so if the siraj adapter wants compile-time enum enforcement it must declare its own literal union and cast before passing to nodemailer.

Everything else matches the plan exactly.

---

## 6. SMTP transport options shape

`node_modules/@types/nodemailer/lib/smtp-transport/index.d.ts:33-37`:

```ts
interface Options extends MailOptions, TransportOptions, SMTPConnection.Options {
    service?: string | undefined;
    getSocket?(options: Options, callback: (err: Error | null, socketOptions: any) => void): void;
    url?: string | undefined;
}
```

The actual SMTP socket config comes from `SMTPConnection.Options` — `node_modules/@types/nodemailer/lib/smtp-connection/index.d.ts:122-159`. Verified fields the plan names:

| Plan field | Type | .d.ts location |
|---|---|---|
| `host` | `string \| undefined` | smtp-connection/index.d.ts:124 |
| `port` | `number \| undefined` | :126 |
| `secure` | `boolean \| undefined` | :130 |
| `auth` | `SMTPConnection.AuthenticationType \| undefined` — where `AuthenticationType = AuthenticationTypeCustom \| AuthenticationTypeLogin \| AuthenticationTypeOAuth2`. `Login` extends `Credentials`: `{ user: string; pass: string; type?: ... }` (smtp-connection/index.d.ts:21-23, 31-34) | :128 |
| (extra) `service` | `string \| undefined` — gmail/outlook shortcut, on `SMTPTransport.Options` itself | smtp-transport/index.d.ts:34 |
| (extra) `tls` | `tls.ConnectionOptions \| undefined` | smtp-connection/index.d.ts:138 |
| (extra) `ignoreTLS`, `requireTLS`, `opportunisticTLS` | `boolean \| undefined` | smtp-connection/:132, :134, :136 |
| (extra) `connectionTimeout`, `greetingTimeout`, `socketTimeout`, `dnsTimeout` | `number (ms) \| undefined` | :144-150 |

So the plan's `{ host, port, secure, auth }` shape is fully supported. `auth: { user, pass }` is exactly `SMTPConnection.Credentials` (`{ user: string; pass: string }`) — works with **no `type` field** because `AuthenticationTypeLogin` makes `type` optional and the `login` discriminator is the default at runtime.

`SMTPTransport.MailOptions` (smtp-transport/index.d.ts:24-27) extends `Mail.Options` with `auth` + `dsn` — used when per-send auth overrides the transporter's auth.

---

## 7. Bun-specific README notes

`grep -in "bun" node_modules/nodemailer/README.md` → **"NO BUN MENTIONS FOUND"**. The README only states Node.js v6+ support and includes a generic caution that Nodemailer is a Node.js library. The Bun caveats must come from external sources (and they do — see §8).

---

## 8. Bun SMTP issue #10329 — still relevant in 2026?

**Yes, still open.** WebSearch confirms `oven-sh/bun#10329` ("Nodemailer — Cannot send message: smtp connection socket is already destroyed") was last updated **2025-11-25** and remains in `open` state with labels `bug`, `ecosystem`, `node:stream`. A related STARTTLS-upgrade issue (`oven-sh/bun#21541` and the tracked `oven-sh/bun#25044`) documents that Bun's `usocket` library **does not support upgrading a plain socket to TLS for server-side sockets** — which is the underlying infrastructure gap; client-side SMTP send mostly works but can degrade under pooling/reused-connection patterns.

The upstream nodemailer maintainer (`andris9`) explicitly closed the Bun-tracking mirror issue (`nodemailer/nodemailer#1644`) in July 2024 with: *"Nodemailer has guaranteed support only for Node."*

### Recommendations for the siraj SMTP adapter (consistent with plan line 317):

1. **Prefer API providers** (SES, Postmark, Mailgun) for production; keep SMTP as a fallback only — exactly what plan line 317 says.
2. **Reuse a single transporter** across the process; do NOT `createTransport()` per send (per `11-bun-compatibility.md`).
3. **Disable pooling** under Bun: set `pool: false` in transport options (community-confirmed workaround — repeated handshakes are cheaper than Bun closing pooled sockets). Maintain `transporter.close()` on shutdown.
4. Avoid `STARTTLS`-upgrade scenarios (`secure: false` on port 587) where possible; prefer `secure: true` on port 465 (TLS from the start) — sidesteps the `usocket.upgradeTLS` gap.
5. Add CI smoke tests that actually run SMTP under Bun to catch regressions; the plan's §558 "Bun compatibility checks" line correctly references #10329.

These caveats are still live in 2026 with Bun 1.3.x; no fix has landed. The plan's caution is justified and current.

---

## 9. Online-docs cross-reference

Fetched the live nodemailer.com docs (after the trailing-slash URLs 404'd — the canonical paths have no trailing slash):

- **`https://nodemailer.com/smtp`** (200 OK) — confirms `createTransport(options[, defaults])`, the `host`/`port`/`secure`/`auth`/`service`/`tls`/`authMethod` option table, `verify()` Promise+callback, and `pool`/`maxConnections`/`maxMessages` for pooling. Mirror of the `SMTPConnection.Options` + `SMTPTransport.Options` .d.ts shape.
- **`https://nodemailer.com/message/attachments`** (via WebSearch snippet — direct fetch 404'd) — confirms `content` accepts `string | Buffer | Readable` and explicitly warns a WHATWG `ReadableStream` (e.g. `fetch()` body) is NOT accepted directly — must `Readable.fromWeb()` first. Confirms `filename`, `contentType`, `contentDisposition` ('attachment' default; 'inline' if image+cid), `cid`, `encoding` ('base64', 'hex', 'utf8'), `contentTransferEncoding` ('base64', 'quoted-printable', '7bit', '8bit' — default 'base64').
- `nodemailer.com/message` — confirms `attachDataUrls`, `textEncoding` (`'quoted-printable' | 'base64'`), `encoding` only applies `'base64'`/`'quoted-printable'` to text parts; other values ignored.

All_online docs are consistent with the installed `.d.ts` types. No drift.

---

## One-line verdict

**VERIFIED** — with one refinement: the plan's `Attachment.encoding` literal-union claim (`"base64" | "utf-8" | ...`) should be downgraded to `string` to match `@types/nodemailer@8.0.1` (`mailer/index.d.ts:51`); declare your own literal union in the siraj adapter type layer if compile-time enum enforcement is wanted.
