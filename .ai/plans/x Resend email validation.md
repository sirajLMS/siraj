# Plan: Fix Resend email validation for CLASS_MARKED_MISSED notifications

## TL;DR
The `Resend API returned an error — Invalid \`to\` field` for `CLASS_MARKED_MISSED`
(and every other notification event routed through the pure builders) because
**no layer ever populates `payload.metadata.to`** — the recipient address the
email/SMS adapters read. The pure builders in
`notification-payloads.builders.ts` are forbidden from doing DB I/O (specs.md §5.1),
so they can't resolve the user's email/phone themselves. The fix is to have
`dispatchWithPreferences` resolve each affected user's contact info via
`UserRepository.findSafeById` and stamp `metadata.to` onto each email/SMS payload
right before dispatching — keeping builders pure and centralizing recipient
resolution in the single dispatch entry point.

## Root cause (verified)
1. `class-instance-expiry.service.ts` → `notifyParentOfMissedInstance` calls
   `buildClassLifecyclePayloads(instance, CLASS_MARKED_MISSED, [parentUserId], locale, { studentName })`.
2. Pure builder → `buildLifecyclePayloads` → `fanOutToUsers` → `buildPerChannel`
   emits 4 payloads/user with `metadata = { entityKind, entityId, classInstanceId,
   studentName, scheduledStartAt, newStartAt, totalRecipients }`. **No `to`.**
3. `dispatchWithPreferences` → `CommunicationService.dispatchMulti` → `dispatch`
   → `dispatchRecipientChannel` reads `const to = (payload.metadata?.to as string) ?? ""`.
   Since `metadata.to` is never set, `to === ""`.
4. `emailChannel.send({ to: "", ... })` → `ResendEmailAdapter.send` →
   `client.emails.send({ to: "" })` → Resend rejects: `Invalid \`to\` field`.

This is a **systemic** bug affecting ALL builder-driven events
(`CLASS_*`, `INVOICE_*`, `PAYMENT_METHOD_CHANGED`, `STUDENT_*`, `CLASS_REMINDER`),
not just `CLASS_MARKED_MISSED`. The legacy `complaintResponses.service.ts` path
calls `CommunicationService.dispatch` directly with no `metadata.to` either, so
it's also broken — but it's grandfathered (specs.md F1 exception) and out of
scope for this fix.

