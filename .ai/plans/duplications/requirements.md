# Requirements Document: Code Duplication Elimination

## Document Information

- **Feature Name**: Code Duplication Elimination (jscpd 1021 clones)
- **Target Directory**: `.ai/plans/duplications`
- **Outcome Directory**: `.ai/plans/duplications/outcome`
- **Version**: 1.0
- **Date**: 2026-08-08
- **Author**: Kilo Agent
- **Stakeholders**: Backend Team, Frontend Team, QA Team, DevOps

## Introduction

The codebase contains 1,021 code clones detected by jscpd (`bun check:duplicates`), representing 8.40% duplicated lines and 9.06% duplicated tokens across 3,316 files. This technical debt increases maintenance burden, creates inconsistency risks, and violates DRY principles. The duplication spans multiple categories: common/desktop/mobile UI triplication (largest category), shared-layer enum violations, in-flight locale namespace migrations, stale hook copies, identical container/view pairs, parallel test runner duplication, and various cross-layer utility duplicates.

### Feature Summary
Systematically eliminate all 1,021 code clones through phased extraction, canonicalization, and migration while maintaining zero regressions and enforcing per-file quality gates.

### Business Value
- Reduce maintenance surface by ~24K duplicated lines
- Eliminate inconsistency bugs from divergent copies
- Establish canonical patterns for future development
- Improve codebase health metrics (CodeScene, SonarQube)
- Enable faster feature development through shared abstractions

### Scope
**In Scope:**
- All 1,021 jscpd-reported clones across 8 categories
- Common/desktop/mobile UI triplication via `*Shared.tsx` scaffold extraction
- Shared-layer enum violation resolution (**canonical source only — NO re-exports**)
- Locale namespace migration completion (delete monolithic files)
- Stale hook deletion (canonical hooks in `common/hooks/`)
- Container/view deduplication (**canonical source only — NO re-exports**)
- Parallel test runner consolidation (shared utility module)
- Cross-layer utility deduplication (canonical source selection — **NO re-exports**)

**Out of Scope:**
- New feature development
- Architecture refactoring beyond deduplication
- Test coverage expansion (existing tests must pass)
- Performance optimization unrelated to deduplication

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts (`bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`) to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/duplications/deferred-items.md` from template to track all deferred work.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/duplications/outcome/` to absorb prior research, search results, and pitfalls.
4. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/plans/duplications/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, implementation details, cross-file dependencies, and carry-over points.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
6. WHEN any file is modified THEN system SHALL execute per-file verification (`bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts -f <file> --id verify`) on that specific file.
7. WHEN any subtask is marked complete THEN system SHALL complete semantic review checklist (race conditions, env-config, deferred items, cross-layer, enums) before marking `[x]`.

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer implementing user-facing features, I want compile-time type-safe translations and correct enum imports, so that I catch i18n and type errors at build time instead of runtime.

#### Acceptance Criteria (Translation System)

1. WHEN client component renders user-facing text THEN system SHALL use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal).
2. WHEN translation object is accessed THEN system SHALL use property access (`t.propertyName`) NOT function calls (`t('propertyName')`).
3. WHEN server component renders user-facing text THEN system SHALL use `await getTranslations(locale)` (single arg) and access namespace as property: `t.Dashboard.FeatureName`.
4. WHEN GraphQL resolver returns user-facing text THEN system SHALL use `ctx.t("namespace")` with string key (already bound to `ctx.locale`).
5. WHEN namespace directory is created THEN system SHALL use lowercase casing (`shared/locale/namespaces/ui/featureName.namespace.ts` NOT `Ui/FeatureName/`).

#### Translation System Anti-Patterns (FORBIDDEN)

- ❌ `useAppTranslation("DashboardFeature")` — string literal
- ❌ `getTranslations(locale, "namespace")` — two args
- ❌ `t('propertyName')` — function call
- ❌ Hardcoded strings in UI components
- ❌ `next-intl` imports (legacy, removed)
- ❌ `getBackendTranslations` (legacy, removed)
- ❌ `shared/messages/` references (directory removed)

#### Acceptance Criteria (Enum Imports)

