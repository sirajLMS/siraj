# Phase 2 — Backend Types (`backend/types/whatsapp/`)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 2.1–2.6, 2.QL, 2.TE, 2.SEC, 2.SR, 2.IV

## Summary

All Phase 2 type files are in place. Every entity type is derived from Drizzle
`$inferSelect`/`$inferInsert` (never hand-rolled); enum columns (which infer as
plain `string` because `createPgEnumFromEnum` erases literal types) are
re-applied with proper enum typing on the ReturnTypes per the canonical
pattern. Phase 3 (repos) and Phases 5/7/9 (services/handler/GraphQL) can import
everything from `@/backend/types`.

## Files created

| File | Task | Contents |
|---|---|---|
| `backend/types/whatsapp/whatsapp-inbox.types.ts` | 2.1 | `WhatsappConversation{Select,Insert,Return}Type`, `WhatsappMessage{Select,Insert,Return}Type` (direction enum re-applied, `content: Record<string, unknown>`), `WhatsappContact{Select,Insert,Return}Type` (ReturnType omits internal `removedAt`/`lastActionAt` LWW bookkeeping), pagination inputs `WhatsappConversationsListInput` / `WhatsappConversationMessagesInput` |
| `backend/types/whatsapp/whatsapp-sync.types.ts` | 2.2 | `WhatsappSyncRequest{Select,Insert,Return}Type` (syncType/status enums re-applied), `WhatsappAccountSyncOverview` (account-level sync view for the `whatsappSyncStatus` resolver in Phase 9) |
| `backend/types/whatsapp/whatsapp-webhook-event.types.ts` | 2.2 | `WhatsappWebhookEvent{Select,Insert,Return}Type` (status enum re-applied, `payload: Record<string, unknown>`), `WhatsappWebhookEventField` union of the ten known `change.field` values |

## Files modified

| File | Task | Change |
|---|---|---|
| `backend/types/whatsapp/whatsapp-account.types.ts` | 2.3 | `WhatsappAccountReturnType` re-applies `purpose`/`onboardingMode`/`syncStatus` as enums; `WhatsappAccountSubmitInput` keeps `purpose`/`onboardingMode` client-selectable (enum-typed) but excludes server-managed sync-tracking columns (`syncStatus`/`syncPhase`/`syncProgress`/`syncDeadlineAt`/`syncFailureReason`/`offboardedAt`); `WhatsappAccountUpdateInput` retains all sync-tracking columns for the sync service/webhook handler with enum re-application on the three enum columns |
| `backend/types/whatsapp/whatsapp-channel.types.ts` | 2.4 | `WhatsappPayload` gains optional `senderAccountId?: string \| null` (dispatch attribution) and `purpose?: WhatsappAccountPurpose \| null` (observability) — both optional so v1 dispatch paths keep compiling |
| `backend/types/whatsapp/whatsapp-webhook.types.ts` | 2.5 | Exported `WebhookError` (extended with `error_data.details` so Phase 7 can read the 2593109 decline detail); added typed payload shapes mirroring `docs-research-coexistence.md` §3: `WebhookHistory*` (chunk metadata phase/chunk_order/progress, thread context with BSUID triple, media follow-up `messages`/`message_echoes`, nested `errors` decline), `WebhookAppStateSync*` (contact LWW with `metadata.timestamp`, `add`/`remove`), `WebhookMessageEcho*` (revoke/edit markers), `WebhookAccountUpdateValueType` + event/disconnection-reason/ban-state unions, tolerant `WebhookBusinessCapabilityUpdateValueType` (string\|number tier, legacy `max_daily_conversation_per_phone`, conditionally-absent caps), and the discriminated `WebhookTypedChangeType` union for the Phase 7 dispatcher |
| `backend/types/whatsapp/index.ts` | 2.6 | Barrel: `export *` from the three new modules (all `./`, one slash, no imports) |
| `backend/lib/whatsapp-coercion.ts` | 2.3 fallout | My ReturnType change made `buildReturnType`'s spread of raw string enum columns no longer assignable. Added `isValidAccountPurpose`/`isValidOnboardingMode`/`isValidSyncStatus` type guards (same pattern as the existing `isValidQualityRating`) plus internal coercers (fallbacks: GENERAL/CLOUD_API/NOT_STARTED), applied inside `buildReturnType`. Signature unchanged — no call-site edits needed. Same-directory-domain fallout repair, mirroring Phase 1's precedent of fixing files its own change broke |

## Files NOT modified (and why)

