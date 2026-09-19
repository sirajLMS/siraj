Agent is idle (waiting for messages). agent_id: r4-migration, agent_type: explore, status: idle, description: R4: Validate v8 §Y migration, elapsed: 610s, total_turns: 1

[Turn 0]
I have full verification. Here is my audit report.

---

# v8 §Y (Migration & Rollback Runbook) — Round 4 Validation Audit

## 1. Validation Summary Table

| Sub-section | Title | Status | Remaining Gaps | Key Finding |
|---|---|---|---|---|
| **Y1** | Forward-Only DB Migration Acknowledgment | **PARTIAL** | 4 | `out: "./backend/drizzle"` confirmed (drizzle.config.ts:4); `drizzle-kit@1.0.0-rc.4` confirmed (package.json). Migrations use folder-per-migration + `migration.sql` + `snapshot.json` + custom `.custom-migrations.json` journal (NO standard `_meta/journal`). `bun run db generate/migrate/studio` scripts **do not exist** — design cites fictional commands. Manual `DROP TABLE` FK-safety undocumented. |
| **Y2** | Phase 3 Rollback Procedure | **PARTIAL** | 5 | 5-step runbook is logical but missing: Vercel redeploy mechanics (env vars are immutable-ish, no `vercel redeploy` command given), **connection-pool drain is NOT feasible on Neon** (`@neondatabase/serverless` Pool/factory is stateless per-invocation — §Y2 assumes a long-lived pool that doesn't exist in this architecture), no Slack/`logger.error` alerting infra exists, no reconciliation query for templates created during the rolled-back window. |
| **Y3** | Seed Phase Correction | **INVALID** | 3 | The "contradiction" claim is **real but mis-stated**: item 19 content is *"Write seedOrGet in `backend/db/seeds/notifications/seed-email-templates.ts` (one row per EmailScope per locale via EmailTemplateService bootstrap)"* — note at line 97 says seeds should be Phase 1. **BUT line 1954 Phase 1 definition still lists "**seed default templates**" AND "**no DB schema**"** — the design contradicts *itself* (Phase 1 lists seeds + no-DB). §Y3 picks "seeds in Phase 2" but does NOT update the Phase definition at line 1954 or item list assignment. No file at `seeds/notifications/seed-email-templates.ts` exists yet. |
| **Y4** | Seed Idempotency Verification | **PARTIAL** | 3 | `seedOrGet` IS the real codebase convention (`backend/db/seeds/index.ts:40-41` confirms `seedOrGet as seedOrGetNotificationDeliveries`). But `upsertManyEmailTemplates`, the `email_templates` table, and both indexes are **design-only** (no schema found in `backend/db/schema/` — grep returned 0 hits). `onConflictDoUpdate` on a partial unique index (`WHERE isActive=true`) question is left open/correct-but-unanswered.. |
| **Y5** | Post-Migration Data Validation | **PARTIAL** | 3 | Ans on the side of not running on prod-DB-creds. `scripts/email-post-deploy-check.ts` doesn't exist; would need `DATABASE_URL` (env-conflict for Vercel runtime vs build). Design suggests "Vercel post-build or manual `bun run`" — **undecided**, not actionable. No alerting infra. The "13 EmailScopes × locales" count is asserted but EmailScope enum count is not verified against the design body. |
| **Y6** | Per-Scope Canary Opt-in | **PARTIAL** | 3 | `getEnvArray` **does NOT exist** in `backend/lib/env.ts` (only `getStringEnv`, `getBooleanEnv`, `getEnumEnv`, `requireEnv`, `getEnv`, `validateEnvironment` — env.ts:62,70,77,410,421). `EMAIL_TEMPLATES_ENABLED` referenced but `EMAIL_TEMPLATE_SCOPES_ENABLED` is design-only. `mapEventTypeToEmailScope` is design-only. Canary flow the dispatcher integration point is not specified (which file in `backend/services/communication/communication.service.ts:37`?). |
| **Y7** | Monitoring & Alerting Strategy | **INVALID** | 4 | Grep for `slack|Slack|webhook|sendAlert` across `backend/` returned **ZERO hits** — no Slack webhook or alerting infrastructure exists. §Y7 says "logger.error + Slack webhook alert" as if wired — **it is not**. Thresholds are reasonable but have no sink. `notificationDeliveries` table exists (confirmed) but no aggregation query against it by scope/provider/hour is shown. No metric-export (Prometheus/Vercel Analytics) pattern documented. |
| **Y8** | Deployment Order Invariant | **PARTIAL** | 3 | The 5-phase order at lines 1846-1851 contradicts the order at lines 1953-1957 (the latter orders Phase 4 = auth/account + bundle analysis). Cross-phase deps undocumented: Phase 4 (auth/account emails at line 1957) **adds WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to `NotificationEventType` AND uncomments `EVENT_TO_SCOPE` entries** — this is a Phase 1 (registry schema) + Phase 3 (dispatcher mapping) cross-cutting change done in Phase 4 — the dependency is real but not documented as a constraint. The "7 days stable" gate has no verification signal tied to it. |

---

## 2. Detailed Findings Per Sub-section

### Y1 — Forward-Only DB Migration Acknowledgment
**Verified claims:** `drizzle.config.ts:4` `out: "./backend/drizzle"` ✓; `drizzle-kit@1.0.0-rc.4` ✓ (drizzle-kit generates forward-only `migration.sql`); folder layout (`2026[PHONE_REDACTED]_extensions/migration.sql`) confirms no per-script `up/down` split.
**Gaps:**
1. **Custom migration journal mismatch:** Migrations here are NOT standard drizzle — there's a custom `.custom-migrations.json` (206-line `manifest` + `appliedFolders`) tracking SHA256 hashes. §Y1 doesn't mention this; the standard `bun run db migrate` claim is invalid.
2. **Fictional scripts:** No `db:generate`, `db:migrate`, `db:studio`, `db:seed` in `package.json`. The real entry is `"db": "bun --no-env-file run scripts/dbActions/index.ts"` (interactive). §Y1's "Pre-deploy verification: `bun run db generate`…`bun run db migrate`…`bun run db studio`" is non-actionable.
3. **Manual `DROP TABLE` FK-safety:** `email_templates` likely has FK to `tenants`/`users` (audit/createdBy) and depends on `email_scope_enum` TYPE + partial unique index. `DROP TABLE email_templates; DROP TYPE email_scope_enum;` order is unspecified — FK deps + enum used by views/triggers could error. No `CASCADE` guidance, no pre-drop `pg_depend` check.
4. **No "re-generate after DROP" note:** After manual DROP, the drizzle snapshot (`snapshot.json`) still records the table — subsequent `migrate` will re-create it but `appliedFolders`/journal still marks the migration applied, causing drift.

### Y2 — Phase 3 Rollback Procedure
**Verified claims:** `communication.service.ts:37` `emailChannel.send({ ...commonFields, subject: payload.title, html: payload.body ?? "" }, locale)` — the legacy fallback string is exact ✓.
**Gaps:**
1. **Pool/persistence-drain is architecturally impossible:** `backend/db/factory.ts:1-4` uses `@neondatabase/serverless` Pool + `drizzle-orm/neon-serverless` (and neon-http single-fetch at `http-client.ts:31`). On Vercel, function instances are ephemeral — there's no long-lived pool to "drain." Step 3 ("Drain queued sends") is impossible to achieve by waiting on a connection pool.
2. **`RETRYING`-state jobs during rollback:** Retries live in `notificationDeliveries` rows processed by a cron/in-band handler. With the flag flipped false, in-flight retry jobs may still hit the *new* code during the redeploy window — §Y2 doesn't specify ordering (flip-then-deploy vs deploy-then-flip) or that the legacy code path must remain live until retries drain.
3. **No `vercel env rm`/`vercel redeploy` commands:** An ops engineer cannot follow this without Vercel-side specifics — env change triggers redeploy automatically, but the design doesn't say so.
4. **Alerting infra:** "alert via `logger.error` + Slack webhook alert" — Slack webhook sink doesn't exist (grep returned 0 hits).
5. **No reconciliation for templates created during the rolled-back window:** Mis-named — flagged but no SQL provided to identify runtime-created (non-seed) templates to preserve vs orphan.

### Y3 — Seed Phase Correction
**Verified claims:** Contradiction is real but the design misdiagnoses it. Item 19 (content at line 95) says seeds go in `backend/db/seeds/notifications/seed-email-templates.ts` (file does NOT exist yet). Note at line 97 says "seeds should be Phase 1." Phase 1 definition at line 1954 literally lists **"**seed default templates** (no UI, no DB schema)"** — internally contradictory (can't seed rows without a table).
**Gaps:**
1. **§Y3 picks "seeds in Phase 2" but does not amend:** (a) item 19's phase assignment, (b) the Phase 1 definition at line 1954 (still says "seed default templates"), (c) line 1315 "Migration / data (Phase 1 — seeds must ship with the registry…)" heading which still says Phase 1. The contradiction is preserved, not resolved.
2. **"Phase 2 deploy step" undefined:** Phase 2 is a DB-schema-and-code PR — there's no documented deploy step ordering ("apply migration" → "run seed" → "deploy code") within Phase 2.
3. **No rollback of seeds if Phase 2 deploys but Phase 3 is aborted later:** If seeds ship in Phase 2 but flag stays false forever, default templates sit orphaned; no sunset path documented.

### Y4 — Seed Idempotency Verification
**Verified claims:** `seedOrGet` convention is real (`seeds/index.ts:40-41` uses it for 2 notification seeds) ✓.
**Gaps:**
1. **`upsertManyEmailTemplates` is design-only** — grep for `upsertManyEmailTemplates` in `backend/db/seeds/` returned 0 hits; `email_templates` schema grep in `backend/db/schema/` returned 0 hits. §Y4 discusses conflict-target logic on a method/index that doesn't exist yet — this is a *forward design*, which is fine, but it's labeled as verification of existing behavior.
2. **Partial-unique-index + `onConflictDoUpdate` answer left open:** §Y4 says "the seed must set `isActive: true` only for the first seed, and `isActive: false` for re-runs' old rows" — but doesn't give the SQL/Drizzle `set` clause to atomically deactivate-then-upsert. Drizzle's `onConflictDoUpdate` supports `WHERE` on the target clause but not cross-row state mutation within one statement — needs a 2-statement transaction. Unspecified.

### Y5 — Post-Migration Data Validation
**Gaps:**
1. **`scripts/email-post-deploy-check.ts` doesn't exist**; no `scripts/` precedent for runtime-DB-query scripts (the dir has `baseline-drizzle-migrations.ts`, `migrate-phase2-dashboard.ts`, `validate-seed-assets.ts` — all build-time/once).
2. **DB credentials in Vercel post-build are inadvisable:** Vercel build step has `DATABASE_URL` baked into the build image/secret — fine for read-only — but post-build hook can't reach runtime env. The design offers "post-build OR manual bun run" — **undecided, not actionable**. Recommend: standalone `bun run email:post-deploy-check` invoked manually after deploy (matches existing `db` interactive pattern).
3. **"13 EmailScopes" count unverified** — design body's EmailScope enum size isn't cross-referenced from §Y5; if the enum grows, the assertion silently breaks.
4. **No "abort/circuit-break" path:** On assertion failure, the design says "logs failures → alerts" — but doesn't say whether to auto-rollback (flip flag false) or require human action.

### Y6 — Per-Scope Canary Opt-in
**Verified claims:** Legacy dispatcher at `communication.service.ts:37` is where the flag check would slot in — but §Y6 doesn't name the file/line.
**Gaps:**
1. **`getEnvArray` does NOT exist** (env.ts only has `getStringEnv`, `getBooleanEnv`, `getEnumEnv`, `requireEnv`, `getEnv`). §Y6 references `getEnvArray("EMAIL_TEMPLATE_SCOPES_ENABLED")` as if present — **must be added in §Y6 as a new helper**.
2. **`EMAIL_TEMPLATE_SCOPES_ENABLED` naming clash:** Existing pattern is `EMAIL_TEMPLATES_ENABLED` (plural "templates"). The new var uses `TEMPLATE_SCOPES` — inconsistent casing/pluralization. Recommend `EMAIL_TEMPLATES_SCOPES_ENABLED` or `EMAIL_SCOPE_CANARY`.
3. **Dispatcher vs scope-check location undefined:** The check against `mapEventTypeToEmailScope` happens where? `emailChannel.send` is generic; the per-event scope mapping is upstream in the notification job. §Y6 doesn't say whether the allowlist filters at the mapper (`mapEventTypeToEmailScope`) or the dispatcher. The two produce different fallback semantics (mapper filters → falls back to `payload.body` passthrough; dispatcher filters → silently skips).
4. **`*` sentinel parsing unclear:** "If unset or `*`" — but if env is unset, `getEnvArray` returns `undefined`; if `*`, returns `["*"]`. The dispatcher must treat both as "all." Not specified whether empty-string is "none" or "all" (security risk — empty = all is wrong).

### Y7 — Monitoring & Alerting Strategy
**Verified claims:** `notificationDeliveries` table exists ✓ (`notificationDeliveries.types.ts`, repo, seed).
**Gaps:**
1. **INVALID — no Slack webhook infra:** Grep `slack|Slack|webhook|sendAlert` across `backend/` returned **ZERO hits**. §Y7's "logger.error + Slack webhook alert" presents an alerting channel that does not exist. Must either (a) design a new `ALERT_SLACK_WEBHOOK_URL` env + transport, or (b) drop to `logger.error` + Vercel log drain to Datadog/etc.
2. **Threshold temporal windows undefined:** "< 95% over what window?" "> 50 in 1h" needs a rolling-window query pattern (no aggregation job/cron exists — `vercel.json` crons only has `/api/fx/refresh` and `/api/cron/class-reminders`). No cron for the alert aggregator.
3. **No backpressure/`PERMANENTLY_FAILED` aggregation job.** Alerts require a scheduled reader; none exists.
4. **Render-degraded counting:** §S5 returns `degraded: true` per send; §Y7 says "rate > 5%." Counting denom/numer needs a `notificationDeliveries.failureReason = 'render_degraded'` column — not yet in the schema design.

### Y8 — Deployment Order Invariant
**Verified claims:** Hard ordering is real — Phase 3 reads Phase 1 payload + Phase 2 seeds.
**Gaps:**
1. **Phase 4 cross-cutting contradiction:** Lines 1956-1957 Phase 4 = "add WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to `NotificationEventType` AND uncomment their `EVENT_TO_SCOPE` entries in the same PR." This changes the Phase 1 `NotificationEventType` enum (compile break — all consumers) AND the Phase 3 dispatcher mapping **after Phase 3 is in prod**. §Y8 says "Phase 4 after Phase 3 stable 7 days" but doesn't document this as a *re-compilation dependency* on Phase 1, nor that Phase 4 requires co-deploying Phase-1 enum + Phase-3 mapping atomically (V3-8 lockstep). Hard dependency on Phase 3's stability **and** on Phase 1's enum definition is not stated.
2. **"7 days stable" gate has no signal:** No metric/threshold defined for "stable" — should cross-ref §Y7 thresholds. Without that, the gate is a calendar, not a verification.
3. **No "can't skip Phase 2 to reach Phase 3" enforcement:** §Y8 lists order but no CI/pre-deploy check that Phase 2 migrations are applied before Phase 3 dispatcher code can run. The dispatcher should fail-fast with `EMAIL_TEMPLATES_TABLE_MISSING` if seeded before schema — still unspecified.

---

## 3. New Gaps Discovered During Validation (Not in Original Audit)

**N1. Custom migration toolchain (`dbActions/index.ts` + `.custom-migrations.json` journal) is entirely undocumented in §Y.** The entire §Y assumes vanilla `drizzle-kit` CLI (`bun run db generate/migrate`). Reality: `package.json` only has `"db": "bun --no-env-file run scripts/dbActions/index.ts"` — an interactive runner. Every "run X command" in §Y1/Y2/Y5/Y8 is non-actionable until this is corrected. **Highest-severity new gap.**

**N2. Neon serverless/HTTP driver precludes pool-drain rollback.** `backend/db/factory.ts` + `http-client.ts` use `drizzle-orm/neon-serverless` and `neon-http` (single-fetch). §Y2's step 3 "drain queued sends (wait for RETRYING state)" assumes pool draining that is architecturally impossible on Vercel + Neon — retries are row-state in `notificationDeliveries` processed by future invocations, not held connections. Rollback must instead (a) wait for in-flight HTTP fetches to complete (≤ request timeout) and (b) gate on a `notificationDeliveries` count query for `RETRYING`/`PENDING` rows older than N. New gap, not in Round 3.

**N3. No alerting transport exists at all.** §Y7 mentions Slack webhooks and §Y5/§S5 mention `logger.error` alerts — grep for Slack/webhook/alert across `backend/` = 0 hits. The design repeatedly references alert sinks that don't exist; this is a cross-cutting infrastructure gap revealed only by v8 §Y's specificity (§S describes *what* to log/alert but never names *how to ship the alert*).

**N4. Phase 1 ↔ Phase 4 enum-coupling lockstep.** §Y8 doesn't note that Phase 4 (auth/account emails) edits the `NotificationEventType` enum first defined in Phase 1 and the `EVENT_TO_SCOPE` map exercised in Phase 3. This is a 3-phase atomic change done in a single Phase-4 PR — the dependency direction (Phase 4 depends on Phase 1 schema + Phase 3 dispatcher) is undocumented.

**N5. `bun run db seed` canonical entry absent.** Even after migration, there is no `db:seed` script; the existing pattern is `seedOrGet` calls invoked from `dbActions/index.ts` interactively. §Y1/Y2/Y5 all say "run `bun db seed`" — must specify the exact runner invocation.

**N6. Migration journal drift after manual `DROP TABLE`.** After Y1's manual DROP, `.custom-migrations.json` `appliedFolders` still records the email_templates migration as applied — a later `migrate` will skip re-creation. §Y1 doesn't mention updating `appliedFolders`/journal post-rollback.

---

## 4. Top-5 Actionable Recommendations for v9

1. **Replace all `bun run db generate|seed|migrate|studio` commands in §Y1/Y2/Y5/Y8 with the real runner:** `bun run db` (interactive `scripts/dbActions/index.ts`) or a new explicit `dbActions` sub-command. Document the `.custom-migrations.json` manifest/journal and how the forward-only guarantee is enforced given the custom pipeline. Add the post-rollback `appliedFolders` reconciliation step (N6).

2. **Rewrite §Y2 step 3 to be Neon/Vercel-correct.** Replace "drain pool" with: (a) wait for in-flight HTTP fetches to settle (≤60s), (b) query `SELECT count(*) FROM notification_deliveries WHERE status IN ('PENDING','RETRYING') AND created_at < now() - interval 'N minutes';` until 0, (c) only then flip flag false + redeploy. Specify vercel env var precedence + redeploy trigger (or use `vercel env rm` + git-push redeploy). Address N2.

3. **Resolve the Y3 contradiction by amending ALL three locations,** not just §Y3: (a) line 1957 Phase 1 definition → delete "**seed default templates**"; (b) line 1315 section heading "Phase 1 — seeds must ship…" → "Phase 2"; (c) reassign item 19 from Phase 1 (line 1962 item list scope) to Phase 2 explicitly. State the within-Phase-2 deploy order: apply migration → run seed → deploy code (flag=false).

4. **Add the missing `getEnvArray` helper design in §Y6** (new function `backend/lib/env.ts:getEnvArray(name, sep=",")`, returns parsed array or undefined) AND design the empty-string sentinel as "none" (deny-by-default) — never "all." Pin the exact dispatcher integration point (`communication.service.ts:37`) and decide filter-at-mapper vs filter-at-dispatcher (recommend mapper, fallback to `payload.body ?? ""` for non-canary scopes so existing email keeps flowing). Add `EMAIL_SCOPE_CANARY` as the env name or align casing with `EMAIL_TEMPLATES_ENABLED`.

5. **Stand up alerting infra before §Y5/Y7 can be considered actionable.** Either (a) add a `ALERT_SLACK_WEBHOOK_URL` env + a `backend/lib/alerts.ts` transport (referer `logger.error` calls) + a Vercel cron (`vercel.json` crons array) running the threshold aggregator every 5 min against `notificationDeliveries` — or (b) explicitly degrade §Y7 to "log to Vercel + rely on log-drain to external observability" and remove the Slack claim. Cross-reference §Y8's "7-day stable" gate to specific §Y7 thresholds (e.g., "stable = send-success ≥ 99% over 24h" — success rate right now, even though the success-rate alert threshold is 95%).

### Cross-reference Completeness Check
- **§Y → Phase definitions (lines 1940-1957):** **WEAK** — §Y8 lists an order but doesn't cite the Phase definition lines; the order at §Y8 (1846-1851) and lines 1953-1957 disagree on Phase 4 contents (bundle analysis placement).
- **§Y → §S Error Handling:** **ABSENT** — §Y2 rollback runbook doesn't cross-reference §S3 (retry+DLQ) or §S5 (degraded signal) or §S7 (`RENDER_FAILED`/`PROVIDER_DEGRADED` codes). Rollback triggered by a §S alert scenario has no bridging text. **Recommend:** add a §Y↔§S bridge specifying that §Y2 rollback is *initiated* when §Y7 thresholds breach (§S3 PERMANENTLY_FAILED count > 50/1h ⇒ begin §Y2 rollback Step 1).