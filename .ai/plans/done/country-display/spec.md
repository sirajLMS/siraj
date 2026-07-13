# CountryDisplay Application — Specification

**Status:** Planning
**Implements:** Apply the new `CountryDisplay` component to every applicable frontend surface, supported by fixing the GraphQL/types drift so `nationality` is exposed and consumed as the `CountryCode` enum it already is in the DB.
**Updates:** [`user-entity-enhancement/ANALYSIS.md`](../user-entity-enhancement/ANALYSIS.md) §7.3 (mark nationality-enum tightening as planned/landed)
**Migration strategy:** **No DB migration required** — the `parents.nationality`, `teachers.nationality`, and `teachers.countryCode` columns are already the native Postgres `country_code` enum (see [`backend/db/schema/parents.ts:15`](../../backend/db/schema/parents.ts), [`backend/db/schema/teachers.ts:19,30`](../../backend/db/schema/teachers.ts)). Drift lives only at the GraphQL + backend-types + frontend-types boundary.

---

## 1. Problem

The `CountryDisplay` component ([`frontend/components/ui/display/countryDisplay/CountryDisplay.tsx`](../../frontend/components/ui/display/countryDisplay/CountryDisplay.tsx)) is landed but has **zero callers**:

| Surface | Today | `CountryDisplay` applies? |
|---|---|---|
| Parent profile — nationality display | `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx:78` renders `parent.nationality` as a bare string | ✅ blocked on enum-typing |
| Parent profile (admin) — nationality display | `frontend/views/dashboard/profile/parent/sections/IdentitySection.tsx:42` renders free-text `nationality` via `InfoField` | ✅ blocked on enum-typing |
| Parent onboarding — nationality input | `frontend/views/dashboard/admin/parents/onboarding/ParentInfoSection.tsx:28-43` already uses `CountrySelect` returning `country.code` | ✅ input side done |
| Teacher onboarding — nationality input | `frontend/views/dashboard/teachers/onboarding/components/TeacherInfoSection.tsx:92-107` already uses `CountrySelect` returning `country.code` | ✅ input side done |
| Teacher onboarding — country-of-residence input | `OfficialDetailsSection.tsx:60-66` uses a hardcoded 5-value `<Select>` instead of `CountrySelect` | ⚠️ should swap to `CountrySelect` |

Meanwhile the stack has a long-standing type-safety drift:

- **DB:** `nationality` is `countryCodeEnum("nationality")` (a `country_code` PG enum) — stores ISO-3166 alpha-2 codes like `"SA"`, `"EG"`.
- **GraphQL:** `nationality` is exposed and accepted as **`String`** everywhere (parent onboarding, parent admin-profile update, parent profile output, teacher onboarding `nationality`), while `countryCode` (teacher only) is correctly the `CountryCode` enum.
- **Backend types/services:** `nationality` typed as `string | null`, weakening safety vs the enum column.
- **Frontend:** `nationality` typed as `string`, rendered as raw text; wrappers/down-casts via `as unknown as Control<ParentOnboardingFormData>`.
- **`parseCountryCode`** ([`backend/lib/enum.ts:2`](../../backend/lib/enum.ts)) is dead code — authored for exactly this gap but has zero call sites.

So the user-facing outcome (`CountryDisplay` everywhere a country is rendered) is gated by a small, no-migration type-tightening across the GraphQL boundary.

---

## 2. Locked product rules

1. **No DB migration.** The schema is correct; do not touch `parents.nationality`, `teachers.nationality`, `teachers.countryCode`, or the `country_code` PG enum. No new Drizzle migration is generated.
2. **GraphQL input + output become the `CountryCode` enum** for every `nationality`/`countryCode` surface, matching the underlying column. Pothos schema-level validation replaces the dead `parseCountryCode`.
3. **No rename of the `nationality` column** this plan. "nationality vs country-of-residence" semantics is a user-entity-enhancement open question (§2.2 / §3.1 of ANALYSIS) and is out of scope here. We only tighten types + apply the display component.
4. **Frontend forms already use `CountrySelect`** for `nationality` where applicable; we keep that and only swap the teacher `<Select>` of `countryCode` for `CountrySelect` (parity) + `CountryDisplay` on read-only surfaces.
5. **`CountryDisplay` is the canonical read-only renderer** for any ISO-3166 country code on the frontend, mirroring how `PhoneDisplay` / `CurrencyDisplay` / `TimezoneDisplay` are already used.
6. **No `console.*`, no hardcoded colors, MUI v9 `sx`-only,** theme callback for palette — per `AGENTS.md`.
7. **Zero new ad-hoc types** — import from `@/backend/types` ↔ generated GraphQL types (`@/frontend/common/graphql/generated/gql/graphql-types`).
8. **Codegen is a hard gate** after every Pothos change: `bun run generate:gqlSchema && bun codegen`.