6. WHEN enum is used in runtime expression THEN system SHALL import as value (not `import type`).
7. WHEN enum is used in conditional/cast/object literal THEN system SHALL import as value.
8. WHEN enum consumer exists THEN system SHALL use enum members NOT string literals.

### Requirement 1: Common/Desktop/Mobile UI Triplication Elimination

**User Story:** As a developer, I want a single canonical implementation for UI components shared across common/desktop/mobile tiers, so that changes propagate automatically and inconsistencies are impossible.

#### Acceptance Criteria

1. WHEN a component exists in all three tiers (common/, desktop/, mobile/) with >90% identical code THEN system SHALL extract a `*Shared.tsx` scaffold in `common/components/ui/<category>/` with slot props for tier-specific variations.
2. WHEN `*Shared.tsx` scaffold is created THEN system SHALL refactor all three tier variants to consume the scaffold via composition (passing tier-specific slots) instead of duplicating JSX.
3. WHEN tier-specific differences exist (e.g., default size 36 vs 40, circular outline) THEN system SHALL expose them as optional props on the scaffold with sensible defaults.
4. WHEN refactoring is complete THEN system SHALL verify zero visual regressions via existing Storybook stories and UI tests.
5. WHEN refactoring is complete THEN system SHALL run `bun check:duplicates` and confirm clone count reduction for the addressed component cluster.

**Priority**: High | **Complexity**: High | **Dependencies**: Requirement 0, Requirement 0.5

### Requirement 2: Shared-Layer Enum Violation Resolution

**User Story:** As a developer, I want enums defined in exactly one canonical location, so that the shared layer never imports from backend/ and type safety is maintained without re-exports.

#### Acceptance Criteria

1. WHEN `enum/shared/system-setting.enum.ts` and `constants/settings/system-settings.enum.ts` are 100% identical THEN system SHALL designate `constants/settings/system-settings.enum.ts` as the single canonical source.
2. WHEN canonical source is designated THEN system SHALL delete `enum/shared/system-setting.enum.ts` entirely (NO re-export).
3. WHEN deletion is complete THEN system SHALL update all importers to use the canonical path `@/constants/settings`.
4. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm this clone pair is eliminated.

**Priority**: High | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 3: Locale Namespace Migration Completion

**User Story:** As a developer, I want the locale namespace migration finished so that duplicate translation keys are eliminated and the new modular structure is the single source of truth.

#### Acceptance Criteria

1. WHEN `locale/{en,ar}/profile.ts` exists alongside `locale/{en,ar}/profile/{teacher,parent,staff,notifications}/index.ts` THEN system SHALL verify all imports reference the new sub-namespaces.
2. WHEN all imports are migrated THEN system SHALL delete the monolithic `profile.ts` files.
3. WHEN `locale/{en,ar}/ui/meeting-config.ts` exists alongside `locale/{en,ar}/ui/meetingConfig/{display,manager}.ts` THEN system SHALL verify all imports reference the new sub-namespaces and delete the monolithic files.
4. WHEN `locale/{en,ar}/ui/payment-method.ts` exists alongside `locale/{en,ar}/ui/paymentMethod/manager.ts` THEN system SHALL verify all imports reference the new sub-namespaces and delete the monolithic files.
5. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm locale clone pairs are eliminated.
6. WHEN complete THEN system SHALL verify translation system compliance (Requirement 0.5) for all modified locale files.

**Priority**: High | **Complexity**: Medium | **Dependencies**: Requirement 0, Requirement 0.5

### Requirement 4: Stale Hook Copy Deletion

**User Story:** As a developer, I want only canonical hooks to exist so that there is no confusion about which implementation to use or maintain.

#### Acceptance Criteria

1. WHEN `common/hooks/usePhoneInput.ts` (canonical) and `common/components/ui/input/phoneInput/usePhoneInput.ts` (stale copy) exist THEN system SHALL verify all imports use the canonical path.
2. WHEN verified THEN system SHALL delete the stale copy at `common/components/ui/input/phoneInput/usePhoneInput.ts`.
3. WHEN `common/hooks/useTagInputEditing.ts` (canonical) and `common/components/ui/input/tagInput/useTagInputEditing.ts` (stale copy) exist THEN system SHALL verify all imports use the canonical path and delete the stale copy.
4. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm these clone pairs are eliminated.

