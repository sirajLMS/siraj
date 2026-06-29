# Teacher Profile — AGENTS.md Violations Fix Plan

**Follows from**: `teacher-profile-refactor.md` implementation
**Scope**: Fix all 17 violation items identified during layer-by-layer AGENTS.md audit

---

## Item Reference Table

| # | Severity | File | Violation |
|---|----------|------|-----------|
| 1 | HIGH | `backend/types/teacher.types.ts` | `TeacherProfileReturnType` is hand-crafted object literal, not derived from `TeacherEntity` via `Omit`/`&` |
| 2 | HIGH | `backend/services/staff-profile.service.ts` | `Record<string, unknown>` defeats type safety on `updateInput` |
| 3 | HIGH | `backend/services/staff-profile.service.ts` | **Bug**: `if (input.dateOfBirth)` drops `null` values — user can't clear dateOfBirth |
| 4 | HIGH | `backend/db/repo/teacher.repository.ts` | Local `TeacherDirectoryRow`/`TeacherDirectoryMetrics` types not in `backend/types/` |
| 5 | HIGH | `backend/db/repo/teacher.repository.ts` | `updateTeacherProfile` uses `Partial<typeof teachers.$inferInsert>` instead of `TeacherProfileUpdateInputType` |
| 6 | HIGH | `backend/db/schema/teachers.ts` | **Missing migration** for new `paymentMethod` column |
| 7 | HIGH | `frontend/graphql/test/teacher.test.ts` | Manual login mutation instead of `loginDemoUser()` helper (duplication) |
| 8 | HIGH | `frontend/components/ui/StatusBadge.tsx` | 8 JSDoc/inline comments violate "no comments" rule |
| 9 | MEDIUM | `backend/services/staff-profile.service.ts` | Redundant `paymentMethod`/`gender` explicit assignments (already in `...input` spread) |
| 10 | MEDIUM | `backend/db/repo/teacher.repository.ts` | `count(*)::int` uses DB-specific cast — should use `.mapWith(Number)` only |
| 11 | MEDIUM | `backend/db/repo/teacher.repository.ts` | Timezone validation (lines 34-39) is business logic, belongs in service layer |
| 12 | MEDIUM | `staff-profile.pothos.ts` | Input `required: false` doesn't allow explicit `null` — needs `{ value: false, nullability: true }` |
| 13 | MEDIUM | `SalaryDetailsSection.tsx` | **Bug**: `sx={{ component: "section" }}` — `component` is not CSS, silently ignored |
| 14 | MEDIUM | 5 component files | JSX comments (`{/* Zoom Link */}`, etc.) violate "no comments" rule |
| 15 | LOW | `SectionHeader.tsx` | `fontWeight: 700` hardcoded font sx — should use theme variant |
| 16 | LOW | `StatusBadge.tsx` | Redundant `case "staffAccount": return null` (already the default) |
| 17 | LOW | 8 files | `Box component="..."` as direct prop (rule conflict — `component` can't go in `sx`) |

---

## Decisions

| Issue | Decision |
|-------|----------|
| Item 12 (Pothos input nullability) | **Skip** — The `{ value: false, nullability: true }` pattern does not exist anywhere in this codebase. All other Pothos input types use `required: false`. This is the established project convention, not a violation. Introducing a new pattern without precedent would be inconsistent. |
| Item 17 (Box component prop) | **Skip** — `<Box component="...">` is the dominant pattern (47 occurrences) across the codebase. `component` is a MUI API prop (not a CSS property) and cannot go in `sx`. The AGENTS.md mention of `component` in the shorthand list is a documentation ambiguity for non-style props, not an actionable rule. Changing all 47 instances is out of scope. |
| Item 6 (Missing migration) | Will generate migration via `bun run db` → option 3 (`drizzle-kit generate --ignore-conflicts`). This is a manual step that must be verified. |
| Item 1 (Types derivation) | Derive from `TeacherEntity` (`$inferSelect`) using `Omit`/`&` pattern. Must handle fields that differ in type from schema (Date→string for dateOfBirth/updatedAt) and joined fields (name, email from users, totalClasses, avgEngagementScore from subqueries). |
| Item 11 (Timezone validation) | Move `Intl.DateTimeFormat` validation from repo to service. The repo should accept the timezone value and let the DB CHECK constraint (`teachers_timezone_chk`) be the final safety net. The service validates before calling the repo. |

---

## Execution Phases

### Phase 1: Backend Types & Repo Fixes (bottom-up)

#### 1a. `backend/types/teacher.types.ts` — Derive types from `TeacherEntity` (Item 1)

Rewrite `TeacherProfileReturnType` using `Omit`/`&` pattern following `ComplaintReturnType` and `Student` as examples:

```ts
export type TeacherProfileReturnType = Omit<
  TeacherEntity,
  | "userId"
  | "status"
  | "gender"
  | "nationality"
  | "countryCode"
  | "paymentMethod"
  | "timezoneId"
  | "zoomPassword"
  | "createdAt"
> & {
  readonly name: string;
  readonly email: string;
  readonly status: AccountStatus;
  readonly gender: Gender | null;
  readonly paymentMethod: PaymentMethod | null;
  readonly dateOfBirth: string | null;
  readonly updatedAt: string;
  readonly totalClasses: number;
  readonly avgEngagementScore: number;
};
```

Fields omitted from `TeacherEntity`:
- `userId` — internal, not exposed in profile
- `status`, `gender`, `paymentMethod` — re-added with proper TS enum types
- `nationality`, `countryCode` — not in the current profile return (not exposed)
- `timezoneId` — internal FK
- `zoomPassword` — sensitive, never returned
- `createdAt` — not in profile return

Fields re-added in `&`:
- `name`, `email` — from users join (not in TeacherEntity)
- `status`, `gender`, `paymentMethod` — with proper enum types
- `dateOfBirth` — overrides schema `Date` type to `string | null` (ISO string)
- `updatedAt` — overrides schema `Date` type to `string` (ISO string)
- `totalClasses`, `avgEngagementScore` — computed subqueries

Also rewrite `TeacherProfileUpdateInputType` using `Omit` from `TeacherEntityInput`:

```ts
export type TeacherProfileUpdateInputType = Partial<Omit<
  TeacherEntityInput,
  | "id"
  | "userId"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "nationality"
  | "countryCode"
  | "timezoneId"
  | "gender"
  | "paymentMethod"
>> & {
  readonly gender?: Gender | null;
  readonly paymentMethod?: PaymentMethod | null;
};
```

#### 1b. `backend/types/teacher.types.ts` — Add directory types (Item 4)

Add `TeacherDirectoryRow` and `TeacherDirectoryMetrics` types following the `ParentDirectoryRow`/`ParentDirectoryMetrics` pattern from `parent.types.ts`:

```ts
export type TeacherDirectoryRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: AccountStatus;
  zoomLink: string | null;
};

export type TeacherDirectoryMetrics = {
  activated: number;
  deactivated: number;
};
```

Note: `status` changed from `string` to `AccountStatus` for type safety.

Also export `TeacherDirectoryFilters` if it exists as a local type in the repo — check during implementation.

#### 1c. `backend/db/repo/teacher.repository.ts` — Multiple fixes (Items 4, 5, 10, 11)

1. **Remove local `TeacherDirectoryRow`/`TeacherDirectoryMetrics`** types (lines 81-94). Import from `@/backend/types/teacher.types`.

2. **Change `updateTeacherProfile` signature** (Item 5): Replace `Partial<typeof teachers.$inferInsert>` with `TeacherProfileUpdateInputType`:
   ```ts
   import type { TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";
   
   export const updateTeacherProfile = async (
     teacherId: string,
     input: TeacherProfileUpdateInputType,
     tx?: DBTransaction
   ): Promise<boolean> => {
   ```

3. **Fix `count(*)::int`** (Item 10): Change `sql<number>\`count(*)::int\`` to `sql<number>\`count(*)\`.mapWith(Number)` — remove the PostgreSQL-specific `::int` cast, let `.mapWith(Number)` handle JS conversion.

4. **Move timezone validation to service** (Item 11): Remove the `Intl.DateTimeFormat` try/catch block (lines 34-39) from the repository. The DB `teachers_timezone_chk` CHECK constraint is the safety net. The validation will be added to the service in Phase 2.

#### 1d. Regenerate codegen

After type changes, run:
```bash
bun run generate:gqlSchema
bun codegen
```

---

### Phase 2: Backend Service Fixes

#### 2a. `backend/services/staff/staff-profile.service.ts` — Fix updateInput (Items 2, 3, 9)

Replace the entire `updateInput` construction with a direct pass-through:

```ts
// BEFORE (buggy):
const updateInput: Record<string, unknown> = {
  ...input,
  paymentMethod: input.paymentMethod,  // redundant
  gender: input.gender,                  // redundant
};
if (input.dateOfBirth) {                // BUG: drops null
  updateInput.dateOfBirth = input.dateOfBirth;
}

// AFTER (clean):
const success = await TeacherRepository.updateTeacherProfile(teacherId, input);
```

This works because:
- `input` is `TeacherProfileUpdateInputType` (all fields optional `?` and nullable `| null`)
- The repo now accepts `TeacherProfileUpdateInputType` (after Item 5 fix)
- No intermediate `Record<string, unknown>` — full type safety
- `dateOfBirth: null` will be correctly passed (no conditional dropping null)
- No redundant `paymentMethod`/`gender` re-assignments

#### 2b. `backend/services/staff/staff-profile.service.ts` — Move timezone validation here (Item 11)

Add timezone validation before calling the repository in `updateTeacherProfile`:

```ts
if (input.timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: input.timezone });
  } catch {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("teacher.invalidTimezone"));
  }
}
```

This ensures validation happens at the service layer (business logic), not the repository layer (data access).

---

### Phase 3: Frontend Component Fixes

#### 3a. `SalaryDetailsSection.tsx` — Fix component bug + remove comments (Items 13, 14)

1. Change `<Box sx={{ component: "section" }}>` → `<Box component="section">`
2. Remove 3 JSX comments:
   - `{/* Base Salary */}`
   - `{/* Currency */}`
   - `{/* Payment Method */}`

#### 3b. `SystemConfigSection.tsx` — Remove comments (Item 14)

Remove 2 JSX comments:
- `{/* Zoom Link */}`
- `{/* Account Status */}`

#### 3c. `SectionHeader.tsx` — Remove hardcoded fontWeight (Item 15)

Remove `sx={{ fontWeight: 700 }}` from `<Typography variant="titleLg">`. The `titleLg` variant should define the correct weight in the theme. If `titleLg` doesn't include `fontWeight: 700` in the theme, we need to check the theme definition. If it's missing, add it to the theme rather than overriding it inline.

Also check `SystemConfigSection.tsx` line 80 which has the same `fontWeight: 700` pattern.

#### 3d. `StatusBadge.tsx` — Remove all comments + dead code (Items 8, 16)

Remove 8 comments:
- 3 JSDoc blocks (lines 7-9, 30-32, 101-104)
- 5 inline comments (lines 106, 116, 129, 169, 184)

Remove dead code:
- `case "staffAccount": return null;` in `resolveStatusPaletteKey` (already the default behavior)

---

### Phase 4: Test File Fixes

#### 4a. `frontend/graphql/test/teacher.test.ts` — Use helpers (Item 7)

1. **Import `loginDemoUser`** — it's already imported on line 11 but not used for the super_admin login. Replace the manual login mutation (lines 101-115) with:
   ```ts
   authToken = await loginDemoUser("super_admin");
   ```

2. **Import `assertOperationDenied`** from `./helpers` and replace 3 manual denial tests:
   - Lines 156-173: Replace with `await assertOperationDenied("teacher_default", "query", teacherDirectoryQueryDocument, { search: "Default", limit: 10 })`
   - Lines 214-229: Replace with `await assertOperationDenied("teacher_default", "query", teacherProfileForEditQueryDocument, { teacherId: targetTeacherIdDenial })`
   - Lines 231-251: Replace with `await assertOperationDenied("teacher_default", "mutate", updateTeacherProfileMutationDocument, { teacherId: targetTeacherIdDenial, input: makeUpdateInput({}) })`

   Note: Need to verify the exact `assertOperationDenied` signature and adapt accordingly.

---

### Phase 5: Database Migration (Item 6)

#### 5a. Generate migration for `paymentMethod` column

Run:
```bash
bun run db
# Select option 3: Generate migration
```

This will produce an `ALTER TABLE teachers ADD COLUMN payment_method payment_method` SQL statement.

#### 5b. Verify migration SQL

Read the generated migration file and confirm it only adds the `payment_method` column to the `teachers` table (no accidental drops or changes to other tables).

#### 5c. Apply migration (optional — may need DB running)

```bash
bun run db
# Select option 5: Apply migrations
```

Only run this if the dev database is available.

---

### Phase 6: Quality Checks

```bash
bun tsgo          # Type-check all layers
bun biome:check   # Lint + format
bun run lint       # ESLint
```

Fix any issues before considering the work done.

---

## Dependencies & Ordering

```
1a (types rewrite) → 1c (repo fixes) → 1d (codegen)
     ↓                    ↓
2a (service fixes) ←─────┘
2b (timezone validation moved to service)
3a-3d (frontend fixes — independent of backend)
4a (test fixes — independent)
5a-5c (migration — independent, can run after 1a)
6 (quality — last)
```

Backend (1a → 1c → 1d → 2a/2b) must be sequential.
Frontend (3a-3d), tests (4a), and migration (5a) can run in parallel after backend is done.

---

## Files Modified

| File | Items | Change Type |
|------|-------|-------------|
| `backend/types/teacher.types.ts` | 1, 4 | Rewrite types + add directory types |
| `backend/db/repo/teacher.repository.ts` | 4, 5, 10, 11 | Remove local types, fix signature, fix cast, move validation |
| `backend/services/staff/staff-profile.service.ts` | 2, 3, 9, 11 | Fix updateInput, remove redundancy, add timezone validation |
| `backend/graphql/pothos/staff-profile.pothos.ts` | — | No change (Item 12 deferred — project convention) |
| `frontend/views/.../SalaryDetailsSection.tsx` | 13, 14 | Fix component bug, remove comments |
| `frontend/views/.../SystemConfigSection.tsx` | 14 | Remove comments |
| `frontend/views/.../SectionHeader.tsx` | 15 | Remove hardcoded fontWeight |
| `frontend/components/ui/StatusBadge.tsx` | 8, 16 | Remove comments, remove dead code |
| `frontend/graphql/test/teacher.test.ts` | 7 | Use helpers |
| Migration file (auto-generated) | 6 | `ALTER TABLE teachers ADD COLUMN payment_method` |

**Items deferred:**
- Item 12 (Pothos input nullability) — project convention, no precedent for `nullability: true`
- Item 17 (Box component prop) — `component` is a MUI API prop, not CSS; 47 existing occurrences follow `<Box component="...">` pattern
