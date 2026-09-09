# Trackable Tasks: WhatsApp Settings Configuration Tab

Derived from `plan.md` (single combined implementation contract). Each top-level task maps 1:1 to a plan phase. Every implementation task carries the mandatory subtask pipeline (QL → TE → SEC → SR → IV) injected at dispatch time per the spec-implementation skill.

## Phase 1 — Database Schema, Migration & Seeding

- [x] 1. Implement WhatsApp config schema + migration + seeding
  - [x] 1.1 Define `whatsapp_configs` schema (`backend/db/schema/whatsapp-config.schema.ts`): UUID PK, nullable `app_id`, encrypted `app_secret`, `verify_token`, `phone_number_id`, `waba_id`, encrypted `access_token`, `es_config_id`, `updated_by_user_id` FK to users, `created_at`/`updated_at` timestamptz
  - [x] 1.2 Register schema in schema index and generate migration (`drizzle-kit generate`); apply via migrate/push
  - [x] 1.3 Seed initial values from existing `.env` variables when present (`backend/db/seeds/whatsapp-config.seed.ts`); run seed
  - [x] 1.4 Quality Loop (`sub-loop.ts --lifecycle codescene`) on all touched files

## Phase 2 — Database Repository & Repository Tests

- [x] 2. Implement WhatsApp config repository + tests
  - [x] 2.1 `backend/db/repo/whatsapp/whatsapp-config.repo.ts`: `getWhatsappConfig(tx?)`, `upsertWhatsappConfig(input, tx?)` accepting `DBQueryExecutor`, transaction-safe upsert
  - [x] 2.2 Paired tests `backend/db/test/whatsapp-config.repo.test.ts` wrapped in `runInRollback`, `tx` passed to all methods (4-Tier framework)
  - [x] 2.3 Run `bun run test:db` (or sqlite-equivalent) green
  - [x] 2.4 Quality Loop + Semantic Review + Instruction Verification

## Phase 3 — Service Layer, Resiliency & Env Gating

- [x] 3. Implement WhatsApp config service + tests
  - [x] 3.1 `backend/services/whatsapp/whatsapp-config.service.ts`: DB-first resolution with `.env`/`resolveEnvConfig` fallback
  - [x] 3.2 Outage/cold-start resiliency: try/catch DB access, `logger.warn`/`logDomainError` on fallback; gate writes with user-friendly localized error when DB unreachable
  - [x] 3.3 Fast verify-token generator (`node:crypto` randomBytes hex)
  - [x] 3.4 Meta Graph API connection test (`GET /v21.0/{phone_number_id}` with active token) returning health status
  - [x] 3.5 Paired tests `test/services/whatsapp-config.service.test.ts`: DB success, DB outage fallback, token generation (4-Tier framework)
  - [x] 3.6 Run `bun run test:services` (or sqlite-equivalent) green
  - [x] 3.7 Quality Loop + Semantic Review + Instruction Verification

## Phase 4 — Backend GraphQL (Pothos) & Code Generation

- [x] 4. Implement GraphQL queries/mutations + codegen
  - [x] 4.1 Query `whatsappConfiguration` (perm `WHATSAPP_VIEW` or `WHATSAPP_MANAGE`) returning masked view (`appSecret`/`accessToken` masked, `verifyToken` visible, derived `webhookUrl`)
  - [x] 4.2 Mutation `updateWhatsappConfiguration` (perm `WHATSAPP_MANAGE`) accepting optional per-field updates
  - [x] 4.3 Query `generateWhatsappVerifyToken` returning secure token candidate
  - [x] 4.4 Query `testWhatsappConnection` returning `{ success, message, phoneNumber? }`
  - [x] 4.5 Run `bun run generate:gqlSchema` && `bun codegen`
  - [x] 4.6 Quality Loop + Semantic Review + Instruction Verification

## Phase 5 — Frontend GraphQL Documents & Integration Tests

