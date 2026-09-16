# Phase 3 — WhatsApp Repositories (`backend/db/repo/whatsapp/`)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 3.1–3.8, 3.QL, 3.TE, 3.SEC, 3.SR, 3.IV

## Summary

All six WhatsApp repositories exist with the full ingestion/dispatch surface:
conversation upsert keyed on the flexible identity triple, message upsert on the
globally-unique `wamid`, contact sync with last-writer-wins on
`metadata.timestamp`, a durable webhook-event queue with SKIP LOCKED claiming +
poison parking, and the one-shot sync-request tracker. The account repo gained
purpose-resolved credential lookups and the sync lifecycle mutators.
Enum columns (which infer as plain `string` because `createPgEnumFromEnum`
erases literal types) are re-coerced at the ReturnType boundary via new guards
in `backend/lib/whatsapp-coercion.ts` — exactly the carry-forward hook Phase 2
anticipated.

## Files created

| File | Task | Contents |
|---|---|---|
| `backend/db/repo/whatsapp/whatsapp-conversation.repository.ts` | 3.1 | `findById`, `findByIds` (DataLoader map), `findByIdentity`, `upsertByIdentity` (preselect + `ON CONFLICT` on partial unique index), `touchLastMessage` (atomic guarded rollup: `WHERE lastMessageAt IS NULL OR <= :at`), `listForInbox` (account join exposing `accountPurpose`, `lastMessageAt DESC NULLS LAST`, `queryWithPagination`), `countForInbox` |
| `backend/db/repo/whatsapp/whatsapp-message.repository.ts` | 3.2 | `upsertByWamid` (`ON CONFLICT DO UPDATE SET wamid = wamid` — semantic no-op on duplicate delivery, always returns the row), `findByWamid`, `findByWamids` batch map, `markRevoked`, `applyEdit`, `attachMedia` (flips `mediaPlaceholder` false), `hasChunk` ((accountId, phase, chunkOrder) dedupe probe), `listByConversation`/`countByConversation` (sentAt ASC NULLS LAST) |
| `backend/db/repo/whatsapp/whatsapp-contact.repository.ts` | 3.3 | `findByIdentity`, `upsertFromSyncAction` (LWW: equal/older `actionAt` returns row unchanged; remove sets `removedAt`, newer add revives; insert-conflict branch carries a `setWhere` LWW guard), `listByAccount` (`includeRemoved` option), `countByAccount` |
| `backend/db/repo/whatsapp/whatsapp-webhook-event.repository.ts` | 3.4 | `insert`, `insertBatch` (recursive 500-row chunking), `claimBatch` (`withForUpdate(..., { skipLocked: true })` + `attempts = attempts + 1`), `markProcessed`/`markFailed`, `parkExhausted` (poison park PENDING→FAILED at max attempts), `existsRecentByHash` (short-window replay probe) |
| `backend/db/repo/whatsapp/whatsapp-sync-request.repository.ts` | 3.5 | `ensure` (insert-or-return via `ON CONFLICT DO NOTHING` on `(accountId, syncType)`, returns `{ request, created }`), `findByAccountAndType`, `listByAccount`, `recordRequestId` (guarded by `requestId IS NULL` so a retried POST cannot overwrite the accepted id), `updateStatus` (stamps `completedAt` on COMPLETE/FAILED) |
| `backend/db/test/repo/whatsapp/whatsapp-conversation.repository.test.ts` | 3.TE | 13 tests |
| `backend/db/test/repo/whatsapp/whatsapp-message.repository.test.ts` | 3.TE | 10 tests |
| `backend/db/test/repo/whatsapp/whatsapp-contact.repository.test.ts` | 3.TE | 6 tests |
| `backend/db/test/repo/whatsapp/whatsapp-webhook-event.repository.test.ts` | 3.TE | 9 tests |
| `backend/db/test/repo/whatsapp/whatsapp-sync-request.repository.test.ts` | 3.TE | 4 tests |
| `backend/db/test/repo/whatsapp/whatsapp-account.repository.test.ts` | 3.TE | 10 tests (covers all pre-existing account repo methods too) |

## Files modified