---

## 3. Scope (IN)

| Layer | Surface | Action |
|---|---|---|
| Backend types | `backend/types/parents/parent.types.ts` (lines 162, 209) | `nationality: CountryCode \| null` |
| Backend types | `backend/types/profile/profile.types.ts` (line 57) | `ParentAdminProfileUpdateInput.nationality: CountryCode \| null` |
| Backend services | `backend/services/parent/parent-onboarding.service.ts:15`, `backend/services/teacher/teacher-onboarding.service.ts:21,31`, `backend/services/profile/profile.service.ts:61-77` | `nationality?: CountryCode \| null`, `countryCode?: CountryCode \| null`; pass through unchanged |
| Pothos OUTPUT | `backend/graphql/pothos/parents/parent-profile.pothos.ts:21` | `nationality: t.expose("nationality", { type: CountryCodePothosObject, nullable: true })` |
| Pothos INPUT | `backend/graphql/pothos/parents/parent-onboarding.pothos.ts:30`, `backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts:34`, `backend/graphql/pothos/profile/profile.pothos.ts:150` | `nationality: t.field({ type: CountryCodePothosObject })` |
| Backend dead code | `backend/lib/enum.ts` `parseCountryCode` | Delete (now-unnecessary coercion — schema enforces enum) |
| Codegen | — | `bun run generate:gqlSchema && bun codegen` |
| Frontend GraphQL docs | `frontend/common/graphql/sharedDocuments/profile.documents.ts` (lines 69, 249), `parent-profile.documents.ts:21` | No doc edits — field selection unchanged |
| Frontend types | `frontend/types/shared.types.ts:180`, `ParentProfileData`, `ParentOwnData`, `ParentAdminData` | Generated types propagate `CountryCode` automatically after codegen |
| Frontend display — parent profile | `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx:78` | Replace bare string with `<CountryDisplay code={parent.nationality} fallback="" />` |
| Frontend display — admin identity section | `frontend/views/dashboard/profile/parent/sections/IdentitySection.tsx:42` | Replace `toDisplayValue(props.adminData.nationality, ...)` with `<CountryDisplay code={props.adminData.nationality} fallback={tc("notSet")} />` |
| Frontend input — teacher country-of-residence | `OfficialDetailsSection.tsx:60-66` | Replace 5-value `<Select>` with `<CountrySelect>` (Controller-bound to `countryCode`) for parity with nationality inputs and the existing full ISO list |
| Frontend input — admin parent profile edit nationality | `IdentitySection.tsx:32` (edit mode) | Replace raw `<TextField>` with `<Controller>` + `<CountrySelect>` (mirror `ParentInfoSection.tsx:28-43`) |
| Tests | `ParentProfileView.test.tsx:86` | Update expectation: nationality now renders via `CountryDisplay` as a localized name — assert e.g. `screen.getByText("Saudi Arabia")` (en) or use `getCountryDisplayName("SA", "en")` in the assertion |
| Storybook | `ParentProfileView.stories.tsx:33` (already `nationality: "SA"`), `ParentProfileEditForm.stories.tsx:19` | Verify stories still render; add an unknown/empty `nationality: null` story case |
| Cross-plan | `.ai/plans/user-entity-enhancement/ANALYSIS.md` §7.3 | Mark "Fix GraphQL to use enum everywhere (stop `t.string` for nationality)" as landed with link |

---

## 4. Scope (OUT)

