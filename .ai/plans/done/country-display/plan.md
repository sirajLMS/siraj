# CountryDisplay Application — Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Strategy:** Incremental type-tightening followed by frontend display wiring. **No DB migration.**
**Sequence:** strict top-to-bottom phases; each phase completes before the next.
**Verification loop:** per-file `tsgo` → `biome:check` → lint-queue-client BEFORE importing elsewhere. Lint via the **lint queue server** (`~/.bun/bin/bun run scripts/lint-queue-server.ts` running on `http://localhost:4777`; submit via `curl -s -X POST ...`). **Never** run `bun lint` directly.

---

## Existing foundation (already landed — do NOT re-create)

| File | Status |
|------|--------|
| `backend/enum/shared/country.enum.ts` — `CountryCode` TS enum + native PG enum | ✓ |
| `backend/db/schema/parents.ts:15` — `nationality: countryCodeEnum("nationality")` | ✓ |
| `backend/db/schema/teachers.ts:19,30` — `nationality` + `countryCode` enum columns | ✓ |
| `backend/graphql/pothos/shared/enum.pothos.ts:53` — `CountryCodePothosObject` | ✓ |
| `backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts:62` — `countryCode` already enum-typed | ✓ |
| `frontend/components/ui/display/countryDisplay/CountryDisplay.tsx` + stories | ✓ |
| `frontend/components/ui/input/countrySelect/*` + stories | ✓ |
| `frontend/lib/locale/country/*` (lookup, emoji, display) | ✓ |
| Parent onboarding input — `ParentInfoSection` already uses `CountrySelect` | ✓ |
| Teacher onboarding nationality input — `TeacherInfoSection` already uses `CountrySelect` | ✓ |

---

## Phase 1 — Backend types (no migration)

**Goal:** Type tighten `nationality` to `CountryCode | null` at the backend types boundary so the GraphQL layer can reference the enum.

| # | File | Change |
|---|------|--------|
| 1.1 | `backend/types/parents/parent.types.ts:162` | `readonly nationality: CountryCode \| null;` (in `ParentProfileResult`) |
| 1.2 | `backend/types/parents/parent.types.ts:209` | `readonly nationality?: CountryCode \| null;` (in `ParentProfileUpdateInput`) |
| 1.3 | `backend/types/profile/profile.types.ts:57` | `readonly nationality?: CountryCode \| null;` (in `ParentAdminProfileUpdateInput`) |
| 1.4 | Both files | `import type { CountryCode } from "@/backend/enum";` |
| 1.5 | Per-file verify: `bun tsgo` + `bun biome:check` + lint-queue-client curl on each touched file | |

_Rules:_ `AGENTS.md` · `backend/AGENTS.md` · `backend/types/AGENTS.md`

---

## Phase 2 — Services

**Goal:** Service input interfaces accept `CountryCode | null`; nothing else changes structurally (values already flow through unchanged — only TS types tighten).

| # | File | Change |
|---|------|--------|
| 2.1 | `backend/services/parent/parent-onboarding.service.ts:15` | `nationality?: CountryCode \| null;` (import from `@/backend/enum`) |
| 2.2 | `backend/services/teacher/teacher-onboarding.service.ts:21` | `nationality?: CountryCode \| null;` |
| 2.3 | `backend/services/teacher/teacher-onboarding.service.ts:31` | `countryCode?: CountryCode \| null;` (already enum at GraphQL boundary; align service types) |
| 2.4 | `backend/services/profile/profile.service.ts:61-77` | `toParentRepoInput` return type stays `ParentProfileUpdateInput`; with Phase 1.2 the field is now `CountryCode \| null`. No body change needed — type flows automatically. |
| 2.5 | Per-file verify: `bun tsgo` + biome + lint-queue | |

_Rules:_ `AGENTS.md` · `backend/services/AGENTS.md`

---

## Phase 3 — Pothos schema (GraphQL enum at every country boundary)

**Goal:** Stop exposing/accepting `nationality` as `String`; use `CountryCodePothosObject`. Pothos-level enum validation replaces the dead `parseCountryCode`.

