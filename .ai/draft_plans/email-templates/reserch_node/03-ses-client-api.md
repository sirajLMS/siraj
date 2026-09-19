# SES Client API Verification

**Target package:** `@aws-sdk/client-ses@3.1101.0` (`/home/ahmed/Projects/siraj-mail/node_modules/@aws-sdk/client-ses`)
**HTTP handler:** `@smithy/fetch-http-handler@5.6.13`

---

## 1. VERDICT: **NEEDS UPDATE** (SES v1 vs SES v2 confusion)

A common misconception is that `SendEmailCommand` (from `@aws-sdk/client-ses`) supports attachments natively via
`Content.Simple.Attachments[]`. **This is wrong**. The `Content.Simple` structure and the
`Attachments[]` field do NOT exist in `@aws-sdk/client-ses@3.1101.0` — they belong to the **SESv2**
API (`@aws-sdk/client-sesv2`), which is **NOT installed** in this repo (`package.json` only lists
`@aws-sdk/client-ses@^3.1101.0`; `@aws-sdk/client-sesv2` is absent from `bun.lock`).

In the installed `@aws-sdk/client-ses`, `SendEmailCommand`'s input is the legacy `SendEmailRequest`
shape: `Source` + `Destination` + `Message` (`Message.Subject` + `Message.Body.Text/Html`). There is
no `Attachments` field — `SendEmail` cannot send attachments. To send attachments with this
package you MUST use `SendRawEmailCommand` and construct a MIME multipart/mixed message yourself
(`RawMessage.Data: Uint8Array`).

The `Content.Simple.Attachments[]` field belongs to the **SESv2**
`SendEmailCommand` (`@aws-sdk/client-sesv2`), which would need to be added as a dependency.

---

## 2. Confirmed versions

| Package | Expected | Installed | file:line ref |
|---|---|---|---|
| `@aws-sdk/client-ses` | 3.1101.0 | 3.1101.0 | `node_modules/@aws-sdk/client-ses/package.json:3` |
| `@smithy/fetch-http-handler` | 5.6.13 | 5.6.13 | `node_modules/@smithy/fetch-http-handler/package.json:3` |

Entry points (`@aws-sdk/client-ses`): `main: ./dist-cjs/index.js`, `module: ./dist-es/index.js`,
`types: ./dist-types/index.d.ts`, `exports["."]→types → ./dist-types/index.d.ts`.
Engines: `node >=20.0.0`. No `peerDependencies` block present (default credential chain ships in-box
via the `@aws-sdk/credential-provider-node` runtime dep — see §6).

---

## 3. Exact exports (from `.d.ts`)

### `SESClient` — `dist-types/SESClient.d.ts`
Class export. Constructor signature (final lines of `SESClient.d.ts`):

```
export declare class SESClient extends __Client<...> {
    readonly config: SESClientResolvedConfig;
    constructor(...[configuration]: __CheckOptionalClientConfig<SESClientConfig>);
    destroy(): void;
}
```

`SESClientConfig` includes `requestHandler?: __HttpHandlerUserInput` (inherited from
`ClientDefaults`), `region?`, `credentials?` (from default-chain via
`credentialDefaultProvider`), `logger?`, `maxAttempts?` etc. The `requestHandler` slot is where
`FetchHttpHandler` plugs in.

### `SendEmailCommand` — `dist-types/commands/SendEmailCommand.d.ts`
Class export. Constructor takes `SendEmailCommandInput` which `extends SendEmailRequest`
(`dist-types/commands/SendEmailCommand.d.ts:10`). Class decl is at the bottom of that file.

### `SendRawEmailCommand` — `dist-types/commands/SendRawEmailCommand.d.ts`
Class export. Constructor takes `SendRawEmailCommandInput` which `extends SendRawEmailRequest`
(`dist-types/commands/SendRawEmailCommand.d.ts:10`).

---

## 4. `SendEmailCommandInput` (`SendEmailRequest`) field shape

Definition: `dist-types/models/models_0.d.ts:2944` (`export interface SendEmailRequest`).

