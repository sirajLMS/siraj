# Phase 15 — Knowledge Propagation Outcome

- **Date**: 2026-09-06
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks**: 15.1–15.6 (canonical docs, AGENTS.md/skill propagation, checkboxes)

## Deliverables

| Task | File | Result |
|---|---|---|
| 15.1 | `docs/services/whatsapp-coexistence-multi.md` | NEW canonical reference: purpose routing (map → dispatch → GENERAL fallback → `noSenderForPurpose`), per-account factory/adapter (eviction, offboard-first ordering, version resolution), ES v4 coexistence onboarding flow, sync lifecycle (one-shot guard, deadline sweep, 2593109 decline), durable ingest (persist-before-200, PROCESSING claim-race fix, 5-min replay window, media correlation windows), per-pair rate limiting, error-code table (all 8 `whatsapp.*` codes ↔ `errors` locale keys), ops checklist (`messages, account_update, history, smb_app_state_sync, smb_message_echoes` subscriptions; env-config keys; both cron sweeps; grants), battle-tested notes |
| 15.2 | `docs/services/whatsapp-cloud-api.md` | Header note: v2 doc is canonical for routing/webhook/onboarding; r3 section corrected — both HIGH findings marked FIXED per `outcome/inventory-backend.md` §4 (lock+rank-guard; args plumbed), with pointers |
| 15.3 | `docs/frontend/whatsapp-ui-patterns.md` | New "v2 (2026-09)" section: inbox tab wiring + permission-filtered nav, visibility-aware polling VM, RTL thread bubbles, purpose/sync badge + label helpers (raw-enum prohibition), coexistence card surfaces, ES dialog (origin check, config via server props, `retry`/`back` keys), purpose reassignment rules |
| 15.4 | `backend/services/AGENTS.md` | New "Multi-Instance Channel Adapters (per-account resources)" section — worded generically (factory instance maps, reset-must-cover-every-env-config-key, specificity-ordered credential errors) + Important References entry for the new doc |
| 15.4 | root `AGENTS.md` | Important References: `docs/services/whatsapp-coexistence-multi.md` added beside the v1 whatsapp entry |
| 15.4 | `shared/locale/AGENTS.md` | **Not changed** — no new convention emerged (dual-surface wiring + stable-id convention already documented; whatsapp2 reused them verbatim) |
| 15.5 | `.agents/skills/write-tests/SKILL.md` | 2 lines added to the journey row: per-run custom-group grants instead of fake super-admin; call-through `dispatchWithPreferences` spy + URL-routed fetch stub |
| Review doc | `.ai/plans/whatsapp2/outcome/post-implementation-review.md` | NEW — frontend review (PASS-WITH-FIXES: HIGH raw-enum labels + 7 MEDIUM/LOW, all fixed, per-fix table) + mid-point R1 fix confirmation sweep |
| Bookkeeping | `.ai/plans/whatsapp2/trackable-tasks.md` | Phase 15 + 15.1–15.6 flipped to `[x]` |

## 15.6 Verification

- Markdown files are outside all linters: `bun biome check` on touched files reports "No files were processed" (biome ignores .md); oxlint/eslint target TS only — same precedent as Phase 13's DIAGRAMS.md note (sub-loop prints "no matching files" for markdown).
- No `mermaid` code blocks in new docs (grep = 0) → `validate:mermaid` not applicable.
- Only code-adjacent files touched are three AGENTS.md + skill markdown + `.md` docs — no TS/lintable files changed in this phase; no sub-loop targets exist.

## What did NOT need propagation

- `shared/locale/AGENTS.md`: the whatsapp2 i18n work reused (not extended) the documented dual-surface + stable namespace-id conventions.
- Root AGENTS.md elsewhere: no new global rules — durable ingest, per-account adapters, and pair rate limiting are domain facts living in the canonical doc + `backend/services/AGENTS.md`, not repo-wide protocols.

## Plan status

All phases 0–15 + PR-1 gate are `[x]`; `.ai/plans/whatsapp2/` is complete. Open follow-ups live only in `deferred-items.md` (all 📋/D-status, non-blocking).