| # | File | Change |
|---|------|--------|
| 3.1 | `backend/graphql/pothos/parents/parent-profile.pothos.ts:21` | Replace `t.exposeString("nationality", { nullable: true })` with `t.expose("nationality", { type: CountryCodePothosObject, nullable: true })` |
| 3.2 | `backend/graphql/pothos/parents/parent-onboarding.pothos.ts:30` | Replace `t.string({ directives: { constraint: { maxLength: 512 } } })` with `t.field({ type: CountryCodePothosObject })` for `nationality` |
| 3.3 | `backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts:34` | Replace the `t.string(...)` for `nationality` with `t.field({ type: CountryCodePothosObject, description: "Teacher nationality (ISO-3166 alpha-2)" })` |
| 3.4 | `backend/graphql/pothos/profile/profile.pothos.ts:150` | In `ParentAdminProfileUpdateInputPothosObject`: replace `nationality: t.string({ required: false })` with `t.field({ type: CountryCodePothosObject, required: false })` |
| 3.5 | Import `CountryCodePothosObject` from `@/backend/graphql/pothos/shared/enum.pothos` in each touched file | |
| 3.6 | Per-file verify: `bun tsgo` + biome + lint-queue on each touched Pothos file | |

_Rules:_ `AGENTS.md` · `backend/graphql/AGENTS.md`

---

## Phase 4 — Dead-code removal

**Goal:** Delete `parseCountryCode` — now unreachable; the schema enforces the enum. (Confirmed zero call sites per investigation.)

| # | File | Change |
|---|------|--------|
| 4.1 | `backend/lib/enum.ts` | Remove `parseCountryCode` export (+ the `CountryCode` import it required). Keep `parseGender` if still used elsewhere — verify with `rg parseGender` first. If `parseGender` is also unused, leave the file with only what's referenced. |
| 4.2 | `rg parseCountryCode` (whole repo) | Should now return zero hits. |
| 4.3 | Per-file verify | |

_Rules:_ `AGENTS.md` (AI agent communication: dead code removal is fine, no SUMMARY.md)

---

## Phase 5 — GraphQL schema + codegen

| # | Step | Change |
|---|------|--------|
| 5.1 | Run `bun run generate:gqlSchema` | Regenerates `schema.graphql` |
| 5.2 | Run `bun codegen` | Regenerates `frontend/common/graphql/generated/gql/*` |
| 5.3 | Verify generated `graphql-types.ts` shows `nationality?: CountryCode \| null` (or `Maybe<CountryCode>`) on `ParentProfile`, `ParentOnboardingInput`, `TeacherOnboardingInput`, `ParentAdminProfileUpdateInput`. | |
| 5.4 | Verify generated type for `TeacherOnboardingInput.countryCode` is already `Maybe<CountryCode>` (unchanged). | |

_Rules:_ `frontend/common/graphql/AGENTS.md` — codegen is mandatory after schema changes.

---

## Phase 6 — Frontend zod schemas & shared types

**Goal:** Tighten frontend form schemas so `nationality`/`countryCode` is validated as a `CountryCode` enum value, not an arbitrary string.

| # | File | Change |
|---|------|--------|
| 6.1 | `frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema.ts:11` | `nationality: z.custom<CountryCode>(...)` (mirror the existing `invoiceType` pattern) — import `CountryCode` from `@/frontend/common/graphql/generated/gql/graphql-types` |
| 6.2 | `frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema.ts:27` | `nationality: z.custom<CountryCode>(...)` (same pattern as `countryCode`) |
| 6.3 | `frontend/views/dashboard/profile/parent/parentProfileFormTypes.ts:18` | `nationality: z.custom<CountryCode>(...).optional()`; update `ParentEditData.nationality?: CountryCode \| null` (line 44) |
| 6.4 | `frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema.ts:8` | `nationality: z.custom<CountryCode>(...).optional()` |
| 6.5 | Per-file verify: `bun tsgo` + biome + lint-queue | |

_Rules:_ `AGENTS.md` · `frontend/views/AGENTS.md`

---

## Phase 7 — Frontend admin parent profile edit (CountrySelect for nationality)

**Goal:** The admin parent profile edit form currently uses a raw `<TextField>` for `nationality`. Replace with `CountrySelect` to match `ParentInfoSection:28-43`.

