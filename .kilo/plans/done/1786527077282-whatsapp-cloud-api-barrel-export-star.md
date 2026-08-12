# Plan: Shortest-Path Service Imports Across All Backend

## Goal

Enforce that **all non-service modules** across the backend import from `@/backend/services` (the root barrel) — never from longer paths like `@/backend/services/communication/channels/whatsapp`. The only exception: files **within** `backend/services/` itself may use longer paths when two files are in the same directory subtree (to prevent circular dependencies).

Additionally, convert the root `backend/services/index.ts` barrel from `@/` aliases to `./` relative paths, and add all missing service subdirectories to the root barrel chain.

## Scope

**In scope:**
- All files outside `backend/services/` that import from `@/backend/services/...` (186 files across `backend/graphql/`, `backend/lib/`, `backend/types/`, `backend/db/`, `scripts/`, `app/`, `test/`)
- The root `backend/services/index.ts` barrel (convert `@/` → `./`, add missing service dirs)
- Missing `index.ts` barrels in service subdirs that are imported externally

**Out of scope:**
- Files **inside** `backend/services/` importing from other service paths (these stay as-is — same-package imports use `@/` aliases per ESLint rule, and long paths are needed to prevent circular deps)
- `backend/services/cron/queue-adapters/` — loaded via dynamic `import()` in factory (lazy by design; must NOT be in a barrel)
- `backend/services/communication/templates/` — dead code (never imported); no barrel needed
- The whatsapp cloud-api barrel (already done in prior task)

## Current state

### Root barrel (`backend/services/index.ts`)
- Uses `@/` aliases (violates `./` rule)
- Missing 15 service subdirs: `classes`, `cache`, `cron`, `group-class`, `history`, `meeting`, `notification`, `performance`, `resource`, `schedule`, `scheduling`, `session`, `shared`, `subject`, `users`

### Missing `index.ts` barrels (imported externally, need creation)
| Dir | Files | External importers |
|---|---|---|
| `meeting/channels/` | `IMeetingChannel.ts`, `MeetingChannelFactory.ts` | graphql, app/api, types, tests |
| `meeting/integrations/` | `meeting-integrations.service.ts`, `meeting-oauth.service.ts`, `token-refresh.ts` | graphql, app/api |
| `group-class/` | `group-class.service.ts` | graphql, seeds |
| `history/` | `student-history.service.ts` | graphql |
| `performance/` | `class-performance.service.ts` | seeds |
| `resource/` | `book.service.ts`, `learning-resource.service.ts` | graphql, seeds |
| `schedule/` | 8 service files | graphql, app, scripts |
| `scheduling/` | `availability.service.ts`, `state-change-validation.service.ts` | scripts, graphql, repo |
| `session/` | `class-session.service.ts`, `class-instance-expiry.service.ts` | scripts, graphql |
| `shared/` | `CacheInterface.ts`, `is-duplicate-error.ts` | seeds |
| `subject/` | `class-category.service.ts`, `class-subject.service.ts`, `teacher-notes.service.ts` | graphql, seeds |
| `users/` | `session-config.service.ts` | graphql |

### Dirs that do NOT need barrels
| Dir | Reason |
|---|---|
| `communication/templates/` | Dead code — never imported |
| `cron/queue-adapters/` | Lazy-loaded via dynamic `import()` — barrel would break lazy loading |
| `meeting/channels/zoom/` | Lazy-loaded via dynamic `import()` in `MeetingChannelFactory` — barrel would break lazy loading |
| `meeting/channels/google-meet/` | Lazy-loaded via dynamic `import()` in `MeetingChannelFactory` — barrel would break lazy loading |
| `meeting/channels/microsoft-teams/` | Lazy-loaded via dynamic `import()` in `MeetingChannelFactory` — barrel would break lazy loading |
| `meeting/utils/` | Only imported internally within `meeting/` |

## Naming collision check

Verified: no duplicate export names across any service sub-barrels. `schedule/` and `scheduling/` have no collisions. `user/` and `users/` have no collisions.

## Ordered task list

### Phase 1: Create missing barrels + fix root barrel