**Priority**: High | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 5: Container/View Deduplication

**User Story:** As a developer, I want container components to be eliminated in favor of a single canonical view implementation so that test/story imports and page imports converge on the same code without re-exports.

#### Acceptance Criteria

1. WHEN `common/views/dashboard/profile/staff/StaffProfileContainer.tsx` and `StaffProfileView.tsx` are 100% identical THEN system SHALL designate `StaffProfileView.tsx` as the single canonical source.
2. WHEN canonical source is designated THEN system SHALL delete `StaffProfileContainer.tsx` entirely (NO re-export).
3. WHEN deletion is complete THEN system SHALL update all importers (e.g., `ProfilePageClient.tsx`) to import directly from `@/views/dashboard/profile/staff`.
4. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm this clone pair is eliminated.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 6: Parallel Test Runner Consolidation

**User Story:** As a developer, I want a single shared test runner utility so that parallel execution logic is maintained in one place and improvements benefit all test suites.

#### Acceptance Criteria

1. WHEN `run-db-tests-parallel.ts`, `run-services-tests-parallel.ts`, `run-integration-tests-parallel.ts` share ~199 duplicated lines THEN system SHALL extract a shared module `scripts/test/run-parallel-tests.ts` with configurable parameters (test pattern, concurrency, timeout, label).
2. WHEN shared module is created THEN system SHALL refactor all three runners to import and invoke the shared function with their specific configurations.
2. WHEN refactoring is complete THEN system SHALL run each test suite (`bun run test:db`, `bun run test:services`, `bun run test:integration`) and verify all pass.
3. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm these clone pairs are eliminated.

**Priority**: Medium | **Complexity**: Medium | **Dependencies**: Requirement 0

### Requirement 7: Cross-Layer Utility Deduplication

**User Story:** As a developer, I want each utility function to have exactly one canonical implementation so that behavior is consistent and maintenance is centralized — without any re-exports.

#### Acceptance Criteria

1. WHEN `lib/enum.ts` and `common/lib/enum.ts` are duplicates THEN system SHALL designate `common/lib/enum.ts` as canonical and update all importers to use it directly (NO re-export from `lib/enum.ts` — delete it).
2. WHEN `db/repo/utils/resolve-localized.ts` and `common/lib/localized-string.ts` are duplicates THEN system SHALL designate `common/lib/localized-string.ts` as canonical (shared layer) and update all importers to use it directly (NO re-export from `db/repo/utils/resolve-localized.ts` — delete it).
3. WHEN `lib/auth/permissions.ts` and `services/auth/permissions.service.ts` are duplicates THEN system SHALL designate `services/auth/permissions.service.ts` as canonical and update all importers to use it directly (NO re-export from `lib/auth/permissions.ts` — delete it).
4. WHEN `lib/env-config-resolver.ts` and `services/system/environment-config.service.ts` are duplicates THEN system SHALL designate `services/system/environment-config.service.ts` as canonical and update all importers to use it directly (NO re-export from `lib/env-config-resolver.ts` — delete it).
5. WHEN `lib/meeting-config.validation.ts`, `services/meeting/meeting-url-parser.ts`, and `common/lib/meeting-config.ts` overlap THEN system SHALL consolidate into `common/lib/meeting-config.ts` as canonical with clear separation of validation vs parsing — delete the other two files (NO re-exports).
6. WHEN `common/lib/currency.ts` and `common/lib/static-currency-catalog.ts` overlap THEN system SHALL investigate intent (static data vs utility) and either merge into one canonical file or clearly separate with documentation (NO re-exports).
7. WHEN `types/notifications/notification-alerts.metadata.types.ts` and `common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types.ts` share 65 lines THEN system SHALL extract shared types to `shared/types/notification-alerts.types.ts` as the single canonical source — update both files to import from there and delete duplicate definitions (NO re-exports).
8. WHEN `common/views/dashboard/admin/__shared__/adminDashboardHooks.ts` and `useAdminDashboard.ts` are 100% identical (114 lines) THEN system SHALL designate `useAdminDashboard.ts` as canonical (hook naming convention) and delete `adminDashboardHooks.ts` entirely (NO re-export).
9. WHEN `common/views/dashboard/admin/billing/utils/billingMetrics.ts` and `common/views/dashboard/billing/utils/billingMetrics.ts` are duplicates THEN system SHALL designate `common/views/dashboard/billing/utils/billingMetrics.ts` as canonical (broader scope) and delete the admin version entirely (NO re-export).
10. WHEN `common/components/ui/dataGrid/types/appDataGridShared.types.ts` and `types/datagrid-types/appDataGridShared.types.ts` are duplicates THEN system SHALL designate `common/components/ui/dataGrid/types/appDataGridShared.types.ts` as canonical (colocated with component) and delete `types/datagrid-types/appDataGridShared.types.ts` entirely (NO re-export).
11. WHEN complete for each pair THEN system SHALL run `bun check:duplicates` and confirm clone elimination.