| File | Task | Change |
|---|---|---|
| `backend/db/repo/whatsapp/whatsapp-account.repository.ts` | 3.6 | Added `findActiveByPurpose(purpose)` + `findActiveGeneral()` (raw SelectType for send-path credential resolution, documented as such; `findFirstActiveForCredentials` kept untouched as the legacy fallback) and sync mutators `markSyncRequested` / `markSyncProgress` / `markSyncComplete` / `markSyncFailed` / `markOffboarded` / `clearOffboarded`. Extracted shared helpers `mutateById` + `findFirstActive` to keep CodeScene clean (update/deactivate/set-credentials now route through `mutateById`). |
| `backend/db/repo/whatsapp/index.ts` | 3.7 | Barrel: `export *` for all six repos (alphabetical after the account repo) |
| `backend/lib/whatsapp-coercion.ts` | 3.TE support | New guards/coercers per Phase 2 carry-forward: `isValidMessageDirection`/`coerceMessageDirection` (fallback INBOUND), `isValidWebhookEventStatus`/`coerceWebhookEventStatus` (PENDING), `isValidSyncRequestStatus`/`coerceSyncRequestStatus` (PENDING), `isValidSyncType`/`coerceSyncType` (SMB_APP_STATE_SYNC), and `coerceJsonRecord` (narrow an `unknown` jsonb payload to a record) |
| `backend/types/whatsapp/whatsapp-inbox.types.ts` | 3.3 input | `WhatsappContactSyncInput` (accountId + identity triple + names + `action: "add"\|"remove"` + `actionAt`) |
| `backend/types/whatsapp/whatsapp-sync.types.ts` (whatsapp-sync) | 3.5 result | `WhatsappSyncRequestEnsureResult` envelope (`{ request, created }`) |

## Files NOT modified (and why)

- `backend/db/schema/**` — the schema is complete from Phase 1; repos compile against it unchanged.
- `frontend/**` — Phase 9+ scope.
- Services/handlers — Phase 4–7 scope; per instructions these repos are not consumed yet.
- `backend/db/repo/index.ts` already re-exports `./whatsapp` — no change needed.
- Existing v1 service-touching behavior: `findFirstActiveForCredentials`/`setAccessToken`/`setTwoStepPin` kept byte-equivalent in behavior (only routed through the extracted helper).

## Verification (3.QL)

Sub-loop `--lifecycle codescene` exit 0 (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene) for every touched file:

- All 6 repo files + the whatsapp barrel
- All 6 new test files
- `backend/lib/whatsapp-coercion.ts`, `backend/types/whatsapp/whatsapp-inbox.types.ts`, `backend/types/whatsapp/whatsapp-sync.types.ts`

Fixes driven by the loop:
- oxlint `no-await-in-loop` → `insertBatch` chunking rewritten as a recursive helper.
- CodeScene "Code Duplication" on the account repo (four near-identical mutation bodies) → extracted `mutateById` / `findFirstActive`.
- lint `import-x/no-duplicates`, `sonarjs/pseudo-random` (`Math.random` in test ids → `randomUUID()` digit extraction), `sonarjs/concise-regex` (`[^0-9]` → `\D`), `sonarjs/no-alphabetical-sort` (Set comparison), `no-mutating-methods` (`.sort()` → Set) in test files, and one CodeScene test duplication (two LWW scenarios compressed through a shared `applyActions` sequence helper).

## Test results (3.TE)

Per-file runs via `bun run test/scripts/run-test.ts <path>` — **52 pass / 0 fail total**
(conversation 13, message 10, contact 6, webhook-event 9, sync-request 4, account 10).

4-tier shape covered: T1 (every public repo method exercised, including bull-path
null-return cases), T2 (unicode Arabic names/content, scalar `jsonb` content
boundary, empty-batch, no-identity inputs, pagination navigation past the end),
T3 (out-of-order `lastMessageAt`, out-of-order LWW contact actions,
stale-claim requeue after simulated worker crash, duplicate-wamid redelivery),
T4/IDOR flavor (same identity on different accounts stays separate; account
scoped counts/lists; unknown ids → null). `Promise.allSettled` concurrency
probes were replaced by sequential out-of-order simulations: `runInRollback`
provides a single transaction, so cross-transaction races cannot be exercised,
and the tests deliberately verify the single-transaction behavior of the
ON CONFLICT paths instead.