1. **Create `meeting/channels/index.ts`** — `export * from "./IMeetingChannel"; export * from "./MeetingChannelFactory";` (NOT the adapter subdirs `zoom/`, `google-meet/`, `microsoft-teams/` — they're lazy-loaded via dynamic `import()` in the factory)

2. **Create `meeting/integrations/index.ts`** — `export * from "./meeting-integrations.service"; export * from "./meeting-oauth.service"; export * from "./token-refresh";`

3. **Update `meeting/index.ts`** — add `export * from "./channels"; export * from "./integrations";` (keep existing exports)

4. **Create `group-class/index.ts`** — `export * from "./group-class.service";`

5. **Create `history/index.ts`** — `export * from "./student-history.service";`

6. **Create `performance/index.ts`** — `export * from "./class-performance.service";`

7. **Create `resource/index.ts`** — `export * from "./book.service"; export * from "./learning-resource.service";`

8. **Create `schedule/index.ts`** — `export *` from all 8 service files (not test files)

9. **Create `scheduling/index.ts`** — `export * from "./availability.service"; export * from "./state-change-validation.service";`

10. **Create `session/index.ts`** — `export * from "./class-session.service"; export * from "./class-instance-expiry.service";`

11. **Create `shared/index.ts`** — `export * from "./CacheInterface"; export * from "./is-duplicate-error";`

12. **Create `subject/index.ts`** — `export * from "./class-category.service"; export * from "./class-subject.service"; export * from "./teacher-notes.service";`

13. **Create `users/index.ts`** — `export * from "./session-config.service";`

14. **Rewrite `backend/services/index.ts`** — convert all `@/` to `./`, add all missing service dirs:
    ```ts
    export * from "./auth";
    export * from "./billing";
    export * from "./cache";
    export * from "./classes";
    export * from "./communication";
    export * from "./cron";
    export * from "./fx";
    export * from "./group-class";
    export * from "./history";
    export * from "./meeting";
    export * from "./notification";
    export * from "./parent";
    export * from "./payment-method";
    export * from "./performance";
    export * from "./pricing";
    export * from "./profile";
    export * from "./redis";
    export * from "./resource";
    export * from "./schedule";
    export * from "./scheduling";
    export * from "./session";
    export * from "./shared";
    export * from "./staff";
    export * from "./storage";
    export * from "./student";
    export * from "./subject";
    export * from "./supervisor";
    export * from "./system";
    export * from "./teacher";
    export * from "./user";
    export * from "./users";
    export * from "./whatsapp";
    ```

### Phase 2: Update all external importers (186 files)

15. For each file outside `backend/services/` that imports from `@/backend/services/<long-path>`, change the import to `@/backend/services`. This is a mechanical replacement:

**Pattern:** `from "@/backend/services/<subdir>/<...>"` → `from "@/backend/services"`

**Affected directories (by count):**
- `backend/db/seeds/` (26 files)
- `backend/graphql/` (pothos + query + mutation + utils) (~50 files)
- `backend/lib/` (auth, features, etc.) (~10 files)
- `backend/types/` (2 files)
- `backend/db/repo/` (4 files)
- `scripts/` (6 files)
- `app/` (few files)
- `test/integration/` (meeting, communication) (~10 files)

**Execution strategy:** Use parallel subagents (one per directory cluster) to do the mechanical import-path replacements. Each subagent:
1. Finds all `from "@/backend/services/<long-path>"` imports in its assigned files
2. Replaces with `from "@/backend/services"`
3. Merges duplicate imports from the same module (ESLint `import-x/no-duplicates`)
4. Runs `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` per file

**Edge case — type-only imports:** Some files import types from service files (e.g., `import type { MeetingProvider } from "@/backend/services/meeting/channels/IMeetingChannel"`). These should also use `@/backend/services` since the type is re-exported through the barrel chain.

**Edge case — dynamic imports:** Files using `await import("@/backend/services/cron/queue-adapters/...")` or `await import("@/backend/services/meeting/channels/zoom/...")` must NOT be changed — these are lazy-loaded by design (factory pattern). Only convert static `import ... from` statements.

### Phase 3: Validation

16. **Run `bun tsgo`** — verify zero new type errors (pre-existing `CurrencyCode`/`ClassOutcome` errors are out of scope)

17. **Run `bun run lint`** — verify zero new lint errors (especially `import-x/no-duplicates` from merged imports)

18. **Run affected test suites:**
    ```bash
    bun run test:services
    bun run test:db
    bun run test:integration:sequential
    ```

19. **Run `bun quality-gate`** — full quality gate to catch any cascading issues

## Risks

- **Circular dependencies**: Adding all service dirs to the root barrel could create circular import chains if service A imports service B and both are in the root barrel. Mitigation: the root barrel only re-exports; circular deps would manifest as tsgo errors. If a circular dep is found, the offending service should import the specific dependency via a longer path (the allowed exception for same-package files).

- **Export name collisions**: Adding 15 new service dirs to the root barrel could cause `TS2308: Module has already exported a member named 'X'` if two dirs export the same symbol. Mitigation: pre-checked — no collisions found. If one appears during tsgo, rename the function in the source file.

- **Dynamic import breakage**: Accidentally converting a `await import("@/backend/services/cron/queue-adapters/...")` to the root barrel would break lazy loading. Mitigation: only convert static `import ... from` statements, never `await import(...)`.

- **Barrel explosion**: The root barrel now re-exports ~35 service dirs. This is fine for tree-shaking in production builds (Next.js/Turbopack handles this), but could slow down dev server cold starts slightly. Acceptable trade-off for import-path consistency.

## Validation commands

```bash
# Verify no long service imports remain outside backend/services/
rg 'from "@/backend/services/' --type ts -l | grep -v node_modules | grep -v '^backend/services/' | wc -l
# Expected: 0 (or only dynamic import() lines)

# Verify root barrel uses ./ only
rg 'from "@/' backend/services/index.ts
# Expected: no output

# Type check
bun tsgo

# Lint
bun run lint

# Tests
bun run test:services
bun run test:db
```