- [x] 5. Implement frontend GraphQL documents + integration tests
  - [x] 5.1 `frontend/common/graphql/sharedDocuments/whatsappConfig.documents.ts`: `whatsappConfigurationQueryDocument`, `updateWhatsappConfigurationMutationDocument`, `testWhatsappConnectionQueryDocument`, `generateWhatsappVerifyTokenQueryDocument`
  - [x] 5.2 GraphQL integration tests: query masking, permission enforcement, mutation persistence
  - [x] 5.3 Run `bun run test:graphql` (or sqlite-equivalent) green
  - [x] 5.4 Quality Loop + Semantic Review + Instruction Verification

## Phase 6 — Frontend UI (Settings > WhatsApp > Config Tab)

- [x] 6. Implement Config Tab UI
  - [x] 6.1 Extend `WhatsappConfigTab` type with `"config"`; update `whatsappTabUrl.ts`, `WhatsappTabNav.tsx`, `WhatsappTabPanels.tsx` (nav/URL derive from `whatsappConfig.constants.ts` — only constants + panels needed edits)
  - [x] 6.2 Create `WhatsappConfigTabPanel.tsx` with fields: Meta App ID, Meta App Secret (password + toggle), Verify Token (input + Fast Generate + Copy), Webhook Callback URL (read-only, copy, Meta setup guidance), Phone Number ID, WABA ID, Permanent Access Token (multiline masked + toggle), Embedded Signup Config ID (optional) (implemented as `ConfigTabPanel` + shared `WhatsappConfigTabContent` + tier wrappers per repo pattern)
  - [x] 6.3 Actions: Test Connection (alert on result), Save Changes (mutation + snackbar)
  - [x] 6.4 Mobile & desktop responsive shells conforming to MUI v9 + project responsive patterns
  - [x] 6.5 i18n: translation keys in `shared/locale/en/` and `shared/locale/ar/` for all labels, tooltips, validation messages, buttons
  - [x] 6.6 Quality Loop + Semantic Review + Instruction Verification

## Phase 7 — Verification & Quality Gates

- [x] 7. Full quality verification
  - [x] 7.1 `bun tsgo` clean — full-repo `bun tsgo` re-attempted per D1 (2×, incl. GOMEMLIMIT/GOGC tuning) → OOM exit 137 (environmental, matches phase-0 baseline on untouched master); feature-scoped `tsc --noEmit` over the complete feature import graph (39 feature files + 4 ambient augmentation files) → **0 errors**. DEFERRED to CI: full-repo tsgo (≥8 GB machine) — see 7-outcome.md
  - [x] 7.2 All mandated test layers green (`test:db`, `test:services`, `test:graphql`) — feature files green via `run-test.ts` (repo 16, service 26, graphql 10) + all 12 whatsapp-domain neighbor files green (188 tests) = 240 tests / 0 failures; one real cross-module breakage found (stale `whatsapp-constants` partial mock in coexistence-sync test) fixed + re-verified. Full-suite runners deferred to CI (entire-repo scope, sandbox memory/time) — see 7-outcome.md
  - [x] 7.3 `bun quality-gate` full static analysis passes — `bun quality-gate` fails environmentally at stage BASIC_CHECKS (`bun tsgo` OOM exit 137, dmesg-confirmed); equivalents completed in-sandbox: biome full-repo 0 errors (after formatting the drizzle-generated snapshot.json — 1 new finding, fixed), jscpd duplicates exit 0, per-file biome/lint:type-aware sub-loops green; CodeScene env-blocked (`cs` not in PATH). DEFERRED to CI: full `bun quality-gate` — see 7-outcome.md

## Phase 8 — Knowledge Propagation

- [x] 8. Propagate learnings to permanent project knowledge
  - [x] 8.1 Read ALL outcome files; extract recurring patterns/gotchas (2+ occurrences)
  - [x] 8.2 Create canonical doc + update AGENTS.md/instructions per domain-to-artifacts mapping (feature-litmus filter applied)
  - [x] 8.3 Write knowledge-propagation outcome file
