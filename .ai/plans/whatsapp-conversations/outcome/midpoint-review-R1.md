# Mid-point Review R1 — resolutions (`whatsapp-conversations.service.ts`)

Date: 2026-09-11.

Scope: backend service findings from the mid-point review of the
`whatsapp-conversations` plan. Files changed:

- `backend/services/whatsapp/whatsapp-conversations.service.ts`
- `backend/services/whatsapp/test/whatsapp-conversations.service.test.ts` (extended)

## Resolutions

### M1 — Send persistence non-transactional (MEDIUM) — FIXED

`sendMessage` now opens one `db.transaction` (or uses the caller's `tx`) for the
post-send write block: conversation `upsertByIdentity` + message
`upsertByWamid` + `touchLastMessage` + audit insert all commit atomically
(`persistSend` runner/handle). The Meta HTTP call completes before the
transaction opens — no tx is held across the external call.

Same treatment for `verifyRecipient`: the `hello_world` Graph API call happens
before any transaction opens; `recordVerify` + audit commit atomically in one
tx (`recordVerdict` runner/handle).

### M2 — TOCTOU on the 5-recipient cap (MEDIUM) — FIXED

`addRecipient` runs the cap check + insert + audit inside one
`db.transaction`, serialized by an account-scoped advisory lock
(`acquireAdvisoryLock(t, \`whatsapp-recipient-cap:${account.id}\`)`) taken
before `countByAccountId`. Mirrors the existing advisory-lock style
(`backend/db/repo/shared/advisory-lock.ts`, payroll/expense services). When a
caller supplies its own `tx`, no advisory lock is acquired (ABBA deadlock rule
— caller may already hold locks).

### M3 — `dispatchSend` translates only GraphApiError (MEDIUM) — FIXED

The request builders now run inside the `try` alongside the fetch. Error
mapping:

- Meta 131030 (`GraphApiError`) → `WHATSAPP_RECIPIENT_NOT_ALLOWED` /
  `whatsappRecipientNotAllowedFromMeta`
- Any other failure — other `GraphApiError`s, request-builder validation
  errors, network/timeout — → `WHATSAPP_CONVERSATION_SEND_FAILED` /
  `whatsappConversationSendFailed` (existing 2.7 keys; no new locale keys)
- Already-localized `DomainError`s (e.g. missing-access-token config error)
  propagate unchanged.

### L1 — Inbox-delegate view-gate drift (LOW) — FIXED

`listConversations` / `listConversationMessages` now assert
`WHATSAPP_CONVERSATIONS_VIEW` at the conversations service before delegating;
the inbox delegate's own inbox view gate stays as defense-in-depth (identical
grant sets → no observable change). JSDoc updated to document the dual gate.

### L2 — Thread double-fetch ordering (LOW) — MITIGATED (no schema change)

`getConversationThread` now loads the conversation row first and throws
`NotFoundError` before fetching messages — an unknown id short-circuits without
the message query. PotHos schema untouched. The conversation read is a
plain-row read, so the joined `accountPurpose` is not resolved on the thread
envelope (it is only populated on the inbox list's account join) — recorded
here as a known limitation; if the thread UI needs the purpose, resolve it via
a joined read in a follow-up.

### L3 — `listConversationMessages` wrapper (LOW) — kept by design, no change.

### L4 — `VERIFY_TEMPLATE_LANGUAGE` vs send default language (LOW) — FIXED

Dedicated `DEFAULT_TEMPLATE_LANGUAGE` constant for composer sends (template
message default when the caller omits `templateLanguage`);
`VERIFY_TEMPLATE_NAME`/`VERIFY_TEMPLATE_LANGUAGE` remain verify-flow-only, so
changing the send default no longer silently changes the verify flow (or vice
versa).

## Verification

- `bun run test/scripts/run-test.ts backend/services/whatsapp/test/whatsapp-conversations.service.test.ts`
  → 34 pass / 0 fail (was 23; +11 covering: tx-after-fetch ordering +
  tx participation, builder-validation → send-failed, timeout → send-failed,
  advisory-lock-before-count ordering, atomic cap rejection, per-path view
  gates, thread happy path + early NotFound).
- `bun run test/scripts/run-test.ts backend/db/test/repo/whatsapp/whatsapp-test-recipient.repo.test.ts`
  → 11 pass / 0 fail (cap/container repo contract unchanged).
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → exit 0 for
  both `whatsapp-conversations.service.ts` and its test.
- `bun tsgo` → 0 errors repo-wide.

## Notes

- No new i18n keys; all errors reuse the final keys from outcome 2.7.
- No schema, PotHos, or frontend documents touched.
- Test harness now mocks `@/backend/db/drizzleDb` (transaction runner with an
  invocation-order trace + tx sentinel) and `@/backend/db/repo/shared`
  (`acquireAdvisoryLock` recorder) — merged with the real modules so other
  consumers keep their exports.
