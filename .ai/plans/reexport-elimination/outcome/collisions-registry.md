# Collisions Registry — Cases Where `export { }` Must Be Used Instead of `export *`

This file tracks ALL cases where `export *` cannot be used in `index.ts` because it would cause a naming collision. In these cases, named re-exports (`export { A, B } from "./file"`) are the ONLY allowed exception to the `export *` rule.

**Rule:** If `export *` causes a collision (two source files exporting the same symbol name), use named re-exports to disambiguate. Otherwise, ALWAYS use `export *`.

---

## Entry 1: `backend/services/communication/channels/whatsapp/cloud-api/requests/index.ts`

**Date:** 2026-08-12
**Reason:** All 4 `*.request.ts` files exported functions named `buildRequest` and `parseResponse` — `export *` causes `TS2308: Module has already exported a member named 'buildRequest'/'parseResponse'`.
**Resolution (2026-08-12):** RESOLVED by renaming functions in source files to unique descriptive names:
- `get-phone-number.request.ts`: `buildRequest` → `buildGetPhoneNumberRequest`, `parseResponse` → `parseGetPhoneNumberResponse`
- `list-message-templates.request.ts`: `buildRequest` → `buildListMessageTemplatesRequest`, `parseResponse` → `parseListMessageTemplatesResponse`
- `list-phone-numbers.request.ts`: `buildRequest` → `buildListPhoneNumbersRequest`, `parseResponse` → `parseListPhoneNumbersResponse`
- `send-template-message.request.ts`: `buildRequest` → `buildSendTemplateMessageRequest`, `parseResponse` → `parseSendTemplateResponse`

The `requests/index.ts` barrel now uses `export *` exclusively — no named re-exports or aliasing needed.

---

## Entry 2: `backend/db/seeds/billing/index.ts`

**Date:** 2026-08-12
**Reason:** All 14 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetSupportedCurrencies } from "./seed-currencies";
export { seedOrGet as seedOrGetCurrencyExchangeAuditLogs } from "./seed-currency-exchange-audit-logs";
// ... (12 more)
```

---

## Entry 3: `backend/db/seeds/books/index.ts`

**Date:** 2026-08-12
**Reason:** `seed-books.ts` exports `seedOrGet`. While only one file, converting to `export *` would export as `seedOrGet` (not the aliased `seedOrGetBooks`). If more seeder files are added to this directory, collision would occur.
**Fix:** Use named re-export with alias:
```ts
export { seedOrGet as seedOrGetBooks } from "./seed-books";
```

---

## Entry 4: `backend/db/seeds/classes/index.ts`

**Date:** 2026-08-12
**Reason:** All 13 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetClassCategories } from "./seed-class-categories";
export { seedOrGet as seedOrGetClassCommunications } from "./seed-class-communications";
// ... (11 more)
```

---

## Entry 5: `backend/db/seeds/complaints/index.ts`

**Date:** 2026-08-12
**Reason:** Both `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetComplaintResponses } from "./seed-complaint-responses";
export { seedOrGet as seedOrGetComplaints } from "./seed-complaints";
```

---

## Entry 6: `frontend/common/components/ui/badge/index.ts`

**Date:** 2026-08-12
**Reason:** `StatusBadge.tsx` re-exports `StatusBadgeCategory` via `export type { }`, and `StatusBadgeShared.tsx` re-exports `StatusBadgeCategory`, `StatusBadgeSharedProps`, `StatusBadgeSlotProps`, `StatusPaletteKey` via `export type { }`. These collide with the explicit `export type { } from "./types/statusBadgeShared.types"` line. Using `export *` for `StatusBadge.tsx` or `StatusBadgeShared.tsx` would cause `TS2308` type-only re-export collisions.
**Fix:** Keep named re-exports for `StatusBadge` and `StatusBadgeShared` (the function/class exports only). Converted `statusBadgeShared.utils.ts` to `export *` (no collision — only exports `getStatusColors` and `resolveStatusPaletteKey` consts). Kept `export type { } from "./types/statusBadgeShared.types"` as-is.


