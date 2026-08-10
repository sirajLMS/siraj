# 07 — Resend API Verification (resend@6.18.1)

Verified against `node_modules/resend@6.18.1` (installed in repo) + Resend online docs.

## 1. Package metadata — `/home/ahmed/Projects/siraj-mail/node_modules/resend/package.json`

- **version**: `"version": "6.18.1"` (line 4)
- **engines**: `"node": ">=20"` (line 10)
- **entry points**:
  - `"main": "./dist/index.cjs"` (line 5) — CJS
  - `"module": "./dist/index.mjs"` (line 6) — ESM
  - `"types": "./dist/index.d.mts"` (line 7) — primary types
  - `"exports"` (lines 16–25): `.` → `import` `./dist/index.mjs` (+ `./dist/index.d.mts` types), `require` `./dist/index.cjs` (+ `./dist/index.d.cts` types). No subpath exports — package is flat.
- **dependencies**: `postal-mime@2.7.5`, `standardwebhooks@1.0.0` (lines 34–37). No transitive runtime dep on React Email.

### `@react-email/render` as optional peer — VERIFIED

`package.json` lines 44–52:
```json
  "peerDependencies": {
    "@react-email/render": "*"
  },
  "peerDependenciesMeta": {
    "@react-email/render": {
      "optional": true
    }
  },
```
- `@react-email/render` IS listed under `peerDependencies` with range `"*"`.
- It IS marked **optional** under `peerDependenciesMeta` (`"optional": true`).
- `react-email` itself is NOT a peer (only `@react-email/render`). Research file 11's claim is **VERIFIED**.

## 2. Root types — `node_modules/resend/dist/index.d.mts` (2453 lines)

### Default vs named export

- `Resend` class declared at `dist/index.d.mts:2419` (`declare class Resend { ... }`).
- The ONLY export statement is the flat named-export list at `dist/index.d.mts:2454`:
  `export { ... Resend ..., type ResendOptions, type Response, ... };`
- **There is NO `export default Resend` anywhere** in the file.
- **VERDICT: `Resend` is a NAMED EXPORT, not a default export.**
- The existing repo adapter already imports it correctly: `import { Resend } from "resend";` (`ResendEmailAdapter.ts:1`).
- **PLAN CLAIM "`Resend` class default export" is INCORRECT.** Correction: `import { Resend } from "resend"` (named). A default import would fail at type-check time.

### Constructor signature — `dist/index.d.mts:2440`

```ts
constructor(key?: string | undefined, options?: ResendOptions);
```
where `ResendOptions` (`dist/index.d.mts:2416–2419`):
```ts
interface ResendOptions {
  baseUrl?: string;
  userAgent?: string;
}
```
So `new Resend(apiKey, options?)` — matches existing adapter `new Resend(apiKey)` at `ResendEmailAdapter.ts:77`.

### `resend.emails.send(params)` — `dist/index.d.mts:1793`

```ts
declare class Emails {
  private readonly resend;
  readonly attachments: Attachments$1;
  readonly receiving: Receiving;
  constructor(resend: Resend);
  send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
  create(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
  get(id: string): Promise<GetEmailResponse>;
  ...
}
```
- `send` accepts `CreateEmailOptions` (NOT a type named `SendParams` — see verdict below).
- `options?` is `CreateEmailRequestOptions extends PostOptions, IdempotentRequest` — supports `idempotencyKey` (`dist/index.d.mts:174–180`).
- Returns `Promise<CreateEmailResponse>` where `CreateEmailResponse = Response<CreateEmailResponseSuccess>` and `CreateEmailResponseSuccess = { id: string }` (`dist/index.d.mts:601–604`).
- Existing adapter reads `response.data?.id` and `response.error` (`ResendEmailAdapter.ts:146,150`) — matches `Response<T>` shape (success `data`, failure `error`).

## 3. `SendParams` field shape

### No `Emails.SendParams` type in the Node.js SDK

The plan/research references an `Emails.SendParams` type. **In `resend@6.18.1`'s Node.js types there is NO `SendParams` name.** `Emails` is a class (not a namespace) at `dist/index.d.mts:1788`, and `send` takes `CreateEmailOptions`.

`SendParams` is the *Python SDK's* named type (per online docs `resend.Emails.SendParams`), and the online docs' Node snippet uses a plain object literal `resend.emails.send({ from, to, subject, html })`. The `SendParams` symbol does NOT exist in the TS `.d.ts`.

