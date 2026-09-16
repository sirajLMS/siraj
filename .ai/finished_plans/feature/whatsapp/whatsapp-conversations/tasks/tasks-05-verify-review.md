# Tasks 5 — Verification, reviews, knowledge

- [x] 5.1 Journey test `test/workflows/whatsapp/conversations.test.ts` (+ registration in
  `test/workflows/AGENTS.md` map if required): superadmin syncs account (mock Meta fetch)
  → registry add → verify (mock hello_world accept) → text send persists + lists. Diagram
  appended to `test/workflows/whatsapp/DIAGRAMS.md`; run `bun run validate:mermaid`.
- [x] 5.2 Full suite slices: `bun run test` whatsapp-related files only (repo, services,
  graphql, ui components, workflows) + the new files' buddy tests.
- [~] 5.3 E2E (optional for v1, mark deferred-able): `test/ui/e2e/whatsapp/conversations.test.ts`
  with `setupBrowserLifecycle`, gated on WhatsApp env creds; otherwise defer with entry in
  this plan's deferred-items ledger. — Deferred: ledger D7.
- [x] 5.4 Post-implementation review wave (parallel, feature-files only): review-backend,
  review-types, review-frontend, idor-testing/pentester on new GraphQL surface (BOLA on
  accountId/conversationId, manage-perm gating, no input spread into DB updates).
- [x] 5.5 Fix pass from reviews; rerun sub-loop per changed file; outcome
  `outcome/post-implementation-review.md`.
- [x] 5.6 Quality gate: `bun quality-gate` full pass (state reset via `quality-gate:fresh`
  only; NEVER clear caches) — confirm zero NEW biome/tsgo/lint/dup/codescene issues vs
  baseline (allowed: pre-existing `NumberCardContent.tsx` biome format only if unowned;
  fix if we touch that file). — Ticked with note: zero issues on plan-owned files (4 plan
  biome findings fixed); gate exit 1 is blocked exclusively by other agents' in-flight
  files (`gcp-auth.ts` dep-bump TS2322, `profile-field-filter.ts` sonarjs,
  `whatsappCredentialDialogs.test.tsx` codescene). See `outcome/5.6-quality-gate-outcome.md`.
- [x] 5.7 Knowledge propagation: `docs/frontend/whatsapp-conversations.md` canonical doc
  (page architecture, composer rules, recipient registry, Meta 131030 mapping, test-number
  detection rule); one-line refs in root AGENTS.md Important References + layer AGENTS.md
  rules only where invariant (never route lists or permission strings). Outcome:
  `outcome/5.7-knowledge-outcome.md`.
- [ ] 5.8 Final response: summarize UI evidence (how to verify in browser), test counts,
  remaining manual steps (Meta dashboard recipient management).