| # | File | Change |
|---|------|--------|
| 7.1 | `frontend/views/dashboard/profile/parent/sections/IdentitySection.tsx:28-37` | In `mode === "edit"` branch, replace the `<TextField label=...nationality />` with a `<Controller name="nationality">` that renders `<CountrySelect country={getCountryByCode(field.value)} setCountryAction={c => field.onChange(c.code)} label={t("fields.nationality")} fullWidth />`. Mirror exactly the pattern in `ParentInfoSection.tsx:28-43`. Drop the unused `TextField` import if nothing else in the file uses it. |
| 7.2 | Same file | After Phase 5 codegen, `nationality` is `CountryCode | ""`; `getCountryByCode` already tolerates empty strings (returns `undefined`). |
| 7.3 | Per-file verify | |

_Rules:_ `AGENTS.md` · `frontend/views/AGENTS.md` · MUI v9 `sx` only (no new style props)

---

## Phase 8 — Frontend teacher onboarding country-of-residence (CountrySelect)

**Goal:** Replace the 5-value hardcoded `<Select>` (`EG/AE/SA/GB/US`) with `<CountrySelect>` so the teacher form uses the same full ISO-3166 catalog the parent form uses.

| # | File | Change |
|---|------|--------|
| 8.1 | `frontend/views/dashboard/teachers/onboarding/components/OfficialDetailsSection.tsx:53-67` | Replace the `<Box component="label">` + `<Select {...register("countryCode")}>` block with a `<Controller name="countryCode" control={control}>` rendering `<CountrySelect country={getCountryByCode(field.value)} setCountryAction={c => field.onChange(c.code)} label={labels.fields.country} fullWidth />`. Keep the required `*` indicator by passing `required` and using the existing `FieldWrapper` or label pattern used in `ParentInfoSection`. Drop `CountryCode` import when the local usage goes away. |
| 8.2 | `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.tsx:113` | `defaultValues.countryCode: CountryCode.Eg` — already a `CountryCode`, keep. |
| 8.3 | Per-file verify | |

_Rules:_ `AGENTS.md` · `frontend/views/AGENTS.md`

---

## Phase 9 — Frontend display (CountryDisplay wired into read-only surfaces)

**Goal:** Apply `CountryDisplay` to the two places country is currently rendered as bare text.

| # | File | Change |
|---|------|--------|
| 9.1 | `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx:78` | Replace `value={parent.nationality}` with `value={<CountryDisplay code={parent.nationality} fallback="" />}`. Import from `@/frontend/components/ui/display`. |
| 9.2 | `frontend/views/dashboard/profile/parent/sections/IdentitySection.tsx:42` | In view mode, replace `value={toDisplayValue(props.adminData.nationality, tc("notSet"))}` with `value={<CountryDisplay code={props.adminData.nationality} fallback={tc("notSet")} />}`. Import from `@/frontend/components/ui/display`. |
| 9.3 | Same files | After codegen, `parent.nationality` / `props.adminData.nationality` is typed `CountryCode | null`. `CountryDisplayProps.code?: string | null` accepts both. |
| 9.4 | Per-file verify: `bun tsgo` + biome + lint-queue on each file | |

_Rules:_ `AGENTS.md` · `frontend/views/AGENTS.md` · MUI v9 — `CountryDisplay` itself uses `sx` only (already correct).

---

## Phase 10 — Tests

**Goal:** Update component tests so the asserted nationality output matches what `CountryDisplay` now renders.

| # | File | Change |
|---|------|--------|
| 10.1 | `frontend/views/dashboard/profile/parent/ParentProfileView.test.tsx:86` | Replace the existing `expect(screen.getByText("Nationality")).toBeTruthy()` with a positive assertion on the rendered country name. After codegen + `useLocale()` shadowing in the test wrapper, `CountryDisplay` calls `getCountryDisplayName("SA", "en")` → `"Saudi Arabia"`. Assert `expect(screen.getByText("Saudi Arabia")).toBeTruthy()`. The label `Nationality` test stays. |
| 10.2 | Add a null case — `ParentProfileView` Storybook already has `nationality: "SA"`; add a `nationality: null` story variant in `ParentProfileView.stories.tsx` (`AdminView` with `nationality: null`) and verify `CountryDisplay` renders the `"not set"` fallback. | |
| 10.3 | Run `bun run test:ui:components` for `ParentProfileView.test.tsx` (via run-test wrapper) | |
| 10.4 | Run `bun run test:graphql` for parent/teacher onboarding mutations — verify enum input is accepted, an invalid `nationality: "ZZ"` is rejected by Pothos at schema level. | (Optional: add one test case for invalid country code rejection in `frontend/common/graphql/test/` if onboarding tests exist; check first.) |

