# Plan Review — Round 1

**Date:** 2025-01-24
**Reviewer:** plan-review skill (automated)
**Scope:** All 4 plan files — requirements.md, design.md, tasks.md, deferred-items.md
**Result:** PASS (after fixes applied)

## Methodology

The review subagent read all 4 plan files and every applicable AGENTS.md:
- Root `AGENTS.md` (always applicable)
- `backend/services/AGENTS.md`
- `backend/db/repo/AGENTS.md`
- `backend/types/AGENTS.md`
- `backend/graphql/AGENTS.md`
- `frontend/views/AGENTS.md`
- `frontend/common/graphql/AGENTS.md`
- `app/AGENTS.md`
- `shared/AGENTS.md`

## Violations Found: 15 (all fixed)

| # | Layer | File | Rule | Fix Applied |
|---|-------|------|------|-------------|
| 1 | All | design.md | No re-exports | Changed "via barrel imports" → "via canonical direct imports" |
| 2 | App Router | design.md | Type imports from `@/backend/types` | `withPageAuth` PageProps local type → import from `@/backend/types/page.types` |
| 3 | App Router | design.md | UserContext import | Added `import type { UserContext }` to withPageAuth code example |
| 4 | Backend Services | design.md | Type imports | Added "Types imported from `@/backend/types/{entity}.types.ts`" note to MeetingAdapterBase |
| 5 | Backend Services | design.md | Type imports | Added type import note to FxAdapterBase |
| 6 | Backend Services | design.md | Type imports | Added type import note to Auth Simulation Base |
| 7 | Backend Services | design.md | Type imports | Added type import note to ComplaintSuggestionBaseService |
| 8 | Backend Repos | design.md | Type imports + location | Clarified `makeSelectMapper` in types layer, not repos |
| 9 | Backend GraphQL | design.md | pgEnum-string comparison | Added `String()` cast for `directionFilter` enum comparison |
| 10 | Schema | design.md | Dynamic key access (oxlint) | Changed `makeFileJunctionTable` to typed config object pattern |
| 11 | Schema | design.md | Duplicate `timestamp()` call | Fixed `supportedPaymentMethodBase` to remove duplicate `timestamp("updated_at").timestamp(...)` |
| 12 | Test | design.md | `no-object-type-as-default-prop` | Added `const DEFAULT_OPTS = {}` module-level constant for `mockNextNavigation` |
| 13 | Test | design.md | Path aliases (relative import) | Changed `"../helpers/mockNavigation"` → `"@/test/ui/components/helpers/mockNavigation"` |
| 14 | Backend Types | design.md | Flat convention (no `__shared__/`) | Changed `backend/types/meeting/__shared__/meeting-config-base.types.ts` → `backend/types/meeting-config-base.types.ts` |
| 15 | All (i18n) | tasks.md + requirements.md | Wrong i18n function | Clarified `getServerTranslations` from `@/shared/locale/server-graphql` for backend services; `getTranslations` only for React Server Components. Added i18n + circular-dep checks to all 27 semantic review subtasks. |

## Additional Improvements Applied

- **Pagination helper**: Added note that `PaginationArgs` is a runtime class (value import, not `import type`)
- **Semantic review checklist count**: Updated from "10-point" to "12-point" to include i18n compliance and circular-dep check
- **Subagent prompt template**: Updated i18n guidance to specify correct function per layer (client/server/backend/graphql)
- **REQ-0.5 acceptance criteria**: Updated to list all 4 i18n function variants with their correct import paths

## Conclusion

All 15 plan-review violations have been resolved. The plan is compliant with all AGENTS.md rules for affected layers and ready for execution.
