# Plan Review Round 1 — zoom-meeting-fixes

## Date
2025-01-24

## Plan Bundle Reviewed
- `.ai/plans/zoom-meeting-fixes/specs.md`
- `.ai/plans/zoom-meeting-fixes/design.md`
- `.ai/plans/zoom-meeting-fixes/tasks.md`

## Affected Architecture Layers

This is a **plan-correction plan** — it amends:
- `.ai/draft_plans/in-app-meeting-view/specs.md` (planning document)
- `.ai/draft_plans/in-app-meeting-view/design.md` (planning document)
- `.ai/finished_plans/auto-meeting-url/outcome/research-outcome.md` (planning document)
- `docs/services/meeting-providers.md` (canonical doc)

**No source code** in `app/`, `frontend/`, `backend/`, or `shared/` is modified by this plan.

The only cross-cutting AGENTS.md rules applicable to the *plan artifacts* are:

1. **i18n** — the spec introduces translation keys (`waitingForHost`, `hostJoinTimeout`). Per `shared/AGENTS.md`, all user-facing strings must use the compile-time TypeScript i18n system in `shared/locale/`.

## Findings

### Violation 1 — Mismatched translation namespace path convention (MEDIUM)

**[SHARED] `.ai/plans/zoom-meeting-fixes/specs.md` REQ-0.5 AC #1 / `design.md` Translation Requirement table**

- **Expected:** Per `shared/AGENTS.md` Namespace Registration rules, new translation keys MUST be added under the canonical directory structure:
  - Type schema: `shared/locale/types/dashboard/<camelCaseNamespace>/...`
  - En implementation: `shared/locale/en/dashboard/<camelCaseNamespace>/...`
  - Ar implementation: `shared/locale/ar/dashboard/<camelCaseNamespace>/...`
  - And registered in `shared/locale/types/message.ts` `MessageSchema`.
- **Plan has:** Refers to `shared/locale/in-app-meeting-view/*.locale.ts` (specs.md line 40, design.md line 89, tasks.md lines 44 and 85). This path pattern does **not** match the project's actual convention. There is no `shared/locale/in-app-meeting-view/` directory and namespace files do not use the `.locale.ts` suffix.
- **Additionally:** An existing namespace `shared/locale/en/dashboard/meeting-providers/` (and matching `shared/locale/types/dashboard/meeting-providers/`) **already exists** and is the natural home for in-app meeting-view translation keys. The plan should reference this existing namespace or a sub-namespace of it — not invent a new top-level directory.
- **Fix:** Amend `specs.md`, `design.md`, and `tasks.md` to replace every occurrence of `shared/locale/in-app-meeting-view/*.locale.ts` with the canonical path `shared/locale/types/dashboard/in-app-meeting-view/` (for the type schema) and `shared/locale/{en,ar}/dashboard/in-app-meeting-view/` (for implementations), registering the namespace in `shared/locale/types/message.ts`. Alternatively, add the keys to the existing `meeting-providers` namespace if cohesive.

### Violation 2 — translation key type signature convention (LOW)

**[SHARED] `.ai/plans/zoom-meeting-fixes/design.md` Translation Requirement table (lines 89–90)**

- **Expected:** Per `shared/AGENTS.md` Pluralization/Interpolation Pattern, static strings are typed as `string` (not `() => string`) unless they accept parameters.
- **Plan has:** Both `waitingForHost` and `hostJoinTimeout` are typed as `() => string` — but neither accepts any parameters. They should be plain `string` per the convention shown in the AuthLabels pattern (`returnToNormalLogin: string`).
- **Fix:** Change the type column for both keys from `() => string` to `string` in the design.md Translation Requirement table and the specs.md REQ-1 AC #4 reference.

### Violation 3 — Plan references translation keys it does not define as namespace-registered (LOW)

**[SHARED] `.ai/plans/zoom-meeting-fixes/tasks.md` Task 2.5**

- **Expected:** Per `shared/AGENTS.md` Namespace Registration, every new namespace MUST be: (1) added to `MessageSchema` in `shared/locale/types/message.ts`, (2) given a path mapping in `shared/locale/serverLegacy.ts` `namespacePaths`, (3) added to `LocaleProvider` translations in layout SSR if used in layout. The plan must reference this registration requirement.
- **Plan has:** Task 2.5 only says "Define the two required translation keys… Reference the namespace the in-app plan will own" — it does not mention `MessageSchema` registration, `serverLegacy.ts` path mapping, or `LocaleProvider` integration.
- **Fix:** Amend Task 2.5 to add a sub-bullet: "The in-app plan, when implementing these keys, MUST register the namespace in `shared/locale/types/message.ts` (MessageSchema), add a path mapping in `shared/locale/serverLegacy.ts` (`namespacePaths`), and wire it into `LocaleProvider` translations in `app/[locale]/layout.tsx` if rendered at layout time."

## Cross-Cutting Dimensions Checked (All Others PASS)

| Dimension | Result | Notes |
|---|---|---|
| Type imports (no local types in Pothos/services) | N/A | No Pothos or service code modified |
| Service boundaries (Server vs Client components) | N/A | No component code modified |
| MUI v9 (sx prop usage) | N/A | No MUI components in plan artifacts |
| Logging (logger, not console) | N/A | No logging statements in plan artifacts |
| Test conventions (runInRollback, tx, no rejects.toThrow) | N/A | No tests introduced by this plan |
| GraphQL documents (EntityNameQueryDocument naming, id field) | N/A | No GraphQL documents introduced |
| Drizzle schema (push vs migrate) | N/A | No schema changes |

## Summary

| Round | Violations Found | Severity Breakdown |
|---|---|---|
| R1 | 3 | 1 Medium (namespace path), 2 Low (type signatures, namespace registration) |

## Verdict

**Plan does NOT yet pass all AGENTS.md rules.** Three i18n-related violations must be fixed before the plan can be marked clean. All three are mechanical fixes to the plan's translation-key references — no behavioral changes to the underlying issues being fixed.

## Next Step
Apply the three fixes to `specs.md`, `design.md`, and `tasks.md`, then re-run Plan Review Round 2.
