# Postmark `postmark@5.1.0` API Verification

Verification of the `postmark` npm ServerClient send-email API.

## 1. Confirmed version & entry points

`node_modules/postmark/package.json`:
- `name`: `postmark`
- `version`: **`5.1.0`** 
- `main`: `./dist/index.js`
- `types`: `./dist/index.d.ts`
- No `exports`/`module` keys — Node resolution falls back to `main`/`types`.
- `engines.node`: `>=18.0.0` (Bun compatible via standard fetch).
- Entry types file: `node_modules/postmark/dist/index.d.ts`

## 2. Client class name + constructor + send method

`dist/index.d.ts`:
```ts
import ServerClient from "./client/ServerClient";
export { ServerClient, ServerClient as Client, ... };
export { Message, TemplatedMessage, Attachment, Header, BulkEmailRequest, BulkEmailMessage };
```
- **Class name:** `ServerClient` (exported), with alias `Client`. `ServerClient` is the canonical name.
- **Constructor** (`dist/client/ServerClient.d.ts`):
  ```ts
  constructor(serverToken: string, configOptions?: ClientOptions.Configuration);
  ```
  `ClientOptions.Configuration` (`dist/client/models/client/ClientOptions.d.ts`):
  - `useHttps?: boolean`
  - `requestHost?: string`
  - `timeout?: number`
  - `fetch?: FetchImplementation` — **custom fetch allowed (accepts `RequestInfo | URL`)** — useful for Bun/proxy concerns.
