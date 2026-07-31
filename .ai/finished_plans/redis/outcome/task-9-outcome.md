# Outcome: Task 9 - Documentation Update

## Summary
Updated `backend/services/AGENTS.md` with the "Hot-resolver & Read Caching (`EntityCacheService`)" subsection outlining key naming conventions, the fail-open contract, permission check scoping, and named tag invalidation helpers.

## Details of Changes
1. **`backend/services/AGENTS.md`**:
   - Documented canonical key formats (`ec:user:${userId}:${roleId}`, `ec:teacher:dir:...`, `ec:parent:dir:...`, etc.).
   - Documented fail-open requirements, permission check ordering, and mutation invalidation rules.

## Verification Results
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase9`): Passed (`success: true`, exit code 0)