**Priority**: Medium | **Complexity**: Medium | **Dependencies**: Requirement 0

### Requirement 8: Admin Dashboard Hooks Deduplication

**User Story:** As a developer, I want the admin dashboard hooks to exist in exactly one file so that state management logic is not duplicated.

#### Acceptance Criteria

1. WHEN `common/views/dashboard/admin/__shared__/adminDashboardHooks.ts` and `useAdminDashboard.ts` are 100% identical (114 lines) THEN system SHALL designate `useAdminDashboard.ts` as canonical (hook naming convention) and delete `adminDashboardHooks.ts` entirely (NO re-export).
2. WHEN complete THEN system SHALL verify all imports work and run `bun check:duplicates` to confirm elimination.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 9: Billing Metrics Deduplication

**User Story:** As a developer, I want billing metrics utilities in one location so that calculations are consistent across admin and general dashboard views.

#### Acceptance Criteria

1. WHEN `common/views/dashboard/admin/billing/utils/billingMetrics.ts` and `common/views/dashboard/billing/utils/billingMetrics.ts` are duplicates THEN system SHALL designate `common/views/dashboard/billing/utils/billingMetrics.ts` as canonical (broader scope) and delete the admin version entirely (NO re-export).
2. WHEN complete THEN system SHALL verify all imports work and run `bun check:duplicates` to confirm elimination.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 10: DataGrid Types Deduplication

**User Story:** As a developer, I want DataGrid shared types defined once alongside the component so that type changes are atomic with component changes.

#### Acceptance Criteria

1. WHEN `common/components/ui/dataGrid/types/appDataGridShared.types.ts` and `types/datagrid-types/appDataGridShared.types.ts` are duplicates THEN system SHALL designate `common/components/ui/dataGrid/types/appDataGridShared.types.ts` as canonical (colocated with component) and delete `types/datagrid-types/appDataGridShared.types.ts` entirely (NO re-export).
2. WHEN complete THEN system SHALL verify all imports work and run `bun check:duplicates` to confirm elimination.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 11: Notification Alert Types Deduplication

**User Story:** As a developer, I want notification alert metadata types defined in shared/types so that both backend and frontend can consume them without cross-layer imports.

#### Acceptance Criteria

1. WHEN `types/notifications/notification-alerts.metadata.types.ts` and `common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types.ts` share 65 lines THEN system SHALL extract shared types to `shared/types/notification-alerts.types.ts` as the single canonical source — update both files to import from `@/shared/types` and delete duplicate definitions (NO re-exports).
2. WHEN complete THEN system SHALL verify no cross-layer import violations and run `bun check:duplicates` to confirm elimination.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 12: Meeting Config Consolidation

**User Story:** As a developer, I want meeting configuration logic consolidated so that validation, parsing, and URL generation share a single source of truth.

#### Acceptance Criteria

1. WHEN `lib/meeting-config.validation.ts`, `services/meeting/meeting-url-parser.ts`, and `common/lib/meeting-config.ts` overlap THEN system SHALL consolidate into `common/lib/meeting-config.ts` as canonical.
2. WHEN consolidated THEN system SHALL separate concerns: validation functions, parsing functions, URL generation functions — all exported from the single module.
3. WHEN complete THEN system SHALL update all importers and verify `bun run test:services` passes for meeting-related tests.
4. WHEN complete THEN system SHALL run `bun check:duplicates` to confirm elimination.