- **Single-email send method** (`dist/client/ServerClient.d.ts`):
  ```ts
  sendEmail(email: Message, callback?: Callback<MessageSendingResponse>): Promise<MessageSendingResponse>;
  ```
  - Method name is **`sendEmail`** (camelCase) — no `sendEmailAsync`/`send`.
  - Parameter type is **`Message`** (NOT `TemplatedMessage`; that's used for `sendEmailWithTemplate`).
  - No callback variant required — Promise-returning call works directly (Bun `await`).
  - There is **no async-suffixed variant**; the lib is already Promise-based.

## 3. Full `Message` interface

`dist/client/models/message/Message.d.ts`:
```ts
export declare class Message {
    From: string;
    To?: string;
    Cc?: string;
    Bcc?: string;
    MessageStream?: string;
    Subject: string;
    ReplyTo?: string;
    HtmlBody?: string;
    TextBody?: string;
    Tag?: string;
    TrackOpens?: boolean;
    TrackLinks?: LinkTrackingOptions; // enum: TextOnly | HtmlOnly | HtmlAndText | None
    Headers?: Header[];                // Header: { Name: string; Value: string }
    Attachments?: Attachment[];
    Metadata?: Hash<string>;          // { [key: string]: string }
    constructor(From, Subject, HtmlBody?, TextBody?, To?, Cc?, Bcc?, ReplyTo?, Tag?, TrackOpens?, TrackLinks?, Headers?, Attachments?, Metadata?);
}
```
All field names are **PascalCase** (platform convention); all PascalCase (platform convention). `From` + `Subject` are required (non-optional). `HtmlBody`/`TextBody` both optional (Postmark requires at least one). Note: `Message` is exported as a **class** with a constructor, but object literals also work (TypeScript structural typing). The adapter should pass a literal — no need to `new Message(...)`.

## 4. `Attachments[]` exact shape — CRITICAL

`dist/client/models/message/SupportingTypes.d.ts`:
```ts
export declare class Attachment {
    Name: string;
    ContentID: string | null;
    Content: string;                  // <-- STRING, not Buffer | string
    ContentType: string;
    ContentLength?: number;
    Disposition?: string | null;
    constructor(Name, Content, ContentType, ContentID?: string | null, ContentLength?: number, Disposition?: string);
}
```
JSDoc on the class (verbatim):
> `@param Content - Base64 encoded content, for example: fs.readFileSync('/Folder/book.pdf').toString('base64')`
> `@param ContentID - id of the attachment, in case we are referencing it, for example: cid:123book.pdf`

- **Field names**: `Name`, `Content`, `ContentType`, `ContentID` (all PascalCase).
- **`Content` is STRING-ONLY** (plain `string` — no `Buffer | string` union). The library performs **NO automatic base64 encoding** — the adapter MUST call `Buffer.from(buf).toString('base64')` manually. The type system enforces this (would fail tsgo if you tried passing a `Buffer`).
- `ContentID` accepts `string | null` (use `null` or omit it for normal attachments; use the `cid:...` string for inline images).
- Two additional optional fields exist: `ContentLength?` and `Disposition?` — both optional and ignorable.
- Postmark enforces a 10 MB cap on the entire base64-inflated message (per online docs), so the adapter should fail-fast on oversized payloads.

## 5. `MessageSendingResponse` shape

`dist/client/models/message/Message.d.ts`:
```ts
export interface MessageSendingResponse extends DefaultResponse {
    To?: string;
    Cc?: string;
    Bcc?: string;
    SubmittedAt: string;     // required (ISO timestamp)
    MessageID: string;        // required
}
```
`DefaultResponse` (`dist/client/models/client/DefaultResponse.d.ts`):
```ts
export interface DefaultResponse {
    ErrorCode: number;   // 0 on success
    Message: string;     // status text (e.g., "OK" or error description)
}
```
So `MessageSendingResponse` has: `To?`, `Cc?`, `Bcc?`, `SubmittedAt` (req), `MessageID` (req), `ErrorCode` (req via base), `Message` (req via base). `To`, `SubmittedAt`, `MessageID`, `ErrorCode`, and `Message` are present, as are `Cc`/`Bcc`.

Error handling: Postmark returns HTTP 200 with non-zero `ErrorCode` for logical failures (not a thrown rejection); the adapter should check `response.ErrorCode === 0` (or rely on the SDK's error-handling which throws on HTTP-level errors). The adapter should inspect `ErrorCode` defensively.

## 6. Online-docs cross-ref

- **Official Node.js guide** (now lives under user-guide, not the old supported-languages URL):
  https://postmarkapp.com/developer/user-guide/send-email-with-api/send-a-single-email — confirms:
  - `new ServerClient(process.env.POSTMARK_SERVER_TOKEN!)` shared-instance pattern recommended
  - "The `Content` field stores the binary data for the file, which must be transmitted as a base64-encoded string."
  - For inline images: "Images must be base64-encoded and the `ContentID` field must match the image's CID."
  - 5 MB cap on TextBody/HtmlBody each, 10 MB total (post-base64).

- **GitHub Wiki** (ActiveCampaign/postmark.js — Email sending): confirms the exact pattern:
  ```js
  const attachment = new postmark.Models.Attachment(
    "book.pdf",
    fs.readFileSync('/Folder/book.pdf').toString("base64"),
    "application/pdf"
  );
  message.Attachments = [attachment];
  client.sendEmail(message).then(response => { ... });
  ```
  This is the canonical example for the base64-string-only rule.

- WebFetch on `https://postmarkapp.com/developer/supported-languages/nodejs` returned **404** — that URL was reorganized into the user-guide path above. Just a stale doc URL.

## 7. Verdict

**VERIFIED.** Attachments are base64-string only (convert Buffers via `.toString('base64')`).

### Confirmed specifics for the `PostmarkEmailAdapter`:
| Item | Claim | Verified? |
|---|---|---|
| Package `postmark` v5 ServerClient | ServerClient (or Client) | **Yes** — both names exported, `ServerClient` is canonical |
| `.sendEmail()` method | `.sendEmail()` sends a single email | **Yes** — `sendEmail(email: Message, callback?) => Promise<MessageSendingResponse>` |
| Message type | `Message` | **Yes** — class `Message`, all fields PascalCase |
| Attachments field | `Attachments` array | **Yes** — `Attachments?: Attachment[]` (PascalCase) |
| Per-attachment fields | `{ Name, Content, ContentType, ContentID }` | **Yes** — confirmed; plus optional `ContentLength`/`Disposition` |
| Content base64-string-form | Content is base64-string-form | **Yes** — `Content: string`, JSDoc explicitly says base64, type rejects Buffer |
| Adapter must call `Buffer.toString('base64')` manually | convert Buffers via `.toString('base64')` | **Yes** — no auto-base64 in the SDK |
| `MessageSendingResponse` | exists in the SDK | **Yes** — `{ To?, Cc?, Bcc?, SubmittedAt, MessageID, ErrorCode, Message }` |
| Constructor | server-token + optional options | **Yes** — `(serverToken: string, configOptions?: ClientOptions.Configuration)` |

### Minor notes for the implementing agent (not discrepancies — refinements):
1. `Message` is a TS **class** with a constructor; an object literal works due to structural typing, but if the adapter wants the strictest path it can `new Message(From, Subject, HtmlBody, ...)` — the constructor positional order is `From, Subject, HtmlBody, TextBody, To, Cc, Bcc, ReplyTo, Tag, TrackOpens, TrackLinks, Headers, Attachments, Metadata` (NOT a great order for long signatures — prefer the literal form).
2. `ClientOptions.Configuration` exposes a `fetch?: FetchImplementation` field — if Bun's built-in fetch has issues with corporate proxies, the adapter can inject a custom fetch. Relevant for Bun/proxy compatibility.
3. The `\*` Splatting Note: `TrackLinks` is an **enum** `LinkTrackingOptions` (not a raw string) — `None | TextOnly | HtmlOnly | HtmlAndText`. Use the enum, not a literal string, for type safety.
4. Postmark returns HTTP 200 with `ErrorCode !== 0` for soft failures (rate-limit, invalid address) — the adapter must check `response.ErrorCode === 0`, not just `await sendEmail(...)` resolving.
5. `ContentID` accepts `null` — pass `null` (or omit) for regular attachments, pass `"cid:<value>"` for inline images referenced by `<img src="cid:...">` — 
6. Old Postmark doc URL (`/developer/supported-languages/nodejs`) is dead (404); the live equivalent is `/developer/user-guide/send-email-with-api/send-a-single-email`. No code impact.