**Coverage** (`bun test --coverage` over the six suites, both `--coverage` runs
via the run-test bypass env): 100% lines/functions on
`index.ts`, account, conversation, message, webhook-event repos.
Two files sit at 98.6–98.9% lines (contact repo 141 lines, one uncovered line at
the `raiseConflictLoss` invariant; sync-request repo same pattern): both are the
cross-transaction race-compensation throws ("the conflict row vanished between
ON CONFLICT and re-read") that are structurally untestable inside a single
rollback transaction and match the existing codebase precedent
(`class-instance-upsert.ts` invariant throw).

Sanity re-run of adjacent suites: `whatsapp-channel.test.ts` 13/13 pass,
`whatsapp-webhook.handler.test.ts` 43/43 pass.

## 3.SEC review

- Credential exposure: crates returning `ReturnType` strip both encrypted
  columns; only the raw `SelectType` paths (`findFirstActiveForCredentials`,
  `findActiveByPurpose`, `findActiveGeneral`) expose decrypted tokens and are
  documented service-only.
- IDOR: repos take explicit `accountId`/`conversationId` — tenancy filtering is
  the caller's duty; the IDOR mandate for thread reads is documented on
  `WhatsappConversationMessagesInput` (Phase 2) and must be enforced by the
  Phase 9 service before calling `listByConversation`.
- Webhook payloads: inserted as jsonb verbatim at rest; no logging of payloads in
  repos (route/handler sanitize concern, Phase 7).
- `whatsappWebhookEvents.attempts` increment uses `sql` snippet in `SET` — the
  only non-parameterized fragment; it interpolates a column reference, no user data.

## 3.SR review

- No client-supplied IDs trusted without the service layer verifying tenancy
  (documented in types JSDoc).
- No `...input` spreads into raw inserts; all insert paths pass typed
  `*InsertType`.
- No read-then-write-without-lock gaps: conversation/contact upserts converge on
  `ON CONFLICT` with partial index targets; message upsert uses the unique
  `wamid` constraint; sync-request one-shot guard is the unique index.
- LWW enforcement: contact `setWhere` guard + caller-performed timestamp compare.
- No new module-level mutable state; no new env-config keys (none needed —
  Phase 4 owns `WHATSAPP_GRAPH_API_VERSION` / `WHATSAPP_ES_CONFIG_ID`).
- Enums value-imported everywhere; string literals only existing as
  `change.field` segment names and conflict-target index predicates.
- No replay gap discovered → **nothing appended to `deferred-items.md`**.

## 3.IV instruction verification

Read + complied: root `AGENTS.md` (re-checked after mid-run foreign edit — the
change was an unrelated doc-link line), `backend/AGENTS.md`,
`backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`,
`.agents/instructions/backend.instructions.md`,
`.agents/instructions/tests.instructions.md`, `docs/drizzle/neon-http-client.md`
(via `queryDb(tx)` usage), `docs/graphql/dataloader-batching.md` (Map
pre-initialized batch lookups), `docs/billing/quota-system.md` pattern for
`queryWithPagination`. Enforced: `export *` barrels, no prepared-statement +
inArray combos, Neon HTTP `queryDb` on every read, tx-propagation on every repo
call in tests, no raw `bun test` for the suite runs (coverage used the sanctioned
`SIRAJ_TEST_RUNNER_OK=1` bypass/AGENTS-blessed coverage path), no
`expect(...).rejects.toThrow()` anywhere, no `any` casts, no hardcoded error
strings (the two invariant throws are technical integrity guards, not
user-facing messages).

## Carry-forward knowledge for Phases 4–9

1. **`WhatsappConversationRepository.upsertByIdentity`** does the full peer-merge:
   pass waId + BSUID together whenever the webhook carries both; the preselect OR-merge
   collapses "same peer, new identity" into the same row.
2. **`upsertByWamid` never rewrites content on duplicate deliveries** — a
   revoke-before-original stub keeps its empty content until `applyEdit`/handler
   logic fills it; the Phase 7 handler should create stubs via `upsertByWamid`
   with `mediaPlaceholder`/type markers and call `markRevoked` after.
3. **Webhoook claiming is claim-then-process-elsewhere**: `claimBatch` increments
   `attempts` but keeps status PENDING, so any worker crash is a natural requeue
   (`stale requeue` = claim stability + `parkExhausted` sweeps poison rows at N
   attempts). Phase 7's sweeper cron only needs `parkExhausted`.
4. **`existsRecentByHash`** backs the route's ~5-minute exact-replay skip —
   call it before `insertBatch`.
5. **`WhatsappSyncRequestRepository.recordRequestId` returns `null`** when the
   row already accepted a POST (`requestId IS NOT NULL`) — Phase 6 treats that
   as "already requested, do not POST again".
6. **`findActiveByPurpose` / `findActiveGeneral` return raw SelectType** (with
   decrypted token) for the Phase 4 adapter; the v1 `findFirstActiveForCredentials`
   stays untouched as the fallback until Phase 4 removes it.
7. **Insert/Select types keep string enum columns**; only the ReturnTypes are
   coerced. Tests must assert against `Whatsapp…Enum` members (done).
8. **All new repos are unused by runtime code** — first consumers land in Phase 4/6/7/9.
9. **Coverage residual**: two invariant-throw lines (contact + sync-request
   race compensation) are uncovered by design; if a future layering adds a
   second-connection test harness, cover them there.

## Cross-file dependencies

None outstanding.