**Priority**: Medium | **Complexity**: Medium | **Dependencies**: Requirement 0

### Requirement 13: Currency Utility Resolution

**User Story:** As a developer, I want clarity on whether currency utilities are static data or computed functions so that the correct abstraction is used.

#### Acceptance Criteria

1. WHEN `common/lib/currency.ts` and `common/lib/static-currency-catalog.ts` overlap (34 lines / 745 tokens) THEN system SHALL investigate whether this is intentional static data duplication or extractable logic.
2. IF extractable THEN system SHALL consolidate into a single canonical module with clear separation of static catalog vs utility functions.
3. IF intentional THEN system SHALL document the distinction in both files and add `.jscpd.json` ignore pattern for this specific pair.
4. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm either elimination or documented exclusion.

**Priority**: Low | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 14: Storybook Story Deduplication Decision

**User Story:** As a developer, I want a decision on whether `.stories.tsx` triplication should be deduplicated via shared story factories or excluded from jscpd analysis.

#### Acceptance Criteria

1. WHEN `.stories.tsx` files show triplication across common/desktop/mobile THEN system SHALL evaluate: (a) extract shared story factory functions, or (b) add ignore globs to `.jscpd.json`.
2. WHEN decision is made THEN system SHALL implement the chosen approach.
3. WHEN complete THEN system SHALL run `bun check:duplicates` and confirm story clones are either eliminated or excluded from report.

**Priority**: Low | **Complexity**: Low | **Dependencies**: Requirement 0

### Requirement 15: Final Verification & Quality Gate

**User Story:** As a stakeholder, I want confirmation that all 1,021 clones are addressed and no regressions introduced.

#### Acceptance Criteria

1. WHEN all requirements are complete THEN system SHALL run `bun check:duplicates` and verify clone count is 0 (or only documented exclusions remain).
2. WHEN clone count is verified THEN system SHALL run full quality gate: `bun quality-gate` (tsgo → biome → lint → codescene → sonar-results).
3. WHEN quality gate passes THEN system SHALL run all test suites: `bun run test:db`, `bun run test:services`, `bun run test:integration`, `bun run test:ui:components`, `bun run test:ui:e2e`.
4. WHEN all tests pass THEN system SHALL compare final error counts against baseline (Requirement 0) and confirm no new errors introduced.
5. WHEN complete THEN system SHALL write final outcome document and update deferred-items.md with all items resolved.

**Priority**: High | **Complexity**: High | **Dependencies**: All prior requirements

## UX/Navigation Requirements (MANDATORY)

This is a code quality/refactoring feature with no user-facing routes, navigation, or UI changes. The UX/Navigation section is not applicable.

| Aspect | Status |
|--------|--------|
| New Routes | None — internal refactoring only |
| Sidebar Navigation | None |
| Per-Audience Rendering | None |
| Mobile vs Desktop | N/A — refactoring affects both equally |
| Permission Mapping | N/A |

## Non-Functional Requirements

### Performance Requirements
- WHEN `bun check:duplicates` runs THEN it SHALL complete in <60 seconds (current baseline).
- WHEN quality gate runs THEN it SHALL complete in <10 minutes (current baseline).

### Security Requirements
- WHEN refactoring authentication/permission utilities THEN system SHALL preserve exact runtime behavior.
- WHEN modifying shared-layer exports THEN system SHALL not expose backend internals to frontend.

### Usability Requirements
- WHEN developers import canonical modules THEN import paths SHALL be intuitive and follow existing conventions.
- WHEN Storybook stories are updated THEN they SHALL render identically to pre-refactor state.

### Reliability Requirements
- WHEN any refactoring is complete THEN all existing tests SHALL pass without modification.
- WHEN `*Shared.tsx` scaffolds are created THEN they SHALL be backward-compatible with existing tier variant props.

## Constraints and Assumptions

