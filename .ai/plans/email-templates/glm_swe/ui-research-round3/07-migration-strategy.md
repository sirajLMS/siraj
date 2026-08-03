
---

# Email Template System — Migration Strategy Audit (Round 3)

**Plan:** `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md` (v7)
**Scope:** Feature flag transitions, rollback plans, data migration, phased rollout, backward compatibility
**Method:** Cross-referenced plan claims against actual codebase (`backend/`, `drizzle.config.ts`, `IEmailChannel.ts`, `communication.service.ts`, `env.ts`, `env-config-keys.ts`, `communications.types.ts`, existing migrations)
**Date:** 2026-08-02

---

## Summary Table of All Gaps

| # | Severity | Area | Description |
|---|----------|------|-------------|
| G1 | **P0** | Rollback | No DB `down`-migration mechanism exists in the repo (forward-only `drizzle-kit@1.0.0-rc.4`, all migrations are sole `migration.sql`). Plan claims "instant rollback" via flag but a failed Phase 3 DB migration that adds the new tables/indexes is **not reversible** without manual SQL. |
| G2 | **P0** | Rollback | No documented Phase 3 rollback **procedure**. Plan only says "flip flag false." Missing: order (flag→delete-file→DB), who runs it, how to reconcile templates created during the rolled-back window, and how to undo the `email_templates` rows the seed created. |
| G3 | **P1** | Feature flag | `getBooleanEnv` reads `process.env` directly (env.ts:70) — toggle requires a **process restart** (serverless cold start). The plan presents the flag as "instant rollback" but never states this constraint. Mid-session false→true has no effect on already-warmed requests. |
| G4 | **P1** | Feature flag | Flag is **global single-key**, not per-environment or per-event-scope. No dev→staging→prod promotion order documented inside the plan (only in `ENV_KEYS_GUIDE.md` §11). Mixed-version deployment (new code + flag=false) is the only coexistence model and it is not called "mixed-version safe." |
| G5 | **P1** | Data migration | No data migration for **existing email content**. Old path used `payload.body ?? ""` raw HTML; new path stores React Email-component output in `email_templates.compiled_html`. There is no step that backfills legacy body content (it's intentionally not migrated — parametrize via templates), but this is **not explicitly documented** as a deliberate non-migration, leaving it ambiguous. |
| G6 | **P1** | Data migration | No **post-migration data validation** step. After Phase 3 flip, there is no assertion that (a) seed rows exist for every `EmailScope` in every supported locale, (b) no `compiled_html` is null/stale, (c) `partial unique index` has exactly one active row per scope+locale. Field-date parity test is only a repo test (todo test #5), not a prod post-deploy check. |
| G7 | **P1** | Phased rollout | **Cross-phase atomic requirement** between Phase 1 and Phase 3: `CommunicationPayload.templateProps` (added in plan §Service-layer, prerequisite) must ship with the `mapEventTypeToEmailScope` consumer in Phase 3, but `templateProps` is purely additive so Phase 1 ships it harmlessly. The genuine gap: Phase 3 cannot ship until Phase 1 *and* Phase 2 + seeds are deployed, because the dispatcher reads `templateProps` AND needs seed rows in the DB. Plan documents Phase 1 → 2 → 3 order but does not mark this as a **hard deployment order invariant** (no `requires:` field). |
| G8 | **P1** | Phase 3 dispatcher | Events **not in `EVENT_TO_SCOPE`** during transition: the `Readonly<Record<NotificationEventType,...>>` makes missing keys a **compile error** — so it's all-or-nothing at build time. There is **no gradual per-event opt-in**; the single global flag enables all 24 event mappings simultaneously. Plan acknowledges this but offers no escape hatch (e.g., a second allowlist env var like `EMAIL_TEMPLATE_SCOPES_ENABLED=CLASS_LIFECYCLE,...`). |
| G9 | **P1** | Phase 3 dispatcher | No **monitoring/alerting strategy** described. Bounce/complaint webhooks (todo 20a) populate `NotificationDeliveryStatus` but there is no alerting threshold (e.g., "fail rate >5% → auto-flip flag false"), no dashboard, no SLO during migration window. |
| G10 | **P1** | DB schema | `version` integer column defaults to `1` for new rows — **correct for existing rows** (none exist yet since table is greenfield). However, if seed rows ship in Phase 1 but a later seed re-run is attempted, idempotency of `seedOrGet` (seedOrGet naming) is asserted but the actual idempotency mechanism (upsert on `scope+slug` unique index) is only mentioned in passing under service bootstrap, **not verified in the plan**. Re-running `bun db seed` could violate the partial unique `scope+locale+active_uq` index if a prior seed left an active row. |
| G11 | **P2** | Feature flag | `EMAIL_TEMPLATES_ENABLED` registration is `excludeFromDb: true, serverOnly: true` (matching IS_DEMO) — so it is **NOT toggle-able via the in-app Settings UI** (unlike true DB-override env keys with the 5-min cache). The plan never states this, leading to the false impression admins can flip it live. Runtime toggling is impossible without redeploy. |
| G12 | **P2** | Rollback | `email-templates.ts` **already has ZERO importers** in the entire repo (grep-confirmed across `backend/` `frontend/`, no `node_modules`, no plan dirs). It is already orphaned. The plan's V5-4 instruction to "delete after migration + verify zero callers" is safe, but the file deletion is NOT gated behind the flag — executing the Phase 3 delete removes dead code unconditionally. A rollback would simply not restore it (it wasn't being called anyway), so this is **low risk** but the plan doesn't note that the file is currently dead. |
| G13 | **P2** | Backward compat | GraphQL schema changes (new `emailTemplates` query/mutation/preview) are additive — **does not break existing queries**. However, the new `EMAIL_TEMPLATES_MANAGE` enum value (added to the permission enum registry per §UI) and 3 new `EmailScope`/`EmailTemplateStatus`/`EmailEditorPermission` pgEnums — the plan claims these are additive but **does not verify** the Pothos `enum.pothos.ts` registry handles unknown enum values gracefully for old clients (old Apollo cache may hold stale enum sets). Assume-safe, but unverified. |
| G14 | **P2** | Backward compat | `CommunicationPayload` extension adds optional `templateProps?: Record<string,unknown>` — **backward-compatible** (existing builders don't set it, dispatcher falls back to `payload.body`). Verified correct. No gap, but worth noting: typing it as `Record<string, unknown>` (vs. a discriminated union per scope) means template render errors only surface **at runtime**, not at the dispatch call site. |
| G15 | **P2** | Zero-downtime | Old code (Phase 0/1 deployed) reading a **new DB schema** (Phase 2 deployed) is not analyzed. Since Phase 1 ships no DB schema and Phase 2 ships the schema with the dispatcher still on the legacy path (flag=false), the question is: does any pre-Phase-3 code accidentally read `email_templates`? Answer: no (only the seed + repo + service introduced in Phase 2). But the plan does not document this as "forward-compatible by construction" — it relies on the flag, not on schema-isolation analysis. |
| G16 | **P2** | DB schema | Drizzle migration **order** (enums → table → indexes) is implicit ("make sure the enum file gets created first," line 430) but not enforced by a numbered migration ordering. drizzle-kit generates one migration folder per `drizzle generate`; the plan says "Run drizzle generate later via the skill workflow" — leaving the actual migration sequence to runtime discretion. A multi-file migration (enum pgEnum, then table, then partial unique index) must be one logical migration or guaranteed-ordered. |
| G17 | **P3** | Data migration | **In-flight emails during deployment**: deployment is atomic on Vercel (rolling). Old-code instances finish their `emailChannel.send` with `payload.body`; new instances route through `renderForSend`. Because the flag is read fresh per cold start, a deploy with flag=false is behaviorally identical to old code. **No in-flight risk** — but the plan does not state this explicitly. |
| G18 | **P3** | Data migration | No **schema column renames** in this plan (all new tables/columns), so no backfill needed. Confirmed: no `ALTER TYPE RENAME`, no `DROP COLUMN`. The only potentially destructive op is the future `DELETE email-templates.ts` (filesystem, not SQL). No gap. |
| G19 | **P3** | Phased rollout | "Minimum viable deployment unit" not explicitly stated. Inferred from the phase text: **Phase 1 alone is deployable** (no UI, no DB — registry + safeRender + seeds write via service bootstrap which is a no-op without the schema). Wait — **seeds ship in Phase 1 per the v2 review** (todo 19 note) but seeds persist via `EmailTemplateService` which requires the `email_templates` table (Phase 2 schema). This is a **contradiction**: todo 19 note says "seeds should be Phase 1" but seeding requires Phase 2's DB schema. Either seeds move to Phase 2, or Phase 1 must include the schema. Plan is internally inconsistent. |
| G20 | **P3** | Code deletion | Plan's deletion instruction (`grep -r 'email-templates' backend/ frontend/` before delete) is **correct in spirit but the file is already uncalled** (G12). No fallback needed since nothing imports it. Fallback instruction is appropriate (re-add file if breakage) but trivially unnecessary. |

---

## Detailed Findings Per Area

### 1. Feature flag transitions
- **(a) Default value:** Verified — `getBooleanEnv` (env.ts:70-71) returns `true` only when `process.env[name]?.toLowerCase() === "true"`; unset → `false`. Default-off is **correctly enforced by code shape**, not env-config-resolver. Plan V5-2 (line 124) correctly mandates this. ✓
- **(b) Toggle mid-session (false→true):** **GAP (G3).** Since the flag reads `process.env` (not the 5-min-cached `env-config-resolver`), a runtime change has zero effect until the process restarts. On Vercel/serverless this means "until next cold start." The plan calls this "instant rollback" (line 122) — **misleading**; it is "instant after redeploy."
- **(c) Coexistence of old/new paths:** Yes by design — the `if (!getBooleanEnv(...))` branch (line 584) keeps `emailChannel.send({html: payload.body ?? ""})` legacy path; the new path is reached only when flag=true. **Coexistence exists for the duration flag=false.** ✓
- **(d) Per-environment or global:** **GAP (G4).** Single global key. `ENV_KEYS_GUIDE.md` §8 mentions Vercel's Production/Preview/Development scopes but the plan itself doesn't bind the flag to a promotion order. The flag can differ per Vercel env scope (so logically per-environment), but it's one key, not a matrix.
- **(e) Runtime toggle vs restart:** **GAP (G3/G11).** Requires restart (cold start). NOT toggle-able via Settings UI since it's `excludeFromDb: true, serverOnly: true` (matching IS_DEMO at env-config-keys.ts:510). The plan never documents this — readers may expect a live admin toggle.

### 2. Rollback plans
- **(a) Phase 3 rollback procedure:** **GAP (G2).** Plan says "flip flag false" (todo 21c, line 122). No step-by-step procedure. Missing: who authorizes, how to verify legacy path resumes sending, how to drain queued sends, how to deal with the now-orphaned `email_templates` rows. The Phase 0 flag-toggle audit (line 1317) covers null-scope events but is a *pre-flip* audit, not a *rollback* runbook.
- **(b) Old `email-templates.ts` kept until confirmed:** **GAP (G12).** Plan explicitly says delete it in Phase 3 *after* migration. It is currently uncalled (grep-confirmed: zero importers repo-wide), so deletion is dead-code removal. However the plan does not note its current orphan status — implying the deletion is a real migration risk when it is not.
- **(c) DB reversibility:** **GAP (G1).** `drizzle.config.ts` `out: ./backend/drizzle`, all existing migrations are single forward `migration.sql` files. **No `_down`/down-migration support found** (grep for `down(` and `DROP TABLE`/`ALTER TYPE` in `backend/drizzle/*.sql` returned 0 hits). drizzle-kit 1.0.0-rc.4 generates forward-only by default here. A failed Phase 2 schema migration cannot be rolled back via the toolchain — manual `DROP TABLE email_templates; DROP TYPE email_scope_enum; ...` would be required. **Not documented.**
- **(d) Seed idempotency:** **GAP (G10).** `seedOrGet` naming implies idempotent (get-if-exists). Plan line 1321 says persist via `EmailTemplateService.bootstrap` (`upsertManyEmailTemplates`) but the upsert target is the `scope+slug` unique index, **not** the `scope+locale+active_uq` partial index. A re-seed that flips `isActive` could violate the partial unique constraint. Mechanism is asserted, not specified.
- **(e) Templates created during rolled-back window:** **GAP (G2).** If flag was true, admins may have created/edited `email_templates` rows. Rolling back to flag=false leaves those rows orphaned (no read path until flag flips again). No reconcile/cleanup step defined.

### 3. Data migration
- **(a) Existing payloads compatible:** Partially. `CommunicationPayload.templateProps` is added as optional (§Service-layer, lines 531-549) — backward compatible. But `templateProps` is `Record<string, unknown>` (untyped) — runtime-only safety via `safeRender` try/catch. **No compile-time guarantee** that builders populate the right shape per scope.
- **(b) Migration of existing email content:** **GAP (G5).** None. Legacy `payload.body` raw HTML is intentionally not migrated into `email_templates`. This is defensible (templates are parametrized React Email components, not 1:1 ports), but the plan never explicitly states "legacy body content is NOT migrated — it is replaced by registry component output." Ambiguous.
- **(c) In-flight emails during deploy:** **GAP (G17).** No explicit analysis. Conclusion (verified): Vercel rolling deploy + per-cold-start flag read means in-flight sends complete on old code; new instances honor the flag. No risk, but undocumented.
- **(d) Post-migration validation:** **GAP (G6).** No prod post-deploy assertion that (i) every `EmailScope` has an active template per locale, (ii) `compiled_html` is non-null, (iii) partial unique index has exactly one active row per scope+locale. Tests exist as repo-level `runInRollback` cases (todo test #5), not as a prod smoke.
- **(e) Schema column renames/backfill:** ✓ No renames (G18). All new tables/columns. No backfill needed.

### 4. Phased rollout
- **(a) Phase 2 independently shippable from Phase 3:** Yes — Phase 2 ships schema + repo + GraphQL + admin UI behind the flag=false default; dispatcher stays legacy. **Phase 2 is shippable without Phase 3.** ✓
- **(b) Phase 1 deployable without Phase 2:** **GAP (G19).** Phase 1 ships the registry, `safeRender`, `mapEventTypeToEmailScope`, AND **seeds** (todo 19 note moved seeds to Phase 1). But seeds persist via `EmailTemplateService` which needs the `email_templates` table — a Phase 2 artifact. **Contradiction:** either seeds belong to Phase 2, or Phase 1 must include the schema. Plan text in lines 1318-1323 and 1418 is inconsistent.
- **(c) Minimum viable deployment unit:** Not explicitly stated. Inferred: Phase 0 (deps) + Phase 1 (registry only, no seeds) is the smallest unit. As written (with seeds in Phase 1), MVP is Phase 0+1+2 (schema must accompany seeds).
- **(d) Cross-phase atomic requirements:** **GAP (G7).** Phase 3 dispatcher reads `templateProps` (Phase 1 payload change) AND requires seed rows (Phase 1/2). Hard ordering. No `requires:` field or dependency graph in the plan.
- **(e) Per-phase vs global flag:** **GAP (G8).** One global flag (`EMAIL_TEMPLATES_ENABLED`). No per-phase or per-scope flag. Cannot canary a single `EmailScope` (e.g., enable only `INVOICE_GENERATED` first).

### 5. Backward compatibility
- **(a) Old `IEmailChannel` preserved:** ✓ Verified — `IEmailChannel.ts` (`send`, `validateConfig`, `disconnect`) is extended, not replaced (todo 4 "hybrid approach"). The interface itself currently lacks `text`/`attachments` (V5-1 confirmed at `IEmailChannel.ts`).
- **(b) Phase 1 effect on existing events:** ✓ Phase 1 ships registry + `mapEventTypeToEmailScope` (unused by dispatcher until Phase 3). Existing `NotificationEventType` enum is NOT modified in Phase 1 (V3-8 deferred WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to Phase 4). No effect on existing events.
- **(c) GraphQL breaking changes:** ✓ New `emailTemplates` query/mutation/preview are additive (G13). No existing query touched.
- **(d) New enums additive:** ✓ `EmailScope`/`EmailTemplateStatus`/`EmailEditorPermission` are brand-new pgEnums (`backend/db/schema/enums.ts`), not extensions of `NotificationEventType`. The permission enum gets a new `EMAIL_TEMPLATES_MANAGE` value — **additive but unverified** that Pothos enum registry tolerates old clients (G13).
- **(e) `CommunicationPayload` extension:** ✓ Optional `templateProps?: Record<string, unknown>` — backward compatible (G14). Untyped, but additive.

### 6. Dispatcher migration (Phase 3, lines 696-740)
- **(a) Events not in mapping during transition:** **GAP (G8).** The `Readonly<Record<NotificationEventType, EmailScope | null>>` makes any missing key a **compile error** — there's no "partial mapping" state. Every event has an entry (24/24). Null-scope events (`NEW_COMPLAINT`, `NEW_SUGGEST`, `SUGGESTION_DUPLICATE_MARKED`, `CLASS_ACTIVATED`, `CLASS_STARTED`) short-circuit (lines 602-616). The flag-toggle audit (line 1317) documents the **email drop-off risk** but only as a pre-flip audit, not a runtime guard.
- **(b) Gradual per-event opt-in:** ✗ Not supported (G8). Single global flag flips all 24 mappings.
- **(c) Per-scope enable/disable:** ✗ Not supported. Add per-scope allowlist env?
- **(d) Monitoring strategy during migration:** **GAP (G9).** Bounce/complaint webhooks (todo 20a) update `NotificationDeliveryStatus` (which has `FAILED`/`BOUNCED`/`COMPLAINED` unused today), but no dashboard, no SLO, no fail-rate threshold.
- **(e) Alerting threshold:** ✗ None defined (G9). No "auto-flip flag false on >X% delivery failures."

### 7. DB schema migration
- **(a) Drizzle migration order (enum→table→index):** **GAP (G16).** Implicit only — plan line 430 says "enum file gets created first" and §schema places the `pgTable` after, but `drizzle-kit generate` produces a single folder per run; the ordering between `backend/db/schema/enums.ts` (pgEnums) and `backend/db/schema/communications/emailTemplates.ts` (tables) is not enforced as a numbered multi-step migration.
- **(b) Destructive migrations:** ✓ None in Phase 1/2/3 (G18). All `pgTable`, `uniqueIndex`, `pgEnum` creates. The only filesystem destruction is `DELETE email-templates.ts` (Phase 3, G12).
- **(c) `version` column initialization:** ✓ `integer("version").notNull().default(1)` (line 465). Existing rows N/A (greenfield table). For seed rows, default 1 is correct. ✓
- **(d) Partial unique index on populated table:** N/A today (table is new). When added to a populated table later, `WHERE "is_active" = true` partial unique index is safe ONLY if the table currently has ≤1 active row per scope+locale. The seed (one row per scope per locale, all `isActive=true`, `status=PUBLISHED` per the publish transaction at todo 12) must guarantee this. **Risk (G10):** if seed re-runs collide, the partial unique constraint throws. Seed idempotency must target this index.

### 8. Code deletion safety
- **(a) Grep-confirmed importer list:** ✓ **Verified independently:** `grep -rn "email-templates|renderComplaintResponseEmail|renderSuggestionAcknowledgedEmail"` across `backend/ frontend/` (excluding self, node_modules, plan docs) returned **zero hits**. The file at `backend/services/communication/templates/email-templates.ts` (5836 bytes) is **currently orphaned**. The plan's "verify zero callers before delete" is satisfied *today*, before any work begins.
- **(b) Deletion gated behind flag:** ✗ No. Plan says delete after Phase 3 dispatcher migration is complete — not behind `EMAIL_TEMPLATES_ENABLED`. Since the file is uncalled, gating is unnecessary, but the plan doesn't note this.
- **(c) Fallback if breakage:** Plan says re-add (restore from git). Trivial since file is already dead code (G12).

### 9. Environment-specific rollout
- **(a) dev→staging→prod plan:** **GAP (G4).** `ENV_KEYS_GUIDE.md` §11 has provider-by-provider phasing, not environment promotion. The plan itself has nothing.
- **(b) Environment-specific env keys:** ✓ Vercel scopes Production/Preview/Development (ENV guide §8). Single `EMAIL_TEMPLATES_ENABLED` key, set per Vercel environment scope.
- **(c) Canary deployment:** **GAP (G9).** No canary. Vercel supports preview deploys but the plan doesn't leverage them for canary (e.g., enable flag in Preview only).
- **(d) Monitoring dashboard:** ✗ None specified.

### 10. Zero-downtime deployment
- **(a) Mixed versions alongside old code:** ✓ Verified by construction. New code (flag=false) is behaviorally identical to old code (the `if (!getBooleanEnv)` branch reproduces `communication.service.ts:37` exactly: `emailChannel.send({...commonFields, subject: payload.title, html: payload.body ?? ""})`). Safe to deploy mixed.
- **(b) DB forward-compatible (old code reads new schema):** ✓ No pre-Phase-3 code reads `email_templates` (only Phase 2-introduced repo/service). New schema is invisible to old code. (G15 — not documented as such, merely true by construction.)
- **(c) GraphQL additive (old clients work):** ✓ New types/queries/mutations; no removals (G13).
- **(d) Breaking changes requiring coordinated deploy:** **GAP (G7).** Phase 3 requires Phase 1 payload (`templateProps`) + Phase 2 schema (seeds) to already be deployed. Not a "breaking change" per se, but a **hard deployment-order dependency** that must be respected. No coordination doc.

---

## Top-5 Actionable Recommendations

1. **P0 — Add a Runbook for Phase 3 rollback & DB migration failure (G1, G2).**
   Document: (a) rollback order — flip `EMAIL_TEMPLATES_ENABLED=false` → redeploy → verify legacy `payload.body` sends resume → optionally `DROP TABLE email_templates; DROP TYPE email_scope_enum, email_template_status_enum, email_editor_permission_enum;` (manual, since drizzle-kit is forward-only here); (b) reconcile procedure for admin-created templates during the enabled window (archive them, don't delete); (c) drain in-flight sends before flip. Add a `backend/drizzle/<ts>_down.sql` convention (or document manual SQL) to make the migration toolchain reversible.

2. **P0 — Annotate the feature flag as **restart-required, not runtime-toggleable** (G3, G11).**
   Add to todo 21c note: "`EMAIL_TEMPLATES_ENABLED` is `excludeFromDb: true, serverOnly: true` — NOT editable via the Settings UI. It takes effect only on the next process cold-start (Vercel redeploy). 'Instant rollback' = redeploy with flag set to 'false', not a live admin toggle." Surface this in `ENV_KEYS_GUIDE.md` §4.1 too.

3. **P1 — Resolve the Phase 1 seed contradiction and add an explicit deployment-order invariant (G7, G19).**
   Either (a) move seeds to Phase 2 (after schema exists), or (b) pull the `email_templates` schema into Phase 1. Document a hard `requires:` chain: `Phase3 requires Phase2 requires Phase1`. Make the seed idempotency (G10) target the `scope+locale+active_uq` partial unique index (not just `scope+slug`), with an explicit upsert + `isActive` reconciliation in `EmailTemplateService.bootstrap`.

4. **P1 — Add a per-scope allowlist for gradual Phase 3 canary (G4, G8, G9).**
   Introduce `EMAIL_TEMPLATE_SCOPES_ENABLED` (comma-separated `EmailScope` list, or `*` for all). The dispatcher checks `getBooleanEnv('EMAIL_TEMPLATES_ENABLED') && enabledScopes.has(emailScope)`. This enables canary rollout (e.g., enable only `INVOICE_GENERATED` first), per-environment promotion, and a precise rollback granularity. Pair with a delivery-failure alerting threshold (e.g., "FAILED > 5% over 10 min → auto-flip flag false" via the existing `NotificationDeliveryStatus.FAILED` counter).

5. **P1 — Add a post-deploy data-validation smoke (G5, G6) and document the "no legacy migration" decision explicitly.**
   Add a `scripts/validate-email-templates.ts` runnable post-Phase-3-deploy asserting: every `EmailScope` value has exactly one `isActive=true` template per supported locale; no `compiled_html` is null/stale; partial unique index has no violations. Explicitly document (in the migration section) that "legacy `payload.body` raw HTML is intentionally NOT migrated — templates are parametrized React Email components, replacing (not porting) legacy content. The `payload.body` fallback preserves legacy coverage while the flag is false." This removes the G5 ambiguity.

---

**Coverage check:** All 10 audited areas surfaced at least one concrete gap verified against the codebase. The most material risks are P0 (DB non-reversibility + missing rollback runbook) and the cascade of P1 flag/phase/dispatch gaps (G3, G7, G8, G9). Backward compatibility (Area 5) and zero-downtime (Area 10) are largely sound by construction but under-documented.