- `whatsapp-cloud-api.types.ts` — Phase 4/6 task surface (request builder types for `smb_app_data`); Phase 2 scope excluded it. Phase 6.1 should add `RequestSmbAppData*` types there.
- `backend/db/repo/whatsapp/*` — Phase 3 scope.
- `frontend/**` (generated GraphQL types) — Phase 9 owns codegen regen.

## Verification (2.QL + 2.TE)

Sub-loop `--lifecycle codescene` exit 0 for every touched file:
`whatsapp-inbox.types.ts`, `whatsapp-sync.types.ts`, `whatsapp-webhook-event.types.ts`,
`whatsapp-account.types.ts`, `whatsapp-channel.types.ts`, `whatsapp-webhook.types.ts`,
`whatsapp/index.ts`, `backend/lib/whatsapp-coercion.ts`.

Fixes driven by the loop during this phase:
1. `sonarjs/redundant-type-aliases` on a pure `WhatsappContactReturnType = WhatsappContactSelectType` alias → replaced with a genuine transformation (omits the internal LWW bookkeeping columns).
2. oxlint `typescript(no-unsafe-type-assertion)` on enum coercers → converted to the file's existing type-guard pattern (no casts).

2.TE (type-only): full `bun tsgo` → **11 errors, all foreign** and byte-identical in file/count to the Phase 1 outcome (9 carryover/payroll baseline + 2 classDetails). Zero whatsapp-domain errors. Sanity suites re-run (all green): `whatsapp-channel.test.ts` 13/13, `whatsapp-webhook.handler.test.ts` 43/43, `whatsapp-v2-schema.test.ts` 9/9.

## 2.SEC review

- Encrypted credential columns stay omitted from `WhatsappAccountReturnType`; nothing new surfaces secrets.
- `WhatsappConversationMessagesInput.conversationId` JSDoc carries the IDOR mandate: the service MUST verify the conversation belongs to an account of the caller's tenant before returning messages.
- Client-facing submit inputs exclude all server-managed sync/lifecycle columns — clients cannot pre-seed `syncStatus: COMPLETE` or an `offboardedAt`.
- Webhook payload types are parse-side shapes only; no raw-payload logging introduced.

## 2.SR review

- No `...input` spreads introduced; no client-supplied ID is trusted without an ownership note; enums are value-imported (`backend/enum/whatsapp/*`); no new env-config keys; no module-level mutable state; no new replay/idempotency gap discovered → nothing appended to `deferred-items.md`.

## 2.IV instruction verification

Read + complied: root `AGENTS.md`, `backend/AGENTS.md`, `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `.agents/instructions/backend.instructions.md`, plus sub-loop printed instruction pointers. Enforced: canonical `{Entity}{Select,Insert,Return}Type` naming from `$infer*`; barrel `export *`-only with `./` paths; no plan tags in comments/JSDoc.

## Carry-forward knowledge for Phases 3/7/9

1. **`createPgEnumFromEnum` erases literal types** — every enum column infers `string`. Repos mapping rows to any ReturnType must coerce via guards; for accounts that is `buildReturnType` in `backend/lib/whatsapp-coercion.ts` (now covering purpose/onboardingMode/syncStatus). Phase 3 repos for the inbox/sync/event tables will need the same coercion step for `direction`, `status`, `syncType` (add guards alongside the new ones if the maps get mechanical).
2. **Insert inputs are string-typed for enum columns** — pass enum members (value imports) at call sites; tsgo accepts because enum members are strings.
3. **`WebhookBaseMessageType`** is the shared core of history messages and echoes (`to*`/`from*` BSUID fields, wamid `id`, catch-all content key) — extend it rather than redefining fields if Meta adds another message-carrying field.
4. **`WebhookTypedChangeType`** is the dispatch union for Phase 7's worker; fields outside the union stay `WebhookChangeType`.
5. **`WhatsappAccountSyncOverview`** is the read shape Phase 6's `getSyncStatus` should return and Phase 9's `whatsappSyncStatus` resolver should expose.
6. **`WhatsappWebhookEventField`** covers all ten known `change.field` values; keep unknown fields falling through to generic handling (do NOT reject).
7. Phase 6.1's `smb_app_data` request/response builder types belong in `whatsapp-cloud-api.types.ts` alongside the other Graph API request types (kept out of this phase deliberately).

## Cross-file dependencies

None outstanding — the one cross-file need (`buildReturnType` in
`backend/lib/whatsapp-coercion.ts`) was whatsapp-domain fallout of this
phase's own type change and was fixed in this wave (documented above, sub-loop
green).
