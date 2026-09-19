# Mailgun Adapter API Verification (mailgun.js@13.3.0 + form-data@4.0.6)

API verification of the mailgun.js send-email surface.

## 1. Confirmed versions

| Package | Declared in repo `package.json` | Installed |
|---|---|---|
| `mailgun.js` | `"mailgun.js": "^13.3.0"` | `13.3.0` (`node_modules/mailgun.js/package.json`) |
| `form-data` | `"form-data": "^4.0.6"` | `4.0.6` (`node_modules/form-data/package.json`) |

`mailgun.js` package.json `dependencies`: `axios@^1.15.0`, `base-64@^1.0.0`,
`url-join@^4.0.1`. **`form-data` is NOT a `dependencies` entry** — it is an
_app-supplied_ FormData implementor injected through the `Mailgun` constructor
(see §2). This matches repo `package.json` installing `form-data` directly.

Entry points (`node_modules/mailgun.js/package.json`):
- `exports["."].node.import` → `./ESM/mailgun.node.js`
- `exports["."].node.require` → `./CJS/mailgun.node.cjs`
- `exports["."].default.types` → `./Types/index.d.ts`
- Engine: `node >= 18.0.0`
- `"type": "module"`

## 2. `Mailgun` class export kind

File: `node_modules/mailgun.js/Types/index.d.ts`

```ts
import { IMailgunClient } from './Interfaces/MailgunClient/index.js';
import { InputFormData, MailgunClientOptions } from './Types/index.js';
export default class Mailgun {
    static get default(): typeof Mailgun;
    private formData;
    constructor(FormData: InputFormData);
    client(options: MailgunClientOptions): IMailgunClient;
}
```

- **Default export**, named `Mailgun`. Also exposes `Mailgun.default` static
  getter (so `require('mailgun.js')` works). No named export `Mailgun`.
- **Constructor**: `new Mailgun(FormData)` — takes the FormData _constructor_
  itself (e.g. `new Mailgun(require('form-data'))`), not options. The
  Mailgun client options go to `.client(...)`.

`MailgunClientOptions` — `node_modules/mailgun.js/Types/Types/MailgunClient/MailgunClientOptions.d.ts`:

```ts
export type MailgunClientOptions = {
    username: string;       // 'api'
    key: string;            // API key
    url?: string;           // e.g. 'https://api.eu.mailgun.net'
    public_key?: string;
    timeout?: number;
    proxy?: ClientProxyConfig;
    useFetch?: boolean;
};
```

A `new Mailgun(opts)` constructor shape with
`opts` including `apiKey` / `url`/`host` / `publicApiKey` is wrong for v13. The actual v13
shape is two-stage: `new Mailgun(FormData)` then `mg.client({ username, key, url, public_key })`.

## 3. `messages.create(...)` signature (NOT `.send`)

File: `node_modules/mailgun.js/Types/Interfaces/Messages/IMessagesClient.d.ts`

```ts
export interface IMessagesClient {
    create(domain: string, data: MailgunMessageData): Promise<MessagesSendResult>;
}
```

Implementing class — `node_modules/mailgun.js/Types/Classes/Messages.d.ts`:

```ts
create(domain: string, data: MailgunMessageData): Promise<MessagesSendResult>;
```

There is **no `.send()` method in v13 typings** — the older `messages().send()`
API was renamed to `messages.create(domain, data)`. Every README example also
uses `mg.messages.create(domain, params)`. The older
`.send(...)` fallback does NOT exist in v13 and should not be used.

`MailgunClient` (the object returned by `.client(...)`) exposes `messages`
directly as a property of type `IMessagesClient` — so the call is
`mg.messages.create(domain, data)`, not `mg.messages().create(...)`.
(`node_modules/mailgun.js/Types/Classes/MailgunClient.d.ts:11` —
`messages: IMessagesClient;`)

## 4. `MailgunMessageData` — attachment + inline field shapes

File: `node_modules/mailgun.js/Types/Types/Messages/Messages.d.ts`

```ts
export type MailgunMessageData = MailgunMessageContent & {
    from?: string;
    to?: string | string[];
    cc?, bcc?: string | string[];
    subject?: string;
    'amp-html'?: string;
    attachment?: MessageAttachment;
    inline?: any;                       // <-- TOP-LEVEL field, typed `any`
    't:version'?, 't:text'?, 't:variables'?: ...
    'o:tag'?, 'o:dkim'?, 'o:deliverytime'?, ...
    'recipient-variables'?: string;
    'h:X-My-Header'?: string;
    'v:my-var'?: string;
    [key: string]: FormDataInputValue;
};
```

Supporting types (same file):

```ts
export type MimeMessage = string | Blob | Buffer | NodeJS.ReadableStream;
export type CustomFileData = string | Blob | File | Buffer | NodeJS.ReadableStream;
export type CustomFile = {
    data: CustomFileData;
    filename?: string;
    contentType?: string;
    knownLength?: number;
    [key: string]: unknown;
};
export type MessageAttachment =
    | CustomFile | CustomFile[]
    | File | File[]
    | string | CustomFileData | CustomFileData[];
```