### Technical Constraints
- Must use Bun (not Node.js) for all commands
- Must follow Next.js 16 App Router conventions (read `node_modules/next/dist/docs/`)
- Must use MUI v9 `sx` prop pattern (no direct style props)
- Must use React 19 `React.SubmitEvent` (not deprecated `FormEvent`)
- Must use compile-time i18n system (`shared/locale/`) — no `next-intl`
- Must use `@/*` path aliases (never relative imports)
- **Must use barrel file imports via `index.ts` for shortened paths** (e.g., `@/constants/settings` not `@/constants/settings/system-settings.enum`, `@/shared/types` not `@/shared/types/notification-alerts.types`)
- Shared layer must NEVER import from `@/frontend/**`, `@/backend/**`, `@/app/**`
- Database tests MUST use `runInRollback` wrapper and pass `tx` to all repo methods
- GraphQL documents MUST include `id` field for Apollo cache normalization
- NO `useLazyQuery` — use stateful `useQuery` exclusively
- Type definitions MUST come from `backend/types/{entity}.types.ts` — no local definitions in Pothos files

### Business Constraints
- Zero downtime deployment — all changes must be backward compatible
- No new dependencies without architecture review
- Timeline: phased execution over multiple sessions

### Assumptions
- Existing test coverage is sufficient to catch regressions
- jscpd configuration (`.jscpd.json`) is correct except for the `$schema` warning
- The `*Shared.tsx` scaffold pattern (e.g., `baseDeleteDialogShared.tsx`) is the approved abstraction pattern
- Canonical hook locations (`common/hooks/`) are the established convention
- Locale namespace migration is an approved in-flight initiative

## Success Criteria

### Definition of Done
- [ ] All 1,021 jscpd clones addressed (eliminated or documented exclusion)
- [ ] `bun check:duplicates` reports 0 clones (or only documented exclusions)
- [ ] `bun quality-gate` passes with zero errors/warnings
- [ ] All test suites pass: `bun run test:db`, `bun run test:services`, `bun run test:integration`, `bun run test:ui:components`, `bun run test:ui:e2e`
- [ ] No new TypeScript/ESLint/Biome errors vs baseline
- [ ] All outcome documents written to `.ai/plans/duplications/outcome/`
- [ ] All deferred items resolved (✅ Done)
- [ ] Knowledge propagation docs created in `docs/`

### Acceptance Metrics
- Clone count: 1,021 → 0 (or documented exclusions)
- Duplicated lines: 23,926 (tsx) + 4,887 (ts) → 0
- Duplicated tokens: 134,737 (tsx) + 28,529 (ts) → 0
- Quality gate: PASS
- Test suites: ALL PASS
- Baseline error delta: 0 new errors

## Glossary

| Term | Definition |
|------|------------|
| jscpd | JavaScript/TypeScript Copy/Paste Detector — duplication analysis tool |
| `*Shared.tsx` | Scaffold component with slot props for tier-specific composition |
| Canonical | The single authoritative implementation that all duplicates reference |
| Re-export | `export { Thing } from "./canonical"` — zero-runtime-cost delegation |
| Tier | One of: common (shared), desktop, mobile — the three UI variants |
| runInRollback | Database test wrapper that rolls back transactions after each test |
| tx | Drizzle transaction object — must be passed to all repo methods in tests |
| Translation enum | Compile-time i18n namespace keys (e.g., `Translation.Dashboard.Profile`) |

---

## Requirements Review Checklist

### Completeness
- [x] All user stories have clear roles, features, and benefits
- [x] Each requirement has specific acceptance criteria using EARS format
- [x] Non-functional requirements are addressed
- [x] Success criteria are defined and measurable
- [x] Navigation/sidebar/tabs defined for all user types (N/A — internal refactoring)
- [x] Permissions mapped to all new routes/pages (N/A)

### Quality
- [x] Requirements are written in active voice
- [x] Each acceptance criterion is testable
- [x] Requirements avoid implementation details
- [x] Terminology is consistent throughout

### EARS Format Validation
- [x] WHEN statements describe specific events or triggers
- [x] IF statements describe clear conditions or states
- [x] WHILE statements describe continuous behaviors
- [x] WHERE statements describe specific contexts
- [x] All statements use SHALL for system responses

### Clarity
- [x] Requirements are unambiguous
- [x] Technical jargon is explained in glossary
- [x] Stakeholders can understand all requirements
- [x] No conflicting requirements exist

### Traceability
- [x] Requirements are numbered and organized
- [x] Dependencies between requirements are clear
- [x] Requirements link to business objectives
- [x] Assumptions and constraints are documented