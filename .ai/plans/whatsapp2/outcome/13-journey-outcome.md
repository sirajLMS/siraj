# 13 — Cross-Actor Journey Test Outcome

- **Task**: Phase 13 (`13-journey`) of `.ai/plans/whatsapp2/`
- **Date**: 2026-09-06
- **Requirements**: J1, J2, J3 + cross-actor EARS (specs.md)

## Deliverables

| Task | Surface | State |
|---|---|---|
| 13.1 | `test/workflows/helpers/whatsapp-cast.ts` + barrel | new — admin/staff/intruder cast via `assignSystemGroup`, plus a per-run custom group granting `whatsapp.config_manage` (migrations grant it only to `super_admin`; no fake super-admin shortcut) |
| 13.2 | `test/workflows/whatsapp/coexistence-routing.test.ts` | new — 7 ordered journey tests, **7/7 pass**, re-run stable |
| 13.3 | `test/workflows/whatsapp/DIAGRAMS.md` | new — `bun run validate:mermaid` OK (one block) |

## Journey coverage (real services + real DB, committed fixtures, no rollback)

1. **J1 purpose config + routing**: admin assigns `STUDENTS`/`ADVERTISING` through
   `WhatsappAccountService.updateAccountPurpose` (real permission context via
   `PermissionsService.getUserContext`). A `CLASS_REMINDER` whatsapp payload built from
   the real `NOTIFICATION_TEMPLATE_MAP` goes through a call-through spy on
   `dispatchWithPreferences` → routed to the STUDENTS account → stubbed Graph fetch
   asserts the phone-number-id URL → `notification_deliveries` row is `SENT` with
   `metadata.senderAccountId` attribution to the students account. Spy targets the
   parent actor only.
2. **J1 ads + EC-1**: an `ADVERTISING` payload lands on the ads number; an immediate
   same-pair resend to the students number is deferred by the pair limiter
   (`sendAttempted: false`) — pair keys are per (sender, recipient); the ads send on
   the same recipient was unaffected.
3. **Offboard → fail-fast → reconnect**: `account_update` rows persisted through the
   route-internal `persistWebhookChanges` and drained by
   `WhatsappWebhookHandler.processPendingWebhookEvents` — offboard deactivates +
   stamps `offboardedAt` + evicts the adapter; purpose resolution no longer returns
   the number; a direct channel send fails fast with `whatsapp.accountOffboarded`
   and zero Graph calls; `ACCOUNT_RECONNECTED` re-arms the number and routing resolves it again.
4. **J2 onboarding sync**: `enqueuePostOnboardingSync` POSTs both `smb_app_data`
   sync types (request ids recorded, `REQUESTED` + 24h deadline stamped), and a
   re-enqueue reports `alreadyRequested` with zero extra POSTs (one-shot guard).
5. **J2 ingest**: contacts (`smb_app_state_sync`), history chunk (phase 0,
   progress 100), companion-app echo (`smb_message_echoes`), and inbound
   (`messages`) deliveries land in `whatsapp_contacts`/`conversations`/`messages`
   with correct directions; account sync completes (`COMPLETE`, progress 100).
6. **Staff visibility + denial**: staff (`staff_default` → `whatsapp.inbox_view`)
   reads the conversation + thread through `WhatsappInboxService`; admin
   (`academy_admin`) reads equally; intruder (`teacher_default`) is denied by
   `ForbiddenError(insufficientPermissions)` via `expectJourneyError`.
7. **J3 revoke**: an `smb_message_echoes` revoke for the echo wamid marks the
   original message row `revokedAt`; the revoked echo stays visible in the thread.

## Boundary interception

- `globalThis.fetch` replaced by a URL-routing stub (`Object.assign(mock(...), { preconnect() {} })` pattern from the embedded-signup test): `smb_app_data` gets `{ messaging_product, request_id }`, template sends get a unique `wamid.jrnN`; restored in `afterAll`.
- `redisService.get/set` spied onto an in-memory map (pair-rate-limit state is deterministic; nothing touches real Redis).
- Notification dispatch boundary spied via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")` **call-through** — the real whatsapp routing executes (it is the subject) while `dispatchTargetsForEvent` asserts only the parent was targeted.

## Production defect found and fixed

`resolveCredentials` in `MetaCloudApiAdapter.ts` checked `!isActive` before
`offboardedAt`. Since `markOffboarded` deactivates too, the
`whatsapp.accountOffboarded` fail-fast error was unreachable — every offboarded
send surfaced as a generic misconfiguration. Swapped the check order so the
offboarded branch (and its error code) wins. Regression suites re-run:
`whatsapp-channel` 32/32, `whatsapp-purpose-routing` 9/9, `pair-rate-limit` 14/14.

## 13.QL

`sub-loop --lifecycle codescene` exit 0 for: `whatsapp-cast.ts`,
`helpers/index.ts`, `coexistence-routing.test.ts`, `MetaCloudApiAdapter.ts`.
`DIAGRAMS.md` is markdown — outside lint scope (oxlint reports no matching
files); validated via `bun run validate:mermaid` (block OK). Loop-driven fixes:
nested ternary → `fetchInputUrl` helper; CodeScene Large Method → webhook value
builders extracted from the ingest step. No `__NEXT__` markers remain.

## 13.TE

7 journey tests, 70 assertions. T4 flavor: unauthorized actor denied through
real permission rows (`teacher_default` has no `whatsapp.inbox_view`);
unresolved-scope checks (offboarded number excluded from routing) assert via
the real factory/resolution path. T3 flavor: out-of-order lifecycle (offboard
→ reconnect) through the durable queue. Idempotency: one-shot sync re-enqueue,
replay-hash tracked cleanup (`payloadHash` list), wamid uniqueness via per-run
prefixed ids.

## 13.SEC

No identity is read from untrusted input; actors resolve through real
`user_permission_groups` rows. The per-run `whatsapp.config_manage` grant is a
real `group_permissions` row (catalog permission lookup), deleted in cleanup.
No token material crosses logs/assertions (account fixture uses the
`encryptedText` driver convention; assertions never read tokens). The
notification spy is call-through — Meta traffic is carried by the fetch stub,
not by the spy — and the suite dispatches WhatsApp-only payload arrays, so no
email/SMS/on-app adapter is exercised at all.

## 13.SR

No read-then-write races exercised or tolerated; all ingest flows are the
existing guarded upserts. No new env-config keys; no module state beyond
suite-scoped spies, all restored in `afterAll`. Cleanup is tracked:
audit rows (immutability trigger toggled), webhook events by payload hash,
accounts (cascade), per-run group chain, then the shared class fixture sweep.
New deferred entry: **D14** — the template-map reachability gap
(`CLASS_REMINDER` filtered out by `CLASS_LIFECYCLE_EVENTS`; other mapped events
allowlist-barred from WhatsApp), logged in `deferred-items.md`.

## 13.IV

Read and complied: root `AGENTS.md` (re-read after foreign in-flight edit —
the change was an unrelated carryover doc link), `test/workflows/AGENTS.md`,
`docs/testing/workflow-journey-tests.md`, `backend/AGENTS.md`,
`backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`,
`.agents/instructions/backend.instructions.md` + `tests.instructions.md`.
Honors: no `runInRollback`, `run-test.ts` runner, `@/` aliases, barrel-import
rules, `bun:test` only, no `console.*`/`any`/`rejects.toThrow`.
