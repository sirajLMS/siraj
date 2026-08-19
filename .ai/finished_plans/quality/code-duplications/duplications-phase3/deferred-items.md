# Deferred Items: Code Duplication Elimination — Phase 3

**Feature:** Code Duplication Elimination Phase 3
**Version:** 1.0
**Date:** 2026-08-11

---

## Ledger

| ID | Item | Reason | Status | Resolution |
|----|------|--------|--------|------------|
| _(empty — no deferred items yet)_ | | | | |

---

## Predecessor Carry-Forward

| ID | Item | Predecessor | Disposition |
|----|------|-------------|-------------|
| D4-remaining | Timezone enum (`backend/enum/shared/timezone.enum.ts` ↔ `shared/constants/iana-timezone.enum.ts`, 1781 tokens / 446 lines) | Phase 1 D4 → Phase 2 OOS | **IN SCOPE Phase 3** — address in REQ-10 (types consolidation) or dedicated subtask during Phase 3 |

---

## Status Values

- ✅ Done
- ⚠️ Partial
- ❌ Blocked
- 🔄 In Progress

---

## Enforcement

- Task 11.4 MUST verify `grep -c "❌\|⚠️"` returns 0 (excluding template/doc text)
- Plan cannot complete if any ❌ or ⚠️ remains in the ledger table above
- Every deferred item MUST be resolved (or carried forward to a future plan) before plan completion

---

## Common Deferred Patterns (for reference)

- **env-config registration**: new feature flag/config not registered in env-config service
- **cache invalidation incompleteness**: new cache key not invalidated on mutations
- **bulk write operations**: upserts not using Drizzle's bulk insert
- **test coverage gaps**: refactored code path not covered by existing tests
- **schema migration verification**: schema changes not verified with `bun run db generate`

### Anti-Patterns (DO NOT)

- Don't defer without logging in the ledger table above
- Don't use vague descriptions ("fix later", "needs work")
- Don't mark ✅ without verification
- Don't leave ⚠️ unresolved at plan completion
- Don't defer critical bugs — fix immediately
