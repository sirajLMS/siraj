# Knowledge Propagation Outcome

## Task 34: Knowledge Propagation & Documentation

### Documents Created
1. **`docs/testing/mutation-argument-coverage.md`** — Canonical reference doc for mutation argument coverage pattern, including:
   - Why full argument coverage matters
   - The pattern (discover args, handle input objects, test both null and non-null for optional fields)
   - Rules/conventions (12 mandatory rules)
   - What NOT to do (anti-patterns)
   - Rollout summary (30 files audited, 13 with changes, 17 already compliant)

### AGENTS.md Files Updated
1. **`frontend/common/graphql/test/AGENTS.md`** — Added rule 11 "Mutation Argument Coverage (CRITICAL)" with key requirements and reference to the new doc
2. **Root `AGENTS.md`** — Added `docs/testing/mutation-argument-coverage.md` to Important References section

### Instructions Files Updated
1. **`.agents/instructions/tests.instructions.md`** — Added "GraphQL Mutation Argument Coverage (CRITICAL)" section with rules and doc reference

### Quality Check Results
- **tsgo**: ✅ 0 errors
- **biome:check**: ✅ 0 errors, no fixes applied
- **lint**: ✅ exitCode 0

### Summary of 30 Test File Subagent Outcomes
- **17 files**: Already compliant — no changes needed (auth, class-session, schedule, report, notification-prefs, session-config, site-content, env-config, group-class, class-session, learning-resource, permission-group-sim, suggestion, teacher-dashboard, teacher-onboarding, auth-impersonation partially)
- **13 files**: Code changes made to add missing optional field coverage
  - billing-management, payment-method, class-instance-detail, complaint, meeting-config, general-settings, parent-onboarding, parent, status-tracking, student-history, student-lifecycle, student-onboarding, manager-directory, manager-onboarding, teacher

### Backend Bugs Found
**None.** No CROSS-FILE DEPENDENCY reports from any subagent. All mutations handled optional fields correctly.

### Key Patterns Discovered
1. Most test files already pass all required args — the gap was in optional field coverage
2. The common pattern for optional fields was testing only `null` — the fix was adding tests with meaningful non-null values
3. `expectedVersion` (optimistic concurrency) was the most common optional field needing non-null test coverage
4. Input object mutations need all nested fields populated, not just top-level
5. Enum fields should use generated enum values (e.g., `CurrencyCode.Usd`), not hardcoded strings