- Renaming `nationality` column/field or splitting nationality vs country-of-residence semantics — that's user-entity-enhancement's domain.
- Any Drizzle migration or `bun db generate`.
- Moving country fields onto `users` (user-entity-enhancement Phase 1).
- New country-of-residence input for parents (parents have no `countryCode` column today).
- Data cleanup of legacy free-text values in `nationality` — already constrained by the PG enum, so no legacy text exists in the DB (any bad value would have failed insert). No backfill needed.
- Currency / timezone display components (already landed and applied separately).
- SonarQube scan (per project rules: orchestrator-only; sub-agents never trigger).

---

## 5. Acceptance criteria

1. `bun tsgo` — zero new TS errors; ideally removes drift warnings.
2. `bun biome:check` + lint-queue on touched files — clean.
3. After `bun run generate:gqlSchema && bun codegen`, the generated `CountryCode` enum appears as the type of `nationality` on:
   - `ParentProfile` (output)
   - `ParentOnboardingInput.nationality`, `TeacherOnboardingInput.nationality`, `ParentAdminProfileUpdateInput.nationality` (inputs)
4. `CountryDisplay` renders the localized country name + flag emoji in:
   - `ParentProfileDetails` (parent profile view)
   - `IdentitySection` (admin parent profile view)
5. `CountrySelect` is the input for:
   - Teacher `countryCode` (replaces the 5-value `<Select>`)
   - Admin parent profile edit `nationality` (replaces the raw `<TextField>`)
6. **No DB migration** is created by this plan (`git status` shows no new `.sql` under `backend/drizzle/` or `backend/db/migration/`).
7. `ParentProfileView.test.tsx` passes with the updated `CountryDisplay` rendering; a new test asserts the enum value `"SA"` renders as the localized name.
8. Storybook builds; the `AdminView` story of `ParentProfileView` shows the flag + localized name, not the raw `"SA"` string.
9. `user-entity-enhancement/ANALYSIS.md` §7.3 updated.
10. No `console.*`, no hardcoded colors, MUI v9 `sx` only — per `AGENTS.md`.
11. `bun test:ui:components` passes for touched component tests; `bun run test:graphql` passes for the parent/teacher onboarding mutations (enum input validation).
12. `parseCountryCode` removed; no dangling imports.

---

## 6. Risk register

| Risk | Mitigation |
|---|---|
| GraphQL clients sending a free-text `nationality` today | None — the frontend forms already submit ISO codes via `CountrySelect`; no known external clients. If an unknown code is sent, Pothos now rejects at schema level (cleaner than the previous DB-level Postgres error). |
| Teacher `<Select>` swap changes the available country set | True today the 5-value `<Select>` only offered EG/AE/SA/GB/US; the swap widens to the full ISO list, which is the intended product behavior and matches `ParentInfoSection`. Document in the test. |
| `toDisplayValue(props.adminData.nationality, tc("notSet"))` previously handled empty strings | `CountryDisplay` accepts `code?: string \| null` and renders `fallback` when `null`/empty — preserves the "not set" UX. |
| Stale `country?: string` on `ParentEditData` form types | Already `string`; we widen to `CountryCode \| ""` in zod (optional enum). Form still sends `"" \| CountryCode`; GraphQL `nullable` accepts both. |
| Frontend generated types break an existing consumer if `nationality` becomes non-null | We keep `nationality` **nullable** in GraphQL (matches DB nullable + existing optional form field). Only the scalar type changes String → CountryCode. |
| Story assertions rely on raw `"SA"` text | Update `ParentProfileView.test.tsx:86`; switch to localized name. |

---

## 7. Governing rules (per-layer mandatory reading)

| Layer | Rule files |
|---|---|
| Root | `AGENTS.md` |
| Backend types | `backend/AGENTS.md`, `backend/types/AGENTS.md` |
| Backend services | `backend/services/AGENTS.md` |
| Pothos / GraphQL | `backend/graphql/AGENTS.md` |
| Frontend views | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| Frontend GraphQL documents | `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` |
| Tests | `.github/instructions/tests.instructions.md`, `backend/db/test/AGENTS.md` (if DB tests touched — none expected here) |
| Cross-cutting | Lint queue server (never direct `bun lint`); per-file verification loop; sonar-scan prohibition for sub-agents. |