**Correction for the plan**: rename "`Emails.SendParams`" → "`CreateEmailOptions`" (the actual TS type the Node SDK's `send` accepts).

### `CreateEmailOptions` full field list — `dist/index.d.mts:592–598`

```ts
type CreateEmailOptions =
  | ((RequireAtLeastOne<EmailRenderOptions$1> & CreateEmailBaseOptions) & { template?: never })
  | ((EmailTemplateOptions & CreateEmailBaseOptionsWithTemplate) & { react?: never; html?: never; text?: never });
```
Discriminated union: either `(react | html | text)` mutually required-at-least-one with base options, OR `template` with the template base variant (which forbids `react`/`html`/`text`).

#### `CreateEmailBaseOptions` — `dist/index.d.mts:523–591`
- `attachments?: Attachment[]` (line 529)
- `bcc?: string | string[]` (line 537)
- `cc?: string | string[]` (line 543)
- `from: string` (line 549) — required
- `headers?: Record<string, string>` (line 555)
- `replyTo?: string | string[]` (line 561)  — **camelCase** (online docs show `reply_to`; SDK type is camelCase)
- `subject: string` (line 567) — required
- `tags?: Tag[]` (line 573)
- `to: string | string[]` (line 579) — required
- `topicId?: string | null` (line 585)  — **camelCase**
- `scheduledAt?: string` (line 591) — **camelCase**

#### `EmailRenderOptions$1` — `dist/index.d.mts:493–511`
- `react: React.ReactNode` (line 500)
- `html: string` (line 506)
- `text: string` (line 511)
All three are present in a `RequireAtLeastOne<...>`, so exactly one (or more) of `react`/`html`/`text` must be supplied (when not using `template`).

#### `EmailTemplateOptions` — `dist/index.d.mts:513–517`
- `template: { id: string; variables?: Record<string, string | number> }`

### `attachments` field shape — `Attachment` — `dist/index.d.mts:605–617`

```ts
interface Attachment {
  /** Content of an attached file. */
  content?: string | Buffer;
  /** Name of attached file. */
  filename?: string | false | undefined;
  /** Path where the attachment file is hosted */
  path?: string;
  /** Optional content type … derived from the filename property */
  contentType?: string;
  /** Optional content ID … sent as inline attachment; reference via `cid:` prefix. */
  contentId?: string;
}
```

**Attachment field names are CAMELCASE in the SDK type:**
| Field | Plan/research claim | Actual `Attachment` (`dist/index.d.mts:605–617`) |
|-------|-------|-------|
| `filename` | `filename` | `filename?: string | false | undefined` |
| `content` | `content: string\|Buffer` | `content?: string | Buffer` (verbatim) |
| `content_type` (snake) | claimed snake_case | **`contentType` (camelCase)** at line 611 |
| `content_id` (snake) | claimed snake_case | **`contentId` (camelCase)** at line 617 |
| `inline` | plan mentions `inline` flag | **NO `inline` boolean field** on `Attachment`. Inline behaviour is implicit when `contentId` is set (per the doc comment at line 613–616 and online docs). |
| `path` | — | `path?: string` (line 607) — host a remote attachment by URL |

> The snake_case `content_type` / `content_id` names DO appear in the SDK, but on a *different* interface — `AttachmentData` (`dist/index.d.mts:22–30`), which is the **read-side** signed-URL shape returned by `GET /emails/{id}/attachments`, not the send-side `Attachment`. The send-side `Attachment` is camelCase.
>
> There is also `EmailApiAttachment` (`dist/index.d.mts:142–147`) used inside `EmailApiOptions.attachments` (`dist/index.d.mts:163`) — this one IS snake_case (`content_type?`, `content_id?`), but `EmailApiOptions` is NOT what `emails.send` accepts. `emails.send` takes `CreateEmailOptions` → `CreateEmailBaseOptions.attachments?: Attachment[]` (camelCase). Do not confuse the two.

**Online docs cross-ref**: Resend's Node.js docs code example `toCamelCase` transform (visible in the fetched `/docs/api-reference/emails/send-email` page) confirms the Node SDK uses camelCase (`from`, `to`, `subject`, `html`, `replyTo`, `scheduledAt`, `contentType`, `contentId`) while the raw HTTP body parameters are snake_case (`reply_to`, `scheduled_at`, `content_type`, `content_id`). The TS `.d.ts` matches the Node-SDK camelCase convention.

## 4. Existing repo adapter — `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts`

### Imports (lines 1–12)
- `import { Resend } from "resend";` — **named import** (line 1). Confirms named export.
- `import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";`
- `import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";`
- `import { getEnvironmentConfig } from "@/backend/lib/env";`
- `import { logger } from "@/backend/lib/logger";`
- `import type { EmailPayload, EmailSendResult, IEmailChannel } from "@/backend/services/communication/channels/email/IEmailChannel";`
- `import type { ResendEmailContext } from "@/backend/services/communication/channels/email/resend/resend.types";`
- `import { deliveryFailedMessage } from "@/backend/services/communication/utils";`

### Class signature — `ResendEmailAdapter.ts:58–80`
```ts
export class ResendEmailAdapter implements IEmailChannel {
  private readonly context: ResendEmailContext;
  constructor(opts?: ResendEmailAdapterOptions) { ... this.context = { client: new Resend(apiKey), fromEmail }; }
}
```
- Implements `IEmailChannel` (3 methods: `send`, `validateConfig`, `disconnect`).
- Constructor takes optional `ResendEmailAdapterOptions { apiKey?; fromEmail? }`; falls back to `getEnvironmentConfig()` for `resendApiKey`/`resendFromEmail` when omitted (lines 61–80). Factory path (`EmailChannelFactory.createResendAdapter`) passes explicit overrides from DB-resolved provider config.
- `ResendEmailContext` (`resend.types.ts:3–6`) = `{ readonly client: Resend; readonly fromEmail: string }`.

### `send` shape — `ResendEmailAdapter.ts:82–101, 133–154`
```ts
async send(payload: EmailPayload, _locale?: string): Promise<EmailSendResult> {
  if (!payload.to?.trim()) return this.handleEmptyRecipient(payload);
  const originalTo = payload.to.trim();
  const recipient = resolveEmailRecipientForTest(originalTo);
  if (shouldSkipRedirectedTestDuplicate(originalTo, recipient, payload.subject))
    return { success: true, providerMessageId: "test-redirect-deduped" };
  const delivery = await this.createEmailDelivery(payload);
  return this.executeSend(delivery, payload, recipient);
}

private async executeSend(delivery, payload, recipient) {
  const response = await this.context.client.emails.send({
    from: this.context.fromEmail,
    to: recipient,
    subject: payload.subject,
    html: payload.html,
  });
  if (response.error) return this.handleResendApiError(delivery.id, response.error);
  return this.handleSendSuccess(delivery.id, response.data?.id);
}
```
Mapping: `EmailPayload.{to,subject,html}` → `CreateEmailOptions.{to,subject,html}` and `fromEmail` → `from`. **NO attachments, `text`, `cc`, `bcc`, `replyTo`, `tags`, `headers`, `scheduledAt`, `idempotencyKey` are plumbed today** — these are exactly the fields the new adapters / extended `EmailPayload` must add.

### Delivery bookkeeping pattern (use as template for new adapters)
1. `NotificationRepository.createDelivery({ userId, channel: EMAIL, eventType, title: subject, body: to, metadata })` (line 123) — creates the audit row BEFORE the provider call.
2. On success: `updateDeliveryStatus({ deliveryId, status: SENT, providerMessageId })` (line 178) + `logger.info` (line 184).
3. On provider-level error (`response.error` non-null): `updateDeliveryStatus({ status: FAILED, failureReason: error.message })` (line 165).
4. On thrown exception: `handleSendException` records FAILED with `errorMessage` (line 203).
5. Returned user-facing error is the localized `deliveryFailedMessage("email")` (lines 173, 211), NOT the raw provider message — keep this pattern in SES/Postmark/Mailgun/SMTP adapters.

### Test-redirect helpers (lines 14–43)
- `RESEND_SIMULATOR_DOMAIN = "@resend.dev"` — simulator inboxes; never redirected.
- `resolveEmailRecipientForTest(to)` — in `NODE_ENV=test`, redirects non-simulator `to` → `RESEND_TEST_TO_EMAIL`.
- `redirectedTestSendKeys` Set dedupes identical redirected sends.
- These helpers are Resend-specific (simulator inbox domain), but the *dedup + redirect* concept is reusable. New adapters likely don't need a simulator-domain guard (SES/Postmark/Mailgun have their own sandbox/simulators or none).

## 5. Online docs cross-ref

- `https://resend.com/docs/api-reference/emails/send-email` (fetched): Node.js example uses `import { Resend } from 'resend'` (named), `new Resend('re_xxx')`, `resend.emails.send({ from, to, subject, html })` returning `{ data, error }`. Body parameters section documents attachments with `Content`, `Filename`, `Path`, `Content type`, `Content id` (display names from raw HTTP body). The React component `<ResendParamField>` applies `toCamelCase` for the Node.js language toggle — confirming the Node SDK surface is camelCase (`replyTo`, `scheduledAt`, `contentType`, `contentId`) vs the HTTP/cURL/Python snake_case.
- `https://resend.com/docs/dashboard/emails/attachments` (referenced in the API page): inline images use the `cid:` prefix and are sent by setting the attachment's content ID (matches the `Attachment.contentId` doc comment at `dist/index.d.mts:613–616`).
- WebSearch "resend npm 6 emails send attachments TypeScript params": top result is the resend-node README; the v6.x line dropped the dedicated `@react-email/render` re-export and converged on `CreateEmailOptions` as the send param shape — consistent with the `.d.ts` evidence above (no `SendParams` symbol in Node SDK).

## 6. Verdict

**NEEDS UPDATE** — the plan's two resend claims are not quite right, but the corrections are surgical:

1. **`Resend` is a NAMED export, not a default export.**
   - Evidence: `dist/index.d.mts:2454` is the only `export { ... }` and contains `Resend` as a named binding; there is no `export default` anywhere in the file.
   - Existing code already does it right: `import { Resend } from "resend";` (`ResendEmailAdapter.ts:1`).
   - **Correction for the plan**: change "`Resend` class default export" → "`Resend` class named export (`import { Resend } from 'resend'`)". New SES/Postmark/Mailgun/SMTP adapters must NOT use default imports of resend (they use their own SDKs, but if any helper re-exports resend, keep it named).

2. **The send payload type is `CreateEmailOptions`, NOT `Emails.SendParams`.**
   - Evidence: `dist/index.d.mts:1793` `send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions)`. No `SendParams` symbol exists in the Node SDK types. `Emails` is a class, not a namespace (`dist/index.d.mts:1788`).
   - `SendParams` is the **Python SDK's** type name (per the online Python code example).
   - **Correction for the plan**: every reference to "`Emails.SendParams`" → "`CreateEmailOptions`" (Node SDK) when discussing the TS adapter layer.

3. **Attachment field case — VERIFIED CAMELCASE on the send path.**
   - `Attachment` (`dist/index.d.mts:605–617`): `filename`, `content: string | Buffer`, `path`, **`contentType`** (camel), **`contentId`** (camel). NO `inline` boolean field — inline behaviour is implicit when `contentId` is set.
   - The snake_case `content_type` / `content_id` names belong ONLY to `AttachmentData` (`dist/index.d.mts:22–30`, the **read-side** signed-URL shape) and `EmailApiAttachment` (`dist/index.d.mts:142–147`, used by `EmailApiOptions`, which `send` does NOT accept). Do not copy those onto the send path.
   - **Correction for the plan**: the `EmailAttachmentInput` / `AttachmentInput` type planned for `backend/types/email/email.types.ts` (`plan.md:332–342`) already uses camelCase (`contentType`, `contentId`) — this is correct and matches the resend SDK send path. The plan prose claiming "snake_case `content_type`/`content_id`" must be updated to camelCase. Map directly: `AttachmentInput → resend Attachment` is a 1:1 field rename-free mapping.

4. **`@react-email/render` optional peer — VERIFIED.**
   - `package.json:44–52`: listed under `peerDependencies` (`"*"`) AND under `peerDependenciesMeta` with `"optional": true`. `react-email` is NOT a peer of resend. Research file 11's claim is correct.

5. **`resend.emails.send(params)` signature — VERIFIED** as `send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>` (`dist/index.d.mts:1793`). The existing `ResendEmailAdapter.executeSend` matches.

6. **Existing adapter pattern is reusable** — new SES/Postmark/Mailgun/SMTP adapters should mirror:
   - optional constructor overrides (`{ apiKey?, fromEmail? }`-equivalent) with env-config fallback,
   - private `context` holding the provider client + `fromEmail`,
   - `send(payload, locale?)` creating a `NotificationRepository.createDelivery` row first, then calling the provider, then `updateDeliveryStatus` { SENT | FAILED } with `providerMessageId` / `failureReason`,
   - returning localized `deliveryFailedMessage("email")` (NOT raw provider strings) to the caller,
   - `validateConfig()` + `disconnect()` methods per `IEmailChannel`.
   - The single delta vs. today's resend adapter: the new adapters MUST also plumb `attachments` (→ provider-native attachment shape), `text`, `cc`, `bcc`, `replyTo`, `headers`, and possibly `idempotencyKey` (resend) / `MessageId` (postmark) / custom X-headers (mailgun/smtp) from the extended `EmailPayload`.
