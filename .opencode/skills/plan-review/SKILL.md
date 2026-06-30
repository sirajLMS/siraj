---
name: plan-review
description: Use ONLY when reviewing an implementation plan against project architecture rules. Triggers on plan review, architecture checks, layer rule validation.
---

# Plan Review Skill

Read an implementation plan, identify touched layers, read corresponding AGENTS.md files, check the plan against layer rules, and report mismatches.

## Workflow

1. Read the implementation plan (provided as input or from a file path).
2. Identify all layers the plan touches based on file paths mentioned:
   - `app/` → App Router layer
   - `frontend/views/`, `frontend/stores/`, `frontend/graphql/`, `frontend/components/` → Frontend layer
   - `backend/services/` → Services layer
   - `backend/graphql/` → GraphQL/Pothos layer
   - `backend/db/repo/` → Repository layer
   - `backend/db/schema/` → Schema layer
   - `backend/types/` → Types layer
   - `scripts/`, `.github/`, root config → Config layer
3. For each touched layer, read the corresponding AGENTS.md file from the layer hierarchy table in the root AGENTS.md.
4. Cross-reference the plan against each layer's rules and check for:
   - **Type imports**: Are types imported from `@/backend/types` instead of defined locally?
   - **Service boundaries**: Does the plan respect the service layer? No business logic in repos, no direct repo calls from resolvers.
   - **MUI v9**: Are style props placed in `sx` instead of as direct props?
   - **i18n**: Are user-facing strings using `next-intl`? Are `locale` parameters propagated?
   - **Test conventions**: Are DB tests wrapped in `runInRollback`? Are `tx` parameters passed correctly?
   - **GraphQL documents**: Are documents in `sharedDocuments/`? Named correctly? Include `id` fields?
   - **Data flow**: Do Server Components call services directly? Do Client Components use Apollo hooks?
   - **Theme/styling**: Are colors from theme palette? No hardcoded values?
   - **Logging**: Are `logger` imports used instead of `console.*`?
5. Report all mismatches as violations.

## Output Format

Report each mismatch as:

```
MISMATCH|LAYER|RULE_DESCRIPTION|PLAN_VIOLATION
```

Example:
```
MISMATCH|backend/graphql|Types must come from @/backend/types|Plan defines local type in Pothos file
MISMATCH|frontend|Style props must use sx prop|Plan uses fontWeight as direct prop on Typography
MISMATCH|backend/db/repo|DB tests must use runInRollback|Plan describes test without transaction wrapper
```

If no mismatches are found, output:
```
CLEAN|Plan adheres to all layer rules
```