Findings:
- **`attachment`** is a TOP-LEVEL field on `MailgunMessageData`. Accepts a single
  `CustomFile`, an array, a raw Buffer, a string path, or `CustomFile[]`. The
  cleanest typed shape for a Buffer attachment is
  `{ data: Buffer, filename: string, contentType?: string }` (a `CustomFile`).
  There is **no per-attachment `contentId`** — `CustomFile` has no `contentId` field.
- **`inline`** is a TOP-LEVEL field (confirmed: `inline?: any;` on
  `MailgunMessageData`, sibling to `attachment`). It is intentionally typed as
  `any` (not strongly typed), but the README clearly documents it as the
  channel for inline images. Confirmed: `inline` is a top-level field, not per-attachment.
- `Content-ID` derivation from filename: no `.d.ts` directly models this, but
  the canonical README example (`node_modules/mailgun.js/README.md` lines
  ~543–564 and identical text at
  https://github.com/mailgun/mailgun.js/blob/master/docs/README.md) shows:

  ```js
  const file = { filename: 'test.jpg', data };
  messageParams.inline = file;
  // html uses src="cid:test.jpg"  <-- CID == filename
  ```

  The `cid:` value used in `src` exactly matches the file's `filename`. There
  is no way to specify an explicit `Content-ID` through the public v13 typings
  — the SDK relies on Mailgun's server deriving `Content-ID` from the filename
  posted for the `inline` form field. The `'content-id-map'` field on
  `StoredEmailResponse` (Messages.d.ts line 227) is server-output only.
  → VERIFIED via README example + absence of any explicit `contentId` input
  field in the typings.

## 5. `form-data@4.0.6` API

File: `node_modules/form-data/package.json` — `main: ./lib/form_data`,
`typings: ./index.d.ts`.

File: `node_modules/form-data/index.d.ts`

```ts
export = FormData;
declare class FormData extends stream.Readable {
    constructor(options?: Options);
    append(key: string, value: any, options?: FormData.AppendOptions | string): void;
    getHeaders(userHeaders?: FormData.Headers): FormData.Headers;
    submit(...): http.ClientRequest;
    getBuffer(): Buffer;
    setBoundary(boundary: string): void;
    getBoundary(): string;
    getLength(callback): void;
    getLengthSync(): number;
    hasKnownLength(): boolean;
}

declare namespace FormData {
  interface AppendOptions {
    header?: string | Headers;     // per-part headers (e.g. Content-Disposition override)
    knownLength?: number;
    filename?: string;             // filename for a Buffer part
    filepath?: string;
    contentType?: string;          // MIME type for the part
  }
}
```

Findings:
- `FormData` is exported via `export = FormData` (CommonJS-style default).
  In ESM: `import FormData from 'form-data'`. In CJS: `require('form-data')`.
- `.append(key, value, options?)` — third argument is either an
  `AppendOptions` object or a bare `string` (interpreted as filename in the
  string overload). `.append(field, value, options)` with `{ filename, contentType }`: VERIFIED
  (those two keys exist in `AppendOptions`; the shape also includes optional
  `header` for full MIME-header control and `knownLength` / `filepath`).

## 6. Cross-references (online)

- https://www.npmjs.com/package/mailgun.js — README confirms
  `mg.messages.create('domain', {...})` and inline/attachment examples
  identical to the installed copy.
- https://github.com/mailgun/mailgun.js/blob/master/docs/README.md — identical
  inline-image example; `cid:test.jpg` referenced in HTML matches
  `filename: 'test.jpg'`.
- https://documentation.mailgun.com/docs/mailgun/sdk/nodejs_sdk.md — official
  docs still show `mg.messages.create(...)`, and confirm FormData must be
  injected via `new Mailgun(formData)`.

## 7. Verdict: NEEDS UPDATE

The overall picture (top-level `inline` field, `Content-ID` from filename, per-attachment `contentId` absent, FormData-wrapped Buffer attachments) is **substantively correct**, but four specific API-shape details need correction to match v13 typings:

1. **Constructor is two-stage, not one**: `new Mailgun(FormData)` injects the
   form-data library, then `mg.client({ username, key, url, public_key })`
   produces the messages client. Client options keys are
   `username: "api"`, `key`, `url`, `public_key` (no `apiKey` / `host` /
   `publicApiKey` keys exist — see `MailgunClientOptions.d.ts`).
2. **Method is `.create(domain, data)`**, NOT `.send(...)`. The v13 typings
   expose only `IMessagesClient.create` — there is no `.send(...)`.
3. **Property access, not function call**: `mg.messages.create(...)` —
   `messages` is a client property (`IMessagesClient`), not a factory `messages()`
   returning a client. The historical `mg.messages().send(...)` pattern from
   v2 is gone.
4. **`inline` typed as `any`**: confirmed top-level sibling of `attachment` on
   `MailgunMessageData` (so the adapter must cast to satisfy strict TS), and
   the recommended attachment shape for Buffers is `CustomFile` =
   `{ data: Buffer, filename: string, contentType?: string }` — an
   `EmailAttachment { content, filename, contentType, contentId, encoding }`
   type should be mapped by the Mailgun adapter to `{ data: content,
   filename, contentType }` for both `attachment` and `inline`, discarding
   `contentId` (passed through Mailgun, not exposed by the SDK) and `encoding`.

`form-data@4.0.6` claims are fully VERIFIED (FormData class default export,
`.append(field, value, { filename, contentType })` signature present at
`node_modules/form-data/index.d.ts:32,52-56`).
