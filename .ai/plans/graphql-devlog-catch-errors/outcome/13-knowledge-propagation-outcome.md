# Task 13 Outcome — Knowledge Propagation & Documentation

**Date**: 2026-08-19
**Task**: 13. Knowledge Propagation & Documentation

---

## Summary

Synthesized all 33+ outcome files from the `graphql-devlog-catch-errors` plan into a canonical reference document and propagated the knowledge to all relevant AGENTS.md files and instruction files.

## Files Created

1. **`docs/graphql/domain-error-extensions-code.md`** — Canonical reference document covering:
   - Why the pattern exists (silent GraphQL error swallowing, HTTP 400s, no structured codes)
   - Pattern (DomainError extends GraphQLError with `extensions: { code }`, full subclass hierarchy)
   - Rules (10 rules covering DomainError usage, error code conventions, NotFoundError entity convention, ValidationError overload, authScopes UNAUTHORIZED/FORBIDDEN, releaseQuotaIfDeducted warnings, deleteClassInstance result type, notification dispatch WARN, rate limit env flag, bun:test skip pattern)
   - Anti-patterns (plain Error throws, silent try/catch, Boolean returns, rejects.toThrow in runInRollback, unasserted cleanup)
   - Rollout summary (all implementation changes across the codebase)
   - Related documents (5 cross-references)

## Files Modified

2. **`backend/graphql/AGENTS.md`** — Added "DomainError → GraphQLError extensions.code" section with one-line rule referencing the canonical doc.

3. **`backend/AGENTS.md`** — Added "Error Handling" section with cross-reference to the canonical doc.

4. **`AGENTS.md`** (root) — Added `docs/graphql/domain-error-extensions-code.md` to the "Important References" section.

5. **`.agents/instructions/backend.instructions.md`** — Added DomainError rule in the Pothos/GraphQL section: "All GraphQL resolver errors MUST extend DomainError (from `@/backend/lib/errors`) to propagate structured `extensions.code` to clients."

## Verification Results

All 5 modified files were verified via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`:

| File | tsgo | oxlint | Notes |
|------|------|--------|-------|
| `docs/graphql/domain-error-extensions-code.md` | ✅ Pass | N/A (`.md` not linted) | New canonical doc |
| `backend/graphql/AGENTS.md` | ✅ Pass | N/A (`.md` not linted) | Added DomainError section |
| `backend/AGENTS.md` | ✅ Pass | N/A (`.md` not linted) | Added Error Handling section |
| `AGENTS.md` | ✅ Pass | N/A (`.md` not linted) | Added Important References entry |
| `.agents/instructions/backend.instructions.md` | ✅ Pass | N/A (`.md` not linted) | Added DomainError rule |

All files pass tsgo (0 type errors). Oxlint reports "No files found to lint" for `.md` files — this is expected behavior since oxlint's config only targets `.ts`/`.tsx` files. No quality issues found.

## Carry-Forward Knowledge

- The canonical doc at `docs/graphql/domain-error-extensions-code.md` is the single source of truth for the DomainError pattern. All future error-handling work should reference this doc.
- AGENTS.md updates are intentionally one-line rules with doc references — implementation details live in the canonical doc, not in AGENTS.md.
- The `backend.instructions.md` rule uses the `applyTo: "backend/**/*.ts"` frontmatter scope, so it automatically applies to all backend TypeScript files.
- The canonical doc includes code examples using `@/` path aliases per project convention.
- All 33+ outcome files were read and synthesized — key learnings from each task (1-12) are captured in the Rules and Anti-patterns sections.