_Rules:_ `.github/instructions/tests.instructions.md` · run-test script for any captured-log test

---

## Phase 11 — Storybook verification

| # | Step | Change |
|---|------|--------|
| 11.1 | `ParentProfileView.stories.tsx` — `AdminView` story | No code change needed (already `nationality: "SA"`); visually confirm the flag + name appears. Add `AdminViewMissingNationality` story with `nationality: null` to exercise the fallback. |
| 11.2 | `ParentProfileEditForm.stories.tsx:19` | Verify the edit form now renders `CountrySelect` for nationality. No data change needed (`nationality: "SA"`). |
| 11.3 | `CountryDisplay.stories.tsx` | Already has `Default`, `EmojiOnly`, `LabelOnly`, `UnknownCode`, `Arabic` — keep as the canonical reference story. |
| 11.4 | `CountrySelect.stories.tsx` | Already exists — no change. |
| 11.5 | Storybook build: `bun run storybook:build` (or the project's storybook command) passes. | |

_Rules:_ `frontend/views/AGENTS.md` (Storybook best practices)

---

## Phase 12 — Cross-plan + docs

| # | File | Change |
|---|------|--------|
| 12.1 | `.ai/plans/user-entity-enhancement/ANALYSIS.md` §7.3 | Update the "Fix GraphQL to use enum everywhere (stop `t.string` for nationality)" line to mark as **landed** with a link to `.ai/plans/country-display/spec.md`. |
| 12.2 | No new SUMMARY.md / CHANGES.md / REPORT.md files | Per AGENTS.md rule. |
| 12.3 | (Optional) `frontend/COMPONENT_PATTERNS.md` or `frontend/IMPLEMENTATION_LEARNINGS.md` — add a one-line note: country display = `CountryDisplay`, mirroring the existing `PhoneDisplay` / `CurrencyDisplay` / `TimezoneDisplay` precedent. Only if a "country display" pattern line is missing. | |

_Rules:_ `AGENTS.md` (AI agent communication rules)

---

## Phase 13 — Quality gate

| # | Step | Change |
|---|------|--------|
| 13.1 | Start lint queue server: `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background) | |
| 13.2 | Run `bun quality-gate` | tsgo → biome → lint → codescene → sonar-results. Fix any failures per AGENTS.md. |
| 13.3 | If CODESCENE fails: `bun run codescene --file <path>` per file. | |
| 13.4 | Final verification: `rg parseCountryCode` returns zero hits; `rg '\.exposeString\("nationality"'` returns zero hits; `rg 'nationality: t\.string\('` returns zero hits. | |

_Rules:_ `AGENTS.md` Quality Gate Workflow — subagents must never run `sonar-scan`; use `sonar-manager` on existing results if `.scannerwork/sonar-result.json` exists.

---

## Cross-file dependencies

1. Phase 1 → Phase 2 (backend types before services type-tighten)
2. Phase 1 → Phase 3 (backend types before Pothos can reference `CountryCode`)
3. Phase 3 → Phase 5 (Pothos changes before codegen)
4. Phase 5 → Phase 6 (codegen before zod schemas can reference generated `CountryCode`)
5. Phase 5 → Phases 7–9 (codegen before frontend form/display reads `CountryCode | null`)
6. Phase 9 → Phase 10 (display wired before tests assert the new output)
7. Phase 10 → Phase 12 (tests pass before closing the user-entity-enhancement ANALYSIS)

## Summary

| Metric | Count |
|---|---|
| Phases | 13 (1–13) |
| New files | 0 |
| Modified files | ~17 |
| Cross-plan updates | 1 (`user-entity-enhancement/ANALYSIS.md`) |
| DB migrations | 0 (schema already correct) |
| Dead code removed | 1 (`parseCountryCode`) |

**Execution order:** Phase 1 (types) → Phase 2 (services) → Phase 3 (Pothos) → Phase 4 (dead code) → Phase 5 (codegen) → Phase 6 (zod) → Phases 7–9 (frontend forms/display, can be parallel — see tasks.md) → Phase 10 (tests) → Phase 11 (storybook) → Phase 12 (docs) → Phase 13 (quality gate).
