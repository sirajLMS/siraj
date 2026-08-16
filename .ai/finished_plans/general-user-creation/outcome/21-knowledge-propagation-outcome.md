# Task 21: Knowledge Propagation Outcome

## Summary

Completed knowledge propagation for the general-user-creation feature. Created a canonical reference doc and updated 5 AGENTS.md files with layer-specific rules and doc references.

## Files Created

| File | Purpose |
|------|---------|
| `docs/services/general-user-creation.md` | Canonical reference documenting the full flow (service → mutation → frontend), `createUserOfType` null-extension pattern, specialized group filtering, cache eviction, store simplification, Zod v4 patterns, testing patterns |

## Files Modified

| File | Change |
|------|--------|
| `backend/services/AGENTS.md` | Added "General User Onboarding" section documenting the `createUserOfType` null-extension pattern + doc reference |
| `backend/graphql/AGENTS.md` | Added "General User Create Mutation Pattern" section documenting authScopes + dynamic group slug + doc reference |
| `frontend/views/AGENTS.md` | Added "General User Creation Form Pattern" section documenting non-specialized group dropdown + Zod v4 patterns + doc reference |
| `shared/AGENTS.md` | Added "Specialized Group Constants" section documenting `SPECIALIZED_GROUP_SLUGS`/`SPECIALIZED_GROUP_SLUG_SET`/`isSpecializedGroup()` |
| `AGENTS.md` (root) | Added one-line reference to `docs/services/general-user-creation.md` in Important References section |
| `.ai/plans/general-user-creation/tasks.md` | Changed task 21 checkbox from `[ ]` to `[x]` |

## Key Patterns Documented

1. **`createUserOfType<void>` null-extension**: `createExtension: async () => null`, `afterExtension: undefined` — creates a user without a specialized profile extension
2. **Specialized group filtering**: `SPECIALIZED_GROUP_SLUG_SET.has(slug)` rejects student/teacher/parent groups in both backend service and frontend dropdown
3. **`groupSlug` widening**: `SystemPermissionGroupSlug` → `string` in `CreateUserOfTypeOptions` to support custom non-system group slugs
4. **Cache eviction for directory queries**: Evict root `users` + all 4 directory queries (`teacherDirectory`, `managerDirectory`, `parentDirectory`, `studentDirectory`) + `cache.gc()`
5. **Store simplification**: Zustand store holds only `result` — submission state tracked by `useOnboardingSubmit` + Apollo `loading`
6. **Zod v4**: `z.enum(AccountStatus)` (not `z.nativeEnum()`), `z.email()` via pipe, `AccountStatus` from codegen types
7. **Testing**: `runInRollback` + `expectRejection` try/catch (not `rejects.toThrow`), `setupServiceSpies`/`testRejection` helpers, `for...of` parametric tests, `buildGeneralUserInput`/`isRecord` builders

## Verification Results

### Quality Loop (`sub-loop.ts --lifecycle codescene`)

Ran `~/.bun/bin/bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all 7 modified/created files:

| File | tsgo | oxlint | Notes |
|------|------|--------|-------|
| `docs/services/general-user-creation.md` | ✅ pass | ⚠️ N/A | Markdown file — oxlint has no lintable code (expected "No files found to lint") |
| `backend/services/AGENTS.md` | ✅ pass | ⚠️ N/A | Same |
| `backend/graphql/AGENTS.md` | ✅ pass | ⚠️ N/A | Same |
| `frontend/views/AGENTS.md` | ✅ pass | ⚠️ N/A | Same |
| `shared/AGENTS.md` | ✅ pass | ⚠️ N/A | Same |
| `AGENTS.md` (root) | ✅ pass | ⚠️ N/A | Same |
| `.ai/plans/general-user-creation/tasks.md` | ✅ pass | ⚠️ N/A | Same |

**tsgo passed on all files** — no TypeScript errors introduced. The oxlint stage reports "No files found to lint" with exit code 1 for all files, which is expected for `.md` files (oxlint only lints `.ts`/`.tsx`/`.js` files). No actual lint diagnostics exist in any of these files.

Verified by running `oxlint --deny-warnings` directly on each file: all return "No files found to lint. Please check your paths and ignore patterns." with zero diagnostics.

### UI Tests

Not run — user explicitly forbade UI tests for this task.