## Approach
Add recipient resolution to `dispatchWithPreferences` (the SOLE sanctioned entry
point per specs.md rule #1). It already loops per-user to load prefs; in that
same per-user pass it will:
- Fetch the user via `UserRepository.findSafeById(userId)`.
- For each surviving payload where `channel === "email"`, set `metadata.to = user.email`.
- For each surviving payload where `channel === "sms"`, set `metadata.to = user.phone`.
- If the contact field is null/empty, drop that single payload (log a warn) rather
  than letting it reach the adapter and fail with a cryptic provider error.

This keeps the pure builders untouched (specs.md §5.1 purity preserved), fixes
every builder-driven event at once, and centralizes recipient resolution in the
one place all dispatches already flow through.

## Steps

### Phase 1 — Recipient resolution in `dispatchWithPreferences`
1. In `backend/services/notification/notification-dispatch.helpers.ts`:
   - Import `UserRepository` from `@/backend/db/repo`.
   - In `dispatchForUser`, after the prefs-filter loop builds `userPayloads`,
     fetch the user once: `const user = await UserRepository.findSafeById(userId);`
   - Map `userPayloads` to stamp `metadata.to`:
     - `channel === "email"` → `metadata.to = user?.email ?? ""` (drop if empty).
     - `channel === "sms"` → `metadata.to = user?.phone ?? ""` (drop if empty).
     - `on_app` / `push` → leave `metadata.to` unset (not needed).
   - If `user` is null (user deleted between build and dispatch), drop ALL
     email/sms payloads for that user and log a warn (don't throw — per-user
     isolation rule, specs.md §5.2).
   - Return updated `userPayloads` (with `to` stamped and contactless payloads
     filtered out) to `CommunicationService.dispatchMulti`.
2. The `CommunicationPayload` type is `readonly`-fielded; the stamping must
   produce new payload objects (spread + override `metadata`) rather than mutate.

### Phase 2 — Tests
3. Update `backend/services/notification/notification-dispatch.helpers.test.ts`:
   - Add a `UserRepository.findSafeById` spy (default: returns a user with
     `email: "parent@test.com"`, `phone: "+15555550100"`).
   - Existing tests that assert `dispatchMulti` receives N payloads still pass
     (email/sms payloads now carry `metadata.to`).
   - Add tests:
     a. "stamps `metadata.to` with user.email on email payloads before dispatchMulti".
     b. "stamps `metadata.to` with user.phone on sms payloads before dispatchMulti".
     c. "drops email payload when user.email is null (no dispatchMulti call for it)".
     d. "drops sms payload when user.phone is null".
     e. "drops all email+sms payloads when user not found, still dispatches on_app+push".
     f. "does NOT stamp `to` on on_app or push payloads".

### Phase 3 — Verification
4. `bun tsgo` — type check.
5. `bun biome:check` — format/lint.
6. `bun run scripts/run-test/run-test.ts backend/services/notification/notification-dispatch.helpers.test.ts`
7. `bun run scripts/run-test/run-test.ts backend/services/communication/test/communication.service.test.ts`
   (ensure no regression in the lower-level dispatch routing).
8. Manual: trigger the missed-class cron path (or wait for grace expiry) and
   confirm the Resend error is gone and an email delivery row is created with
   `status=SENT`.

## Relevant files
- `backend/services/notification/notification-dispatch.helpers.ts` — **primary edit**.
  Modify `dispatchForUser` to resolve recipient + stamp `metadata.to`. The
  `dispatchWithPreferences` algorithm (specs.md §5.2 steps 1-7) is preserved;
  recipient resolution is an additive step 4b inside the existing per-user loop.
- `backend/db/repo/users/user.repository.ts` — `findSafeById(id, tx?)` returns
  `UserSelectType | null` with `email: string` (notNull) and `phone: string | null`.
  Reuse as-is; no edit.
- `backend/services/communication/communication.service.ts` — `dispatchRecipientChannel`
  reads `payload.metadata?.to`. No change needed (it already consumes `metadata.to`
  correctly once it's populated).
- `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts` —
  no change; once `to` is non-empty, Resend accepts it.
- `backend/services/notification/notification-payloads.builders.ts` — **no change**.
  Builders stay pure (specs.md §5.1).
- `backend/services/notification/notification-dispatch.helpers.test.ts` — add
  `UserRepository.findSafeById` spy + 6 new test cases.

## Verification
1. `bun tsgo` passes (no type regressions from the readonly-payload spread).
2. `bun biome:check` passes.
3. `bun run scripts/run-test/run-test.ts backend/services/notification/notification-dispatch.helpers.test.ts`
   — all existing + 6 new tests green.
4. `bun run scripts/run-test/run-test.ts backend/services/communication/test/communication.service.test.ts`
   — no regression.
5. Lint via queue client on the two touched files:
   `curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"fix-resend","files":["backend/services/notification/notification-dispatch.helpers.ts","backend/services/notification/notification-dispatch.helpers.test.ts"]}'`
6. Manual runtime check: restart `bun dev`, let the missed-class cron fire (or
   force it), and confirm the log shows `Email sent successfully via Resend`
   instead of `Resend API returned an error — Invalid \`to\` field`.

## Decisions
- **Fix location**: `dispatchWithPreferences`, NOT the pure builders. Builders
  are purity-bound (specs.md §5.1 — no DB, no I/O). `dispatchWithPreferences`
  already does per-user I/O (prefs fetch) and is the SOLE sanctioned dispatch
  entry point (specs.md rule #1), making it the correct place for recipient
  resolution.
- **Scope**: fixes ALL builder-driven events, not just `CLASS_MARKED_MISSED`.
  The user's request names `CLASS_MARKED_MISSED` but the bug is systemic; fixing
  only that event would leave `INVOICE_*`, `PAYMENT_METHOD_CHANGED`, `STUDENT_*`,
  `CLASS_REMINDER` broken. The single fix in `dispatchWithPreferences` covers all.
- **Excluded**: the legacy `complaintResponses.service.ts` /
  `suggestion.service.ts` paths that call `CommunicationService.dispatch`
  directly (bypassing `dispatchWithPreferences`). These are grandfathered F1
  exceptions (specs.md) and their `to` is also empty, but they're out of scope
  for this fix. They'd need their own `metadata.to` population at the call site.
- **Contactless payload handling**: drop + warn (not throw). Matches the
  per-user error isolation rule (specs.md §5.2) and prevents a single
  email-less user from poisoning the whole dispatch.
- **`findSafeById` vs `findById`**: use `findSafeById` — it's the one already
  used by `gqlContext.ts` / `session.service.ts` for safe user resolution and
  excludes soft-deleted rows via RLS.

## Further Considerations
1. **Should the legacy `complaintResponses.service.ts` / `suggestion.service.ts`
   direct-dispatch paths also be fixed?** They have the same empty-`to` bug but
   bypass `dispatchWithPreferences`. Recommendation: **defer** — they're
   grandfathered F1 exceptions and fixing them is a separate task (populate
   `metadata.to` at each call site, or migrate them to
   `dispatchWithPreferences`). Confirm with user if they want this included.
2. **Should we add a defensive guard in `ResendEmailAdapter.send` / `TwilioSmsAdapter.send`
   that short-circuits with a clear error when `to` is empty**, rather than
   letting the provider return a cryptic `Invalid \`to\` field`? Recommendation:
   **yes, as a small follow-up** — it makes future regressions (a new dispatch
   path forgetting `metadata.to`) fail with an actionable log line. Not required
   for this fix since `dispatchWithPreferences` now guarantees non-empty `to`.
3. **`UserRepository.findSafeById` per-user fetch cost**: the expiry loop
   dispatches per-instance, so for N missed instances it's N user fetches.
   `findSafeById` is a single indexed `users.id` lookup — negligible. If this
   ever becomes hot, a `findSafeByIds(ids[])` batch helper (mirroring
   `findDisplayCurrenciesByIds`) could be added later. Not needed now.
