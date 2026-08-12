# Collisions Registry — Cases Where `export { }` Must Be Used Instead of `export *`

This file tracks ALL cases where `export *` cannot be used in `index.ts` because it would cause a naming collision. In these cases, named re-exports (`export { A, B } from "./file"`) are the ONLY allowed exception to the `export *` rule.

**Rule:** If `export *` causes a collision (two source files exporting the same symbol name), use named re-exports to disambiguate. Otherwise, ALWAYS use `export *`.

---

## Entry 1: `backend/services/communication/channels/whatsapp/cloud-api/requests/index.ts`

**Date:** 2026-08-12
**Reason:** All 4 `*.request.ts` files export functions named `buildRequest` and `parseResponse` — `export *` causes `TS2308: Module has already exported a member named 'buildRequest'/'parseResponse'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { buildRequest as buildGetPhoneNumberRequest, parseResponse as parseGetPhoneNumberResponse } from "./get-phone-number.request";
export { buildRequest as buildListMessageTemplatesRequest, parseResponse as parseListMessageTemplatesResponse, collectAllTemplates } from "./list-message-templates.request";
export { buildRequest as buildListPhoneNumbersRequest, parseResponse as parseListPhoneNumbersResponse, collectAllPhoneNumbers } from "./list-phone-numbers.request";
export { buildRequest as buildSendTemplateMessageRequest, parseResponse as parseSendTemplateMessageResponse } from "./send-template-message.request";
```
**Note:** Also need to update all consumers that import `buildRequest`/`parseResponse` from this barrel to use the aliased names.

---

<!-- Future entries will be added here as subagents encounter collisions -->
