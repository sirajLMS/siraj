# Knowledge Propagation Outcome: Neon Plan Tasks 2 & 3

**Date:** 2026-07-30  
**Task:** Knowledge Propagation (Post-Tasks 2.1, 2.2, 3.1)  
**Status:** ✅ Completed

---

## Summary

Propagated all learnings from the Neon Database Performance Optimization plan (Tasks 2.1, 2.2, and 3.1) into the project's permanent knowledge base: canonical reference docs, layer AGENTS.md files, instruction files, and skills.

---

## Changes Made

### 1. New Docs

#### `docs/graphql/dataloader-batching.md` (NEW)
Canonical reference for Pothos DataLoader batching. Covers:
- Why DataLoader (N+1 elimination)
- Pattern A: `loadableObject` / `loadableObjectRef` for top-level entity types
- Pattern B: `t.loadable()` for field-level batching (scalar and object reference)
- Pattern C: Batch service methods (`resolveXxxForUsers`)
- Pattern D: Batch repository methods (`findByXxxIds`)
- What NOT to use DataLoader for (list-typed fields, write operations)
- Rollout summary from Task 3.1
- Step-by-step guide for adding DataLoader to a new domain

### 2. Updated Docs

#### `docs/drizzle/prepared-statements.md`
- Replaced "Array Parameters (`inArray`) — CRITICAL PROHIBITION" with "Batch Lookup by Array of IDs (`inArray`)" — the `inArray` + `sql.placeholder` pattern IS supported and was proven in Task 3.1
- Added batch lookup code example with `Map<string, T | null>` return type convention
- Updated rollout summary table to include Task 3.1 batch methods (teacher `findByUserIds`, parent `findByUserIds`)
- Added `docs/graphql/dataloader-batching.md` and Task 3.1 outcome to Related Documents

### 3. Updated Layer AGENTS.md Files

#### `backend/graphql/AGENTS.md`
- Added **DataLoader Batching (CRITICAL)** rule: all field resolvers calling services/repos per-parent MUST use `t.loadable()` or `loadableObject`
- Reference to `docs/graphql/dataloader-batching.md`

#### `backend/graphql/pothos/AGENTS.md`
- Added **DataLoader Batching (CRITICAL)** section under Other Rules
- Documented `t.loadable()` list-type limitation
- Documented batch service/repo method conventions

#### `backend/services/AGENTS.md`
- Added **Batch Service Methods for DataLoader** rule
- Naming convention: `resolve{Entity}IdsForUsers` returning `Map<string, T | null>`
- Reference to `docs/graphql/dataloader-batching.md`

#### `backend/AGENTS.md`
- Added **Batch Lookup Methods** bullet to Repository Layer section
- Added **Batch Service Methods** bullet to Service Layer section
- Added **DataLoader Batching** bullet to GraphQL Layer section

#### `backend/db/repo/AGENTS.md`
- Added **Batch Lookup Methods for DataLoader** rule
- `findBy{Key}Ids(ids: string[], tx?)` returning `Map<string, T | null>`
- `inArray(column, sql.placeholder("ids"))` with transaction fallback
- Pre-initialize map with all keys → null

### 4. Updated Instruction Files

#### `.agents/instructions/backend.instructions.md`
- Added **Prepared Statements (CRITICAL)** and **Batch Lookup Methods** to Repository Layer section
- Added **Batch Service Methods** to Service Layer section
- Added **DataLoader Batching (CRITICAL)** to Pothos/GraphQL section

### 5. Updated Skills

#### `.agents/skills/drizzle/SKILL.md`
- Added batch lookup note: `inArray(column, sql.placeholder("ids"))` IS supported
- Added `Map<string, T | null>` return convention
- Reference to `docs/graphql/dataloader-batching.md`

### 6. Updated Root AGENTS.md

- Added `docs/graphql/dataloader-batching.md` to Important References section

### 7. Bug Fixes (Discovered During Quality Checks)

- **`backend/db/repo/parents/parent.repository.ts`**: Renamed `_findByUserIdsPrepared` → `findByUserIdsPrepared` and wired it to `findByUserIds()` method with transaction fallback
- **`backend/db/repo/shared/timezone.repository.ts`**: Renamed `_findByIanaIdsPrepared` → `findByIanaIdsPrepared` and wired it to `findByIanaIds()` method with transaction fallback

---

## Quality Verification

```
✅ bun tsgo          — 0 errors
✅ bun biome:check   — 0 errors (4530 files, no fixes needed)
✅ bun run lint      — 0 errors, 0 warnings
```

---

## Files Modified

| File | Change |
|---|---|
| `docs/graphql/dataloader-batching.md` | NEW — canonical DataLoader reference |
| `docs/drizzle/prepared-statements.md` | Updated — batch lookup pattern, rollout table, related docs |
| `backend/graphql/AGENTS.md` | Added DataLoader batching rule |
| `backend/graphql/pothos/AGENTS.md` | Added DataLoader batching section |
| `backend/services/AGENTS.md` | Added batch service methods rule |
| `backend/AGENTS.md` | Added batch lookup, batch service, DataLoader bullets |
| `backend/db/repo/AGENTS.md` | Added batch lookup methods rule |
| `.agents/instructions/backend.instructions.md` | Added prepared statements, batch lookup, batch service, DataLoader rules |
| `.agents/skills/drizzle/SKILL.md` | Added batch lookup note |
| `AGENTS.md` (root) | Added `docs/graphql/dataloader-batching.md` to Important References |
| `backend/db/repo/parents/parent.repository.ts` | Fixed unused prepared statement, wired to method |
| `backend/db/repo/shared/timezone.repository.ts` | Fixed unused prepared statement, wired to method |

---

## Domain-to-Artifacts Mapping (Per Spec-Driven Development SKILL.md)

| Plan Domain | Docs Subdir | AGENTS.md Updated | Skills Updated | Instructions Updated |
|---|---|---|---|---|
| GraphQL / Pothos | `docs/graphql/` | `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md` | — | `backend.instructions.md` |
| Backend services | — | `backend/services/AGENTS.md`, `backend/AGENTS.md` | — | `backend.instructions.md` |
| Drizzle / DB patterns | `docs/drizzle/` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `drizzle/SKILL.md` | `backend.instructions.md` |