Top-level fields (all confirmed by reading the interface):
- `Source: string | undefined` (REQUIRED) — the From address.
  Verified at `models_0.d.ts:2956` ("The email address that is sending the
  email").
- `Destination: Destination | undefined` (REQUIRED) — `ToAddresses`/`CcAddresses`/`BccAddresses`.
- `Message: Message | undefined` (REQUIRED) — see below.
- `ReplyToAddresses?`, `ReturnPath?`, `SourceArn?`, `ReturnPathArn?`, `Tags?`,
  `ConfigurationSetName?` (all optional).

**There is NO `Content` field on `SendEmailRequest`.** The `Content.Simple.Attachments[]`
path does not exist in this package.

### `Message` shape (`models_0.d.ts:2576`)
```
export interface Message {
    Subject: Content | undefined;
    Body: Body | undefined;
}
```

### `Body` shape (`models_0.d.ts:49`)
```
export interface Body {
    Text?: Content | undefined;
    Html?: Content | undefined;
}
```
So `Message.Body.Html` and `Message.Body.Text` DO exist (they live at `Message.Body.Html`, not the SESv2-style `Content.Simple.Body.Html`).

### `Content` shape (`models_0.d.ts:31`)
```
export interface Content {
    Data: string | undefined;
    Charset?: string | undefined;
}
```

### Attachment field shape — **does not exist** in this package
`grep -i "Attachments"` across `dist-types/` returns only prose comments (e.g. the `ConnectAction`
docstring at `models_0.d.ts:559-560`: "maximum email size (including headers) is 40 MB … up to 10
attachments"). There is **no `Attachments[]` property** on `SendEmailRequest`, `Message`, or `Body`.
The `Filename`/`Content` (base64)/`ContentId` per-attachment shape belongs to the SESv2
`Attachment` type (see §5) — not present here.

---

## 5. `SendRawEmailCommandInput` (`SendRawEmailRequest`) — the ONLY way to attach with v1

Definition: `models_0.d.ts` (immediately after `SendEmailResponse`). Fields:
- `Source?: string | undefined` (OPTIONAL — defaults to the `From:` header in the raw MIME)
- `Destinations?: string[] | undefined`
- `RawMessage: RawMessage | undefined` (REQUIRED)

### `RawMessage` (`models_0.d.ts:2681`)
```
export interface RawMessage {
    Data: Uint8Array | undefined;   // raw RFC-5322 MIME bytes; SDK base64-encodes for you
}
```

Purpose confirmed (`SendRawEmailCommand.d.ts` JSDoc): *"This operation is more flexible than the
`SendEmail` operation. … you can specify the headers … as well as its content. This flexibility is
useful … when you need to send a multipart MIME email (such a message that contains both a text and
an HTML version). You can also use this operation to send messages that include attachments."*

### Per-attachment field shape (SESv2 — NOT installed here)
For reference (from the SESv2 `.d.ts` shown in AWS docs), the SESv2 `Attachment` object uses these
**PascalCase** fields:
```
{ RawContent: Uint8Array,       // required, SDK base64-encodes
  FileName: string,              // required
  ContentType?: string,          // IANA media type
  ContentDisposition?: "ATTACHMENT" | "INLINE",
  ContentDescription?: string,
  ContentId?: string,           // for inline images (cid: references)
  ContentTransferEncoding?: "BASE64" | "QUOTED_PRINTABLE" | "SEVEN_BIT" }
```
Path in SESv2 input: `Content.Simple.Attachments[]` (note: `Simple`, not `Message`).
➡️ To use this shape the repo must add `@aws-sdk/client-sesv2`, OR construct MIME manually and use
`SendRawEmailCommand` from the currently-installed `@aws-sdk/client-ses`.

### Size limits
- `SendEmailCommand` JSDoc (`SendEmailCommand.d.ts`): *"The maximum message size is 10 MB."*
- `SendRawEmailCommand` JSDoc: *"The maximum message size, including attachments, is 10 MB."*
- The "40 MB / 10 attachments" figure in `models_0.d.ts:559-560` is for *inbound* email (SES
  receiving via `ConnectAction`) — **NOT** outbound sending. The outbound limit for
  `SendEmailCommand` is **10 MB** for both commands, not 40 MB.
- AWS docs ("send-email-raw.html") confirm outbound is handled via `SendEmail` API v2 with content
  type `raw`, or via the v1 `SendRawEmail` — both subject to the 10 MB SES message-size cap.

---

## 6. `FetchHttpHandler` — export + constructor

Package: `@smithy/fetch-http-handler@5.6.13` (`node_modules/@smithy/fetch-http-handler`).
Entry: `types: ./dist-types/index.d.ts`.

`dist-types/index.d.ts`:
```
export { type AdditionalRequestParameters, FetchHttpHandler,
         type FetchHttpHandlerOptions, keepAliveSupport } from "./fetch-http-handler";
```
➡️ The export is **`FetchHttpHandler`** (PascalCase, named) plus the `FetchHttpHandlerOptions`
type. There is NO lowercase `fetchHttpHandler` export in this version; the import shape
`import { FetchHttpHandler } from '@smithy/fetch-http-handler'` is correct.

`dist-types/fetch-http-handler.d.ts` (constructor section):
```
export declare class FetchHttpHandler implements HttpHandler<FetchHttpHandlerOptions> {
    static create(instanceOrOptions?): FetchHttpHandler | HttpHandler<any>;
    constructor(options?: FetchHttpHandlerOptions | Provider<FetchHttpHandlerOptions | void>);
    destroy(): void;
    handle(request: HttpRequest, { abortSignal, requestTimeout }?: HttpHandlerOptions): Promise<{response: HttpResponse}>;
    ...
}
```

### Usage in an SES adapter
```ts
import { SESClient } from "@aws-sdk/client-ses";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

const client = new SESClient({
  region: process.env.AWS_REGION!,
  requestHandler: new FetchHttpHandler(),   // passes via ClientDefaults.requestHandler
});
```
`SESClientConfig.requestHandler` is typed as `__HttpHandlerUserInput` (from
`@smithy/core/protocols`), which accepts either an `HttpHandler` instance (like
`new FetchHttpHandler()`) or its constructor options — both are accepted by
`FetchHttpHandler.create()`.

### Bun 1.3.x rationale
`@smithy/fetch-http-handler` uses the global `fetch()` (Bun has native `fetch`), avoiding the
Node `https`-agent path in `@smithy/node-http-handler` that triggers Bun HTTPS-hang issue #26066.
This rationale is sound.

---

## 7. Peer-dep / credentials summary

`@aws-sdk/client-ses` `package.json` has **no `peerDependencies`** and **no
`@aws-sdk/credential-providers` dep**. Instead it bundles `@aws-sdk/credential-provider-node` as a
runtime `dependency` (`"@aws-sdk/credential-provider-node": "^3.972.76"`). That package implements
the **default credential provider chain** (env vars → shared INI file → ECS/EC2 IAM role → SSO).
➡️ No separate `@aws-sdk/credential-providers` install is needed for the default chain. Adapters
can rely on env vars (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`) or an attached IAM
role with no extra code. `@aws-sdk/credential-providers` is only needed for non-default sources
(e.g. `fromWebIdentity`, `fromCognitoIdentity`, explicit `fromEnv`).

---

## 8. Online-docs cross-ref

- `https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/command/SendEmailCommand/`
  input table lists exactly: `Destination`, `Message`, `Source` (required) + `ConfigurationSetName`,
  `ReplyToAddresses`, `ReturnPath`, `ReturnPathArn`, `SourceArn`, `Tags`. **No `Attachments`.**
- `https://docs.aws.amazon.com/ses/latest/dg/send-email-raw.html` — attachments require either
  SESv2 `SendEmail` with `Content.Simple.Attachments[]` OR constructing a MIME multipart/mixed
  message and sending via `SendRawEmail` (the v1 path installed here). Outbound message size cap is
  10 MB (SES service limit), not 40 MB.
- WebSearch "AWS SDK SES v3 SendEmailCommand Attachment Content Simple Attachments example"
  confirms: *"The standard SES SendEmailCommand does not support attachments … To send emails with
  attachments, you must use the SES v2 API … or use the SendRawEmailCommand to manually construct a
  MIME-formatted message."*

---

## 9. Summary of corrections

1. **`SendEmailCommand` does NOT support attachments** in `@aws-sdk/client-ses@3.1101.0`. The
   `Content.Simple.Attachments[]` path is a **SESv2** (`@aws-sdk/client-sesv2`) construct that is
   NOT installed. Two valid fixes:
   - (a) **Add `@aws-sdk/client-sesv2`** as a dependency and use its `SendEmailCommand` with
     `Content.Simple.Attachments[]` (field shape: `RawContent: Uint8Array`, `FileName`, optional
     `ContentType`, `ContentDisposition`, `ContentId`, `ContentTransferEncoding` — all PascalCase,
     SDK auto-base64-encodes `RawContent`).
   - (b) Stay on `@aws-sdk/client-ses` and send attachments via `SendRawEmailCommand` by manually
     assembling a `multipart/mixed` MIME message in `RawMessage.Data: Uint8Array` (the SDK
     base64-encodes for the wire).
2. **`SendRawEmailCommand` is not "only for >40 MB"** — it is the standard v1 path for ANY
   attachment. The 10 MB outbound SES message cap (not 40 MB) applies to both commands; "40 MB /
   10 attachments" is the INBOUND (receipt) limit, not outbound sending.
3. If choosing path (a), the SDK adapter must import `SESClient` / `SendEmailCommand` from
   `@aws-sdk/client-sesv2`, not `@aws-sdk/client-ses`. `FetchHttpHandler` usage
   (`requestHandler: new FetchHttpHandler()`) and credential handling (default chain via
   `@aws-sdk/credential-provider-node`, no extra peer dep) remain identical.
4. `Source` IS the From field ✅. In `SendEmailRequest` it is REQUIRED; in
   `SendRawEmailRequest` it is optional (falls back to the `From:` MIME header).
5. FetchHttpHandler import (`import { FetchHttpHandler } from '@smithy/fetch-http-handler'`,
   `requestHandler: new FetchHttpHandler()` in `SESClient` config) is **VERIFIED** — exact exported
   symbol name and constructor signature confirmed.
