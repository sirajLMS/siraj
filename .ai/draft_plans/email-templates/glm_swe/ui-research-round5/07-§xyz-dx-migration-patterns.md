# Round 5 Audit: §X / §Y / §Z — DX + Migration + Implementation Patterns

## Summary
- Total subsections audited: X1-X7, Y1-Y8, Z1-Z8 (23 total)
- INVALID designs: 0 hard-invalid; 2 with wrong line-number references (Y3 instruction text, Z3-Z4 wording)
- PARTIAL designs: 4 (X4, Y2, Z3, Z7)
- NEW gaps: 6 (X6 runner-tooling mismatch, Y1 manifest-tool coupling, Y3 stale line refs, Y7 Vercel log drain unverified, Z4 enum value mismatch, cross-cutting: startup env validation)
- v9 fixes verified correct: 11/13

## §X Findings

### X1 — VERIFIED CORRECT
- `bun run db -- seed` ✓, `Bun.spawn` ✓
- `scripts/dbActions/actions.ts:53` runs `drizzleSeed.ts` ✓
- `scripts/safe-dev.ts` uses `Bun.spawn` with `onExit` + teardown ✓

### X2-X3 — VERIFIED COMPLETE (additive docs)

### X4 — PARTIAL (residual wording issue + unprecedented mock dir)
- Path `backend/services/communication/channels/email/mock/MockEmailAdapter.ts` ✓
- `EmailChannelFactory` ✓, `EmailProviderRegistry` does NOT exist ✓
- `IEmailChannel` interface methods verified ✓
- NEW gap: No precedent for `mock/` sub-directory (sms has only `twilio/`, push only `fcm/`) — email mock = first

### X5 — VERIFIED COMPLETE


### X7 — VERIFIED COMPLETE

## §Y Findings

### Y1 — PARTIAL (manifest-tool coupling underspecified)
- Custom `.custom-migrations.json` manifest at `backend/drizzle/.custom-migrations.json` ✓
- Custom runner: `backend/db/scripts/migrate.ts` / `applyCustomMigrations.ts` ✓
- NEW gap: design doesn't name `applyCustomMigrations.ts` or `sqlBreakpoints.ts`
- Word error: `bun run db -- generate` is not real syntax (it's interactive `bun run db` → select "3")

### Y2 — VERIFIED COMPLETE (5-step rollback runbook)

### Y3 — PARTIAL (edits correct, stale line refs)
- Actual edits CORRECT and landed at: line 2217 (Phase 1), line 2216 (Phase 2), line 1354 (section heading), line 97 (note) ✓
- INVALID: instruction text at lines 2055/2057/2058 says "Amend line 1954" and "line 1315" — those lines contain W7 content and safeRender code, NOT Phase 1 definitions
- Fix: update instruction text to reference actual line numbers or section headings

### Y4-Y5 — VERIFIED COMPLETE

### Y6 — VERIFIED CORRECT
- `getEnvArray` does NOT exist in `backend/lib/env.ts` ✓
- Existing env helpers confirmed ✓
- `communication.service.ts:37` confirmed ✓

### Y7 — PARTIAL (Vercel log drain unverified)
- No `slack|Slack|webhook|sendAlert` in `backend/` ✓
- `logger.error/warn/info` methods ✓
- NEW gap: Vercel log drain not configured — aspirational, not operational

### Y8 — VERIFIED COMPLETE

## §Z Findings

### Z1 — VERIFIED CORRECT
- `shared/locale/types/emails/` EXISTS ✓
- `ComplaintResponseEmailLabels` + `SuggestionAcknowledgedEmailLabels` ✓
- `EmailsLabels` aggregator at line 28-31 ✓

### Z2 — VERIFIED COMPLETE

### Z3 — PARTIAL (decision correct, wording error)
- `complaints` table confirmed: NO `title` or `subject` column ✓
- Option (c) `body.slice(0, 50)` ✓ chosen, matches existing `renderComplaintResponseEmail` convention ✓
- Minor: "50 chars" asserted without rationale, not configurable

### Z4 — PARTIAL (enum semantic mismatch)
- `createPgEnumFromEnum` at `backend/utils/db.utils.ts:3` ✓
- INVALID enum values: `EmailAttachmentEncoding { BASE64="base64", BUFFER="buffer" }` mixes wire encoding (`base64`) with JS runtime type (`buffer`) — semantically inconsistent
- `buffer` is NOT a valid MIME Content-Transfer-Encoding
- Design's own disclaimer (line 2129) says "drop pgEnum if not persisted" — contradicts line 2128 "register via createPgEnumFromEnum"
- Fix: (a) use valid MIME encodings only, or (b) drop pgEnum (runtime-only TS enum)

### Z5 — VERIFIED CORRECT
- `findByIdempotencyKeys(keys: string[], tx?)` at `credit.repository.ts:135` ✓

### Z6 — VERIFIED CORRECT
- §M at design line 833 ✓; Z6 amendment correctly redirects ✓

### Z7 — VERIFIED IN PLACE (no action needed)
- `eslint.config.mjs` ALREADY handles `backend/**/*.tsx` ✓
- NOTE: actual file is `eslint.config.mjs` not `eslint.config.js`
- NEW gap: biome.json scope for backend .tsx unverified

### Z8 — VERIFIED CORRECT
- `shared/locale/en/messages.ts` EXISTS ✓
- `@/shared/locale/…` alias imports ✓
- Alphabetical position ✓

## v9 Fix Side-Effects
1. **Y3 stale line refs (INTRODUCED)**: lines 2055/2057/2058 reference wrong lines (W7 content, safeRender) — actual edits at 97, 1354, 2216-2217
2. **Z4 enum semantic mismatch (INTRODUCED)**: `base64` (wire) + `buffer` (runtime) conflated — pgEnum registration amplifies confusion
3. **X4 citation actually correct** — no side effect

## Recommendations for v10
1. **Y3**: Replace stale line refs with actual line numbers or section headings
2. **Z4**: Pick ONE — valid MIME encodings only, OR drop pgEnum (runtime-only TS enum)
3. **Y1**: Name `applyCustomMigrations.ts`, `sqlBreakpoints.ts`; fix `bun run db -- generate` syntax
5. **X4**: Note precedent-free mock dir
6. **Z7**: Verify biome.json scope for backend .tsx
7. **Y7**: Operationalize monitoring or add "wiring item" note
8. **Cross-cutting**: Register new email env vars in `validateEnvironment()` at `backend/lib/env.ts:366`
9. **Cross-cutting**: Error boundary around `@react-email/editor` (complex third-party component)

## Bottom line
All 13 v9 R4 fixes landed correctly structurally. Remaining wrinkles: Y3 stale line refs (cosmetic), Z4 enum semantic self-contradiction (needs decision), and cross-cutting gaps in startup env validation + editor error boundary + migration-pipeline verification.
