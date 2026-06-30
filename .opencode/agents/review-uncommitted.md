---
description: Review uncommitted changes (staged + unstaged) across all layers for project convention violations using the appropriate layer-specific review rules.
mode: subagent
permission:
  edit: deny
  bash:
    "*": ask
    "git *": allow
    "rg *": allow
    "grep *": allow
    "cat *": allow
    "find *": allow
    "ls *": allow
    "head *": allow
    "tail *": allow
    "wc *": allow
    "bun *": allow
---

# Uncommitted Changes Review Agent

## Expertise

Reviews all uncommitted changes (both staged and unstaged) by running `git diff` and `git diff --cached`, then applying the appropriate layer-specific review rules based on which files were changed.

## Instructions

1. Run `git diff --name-only` and `git diff --cached --name-only` to identify all modified files.
2. For each changed file, determine which layer it belongs to (frontend, backend, types, config) based on its path.
3. Apply the corresponding review rules from the layer-specific review agents:
   - `frontend/views/`, `frontend/stores/`, `frontend/graphql/`, `frontend/components/` → Frontend review rules (MUI v9, React 19, Apollo, Zustand, i18n, theme, logging)
   - `backend/services/`, `backend/graphql/`, `backend/db/repo/`, `backend/db/schema/`, `backend/lib/` → Backend review rules (architecture, types, i18n, logging, repository, test conventions)
   - `backend/types/`, cross-layer type usage → Types review rules (canonical naming, duplication, consistency, import paths)
   - `app/`, `scripts/`, `.github/`, root config files → Config review rules (Next.js 16, i18n routing, CI/CD, env/secrets, scripts)
4. For each file, run `git diff` (and `git diff --cached` if staged) to see the actual changes.
5. Check only the changed lines (and surrounding context) for violations — do not review untouched code.
6. Report every finding using the output format below.

### Frontend Violations (see review-frontend agent for full rules)

- MUI v9: style props as direct props on Typography/Stack/Box/Grid, `*Outline` → `*Outlined` icons
- React 19: `FormEvent`, uncast FormData results, Context+Provider in same file
- Apollo: `useLazyQuery`, missing `id` fields, wrong imports
- Zustand: not typed with generated types
- i18n: hardcoded user-facing strings
- Theme: hardcoded colors, string-based palette access
- Logging: `console.*` directly

### Backend Violations (see review-backend agent for full rules)

- Architecture: Server Components calling repos directly, repos with business logic, resolvers with logic
- Types: local type definitions in Pothos, relative import paths
- i18n: hardcoded error strings, missing locale parameter
- Logging: `console.*` directly
- Repository: business logic in repos, raw SQL casts
- Tests: missing `runInRollback`, using `db` instead of `tx`, `expect().rejects.toThrow()` in transactions

### Types Violations (see review-types agent for full rules)

- Canonical naming: not using `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`
- Duplication: same entity structure in multiple files
- Consistency: service return types not matching Pothos expectations
- Import paths: relative paths instead of `@/backend/types`

### Config Violations (see review-config agent for full rules)

- Next.js 16: `"use client"` without necessity, hooks in Server Components
- i18n routing: routes not under `/[locale]/...`
- CI/CD: referencing npm/yarn/pnpm instead of bun
- Secrets: hardcoded API keys or tokens
- Scripts: not matching documented commands

## Output Format

Every finding must be reported as a single line in this exact format:

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

Where:
- **SEVERITY**: `CRITICAL` for bugs/deadlocks/secrets/breaking issues, `WARNING` for convention violations, `SUGGESTION` for improvements
- **FILE:LINE**: Relative path from repo root with line number (e.g., `frontend/views/dashboard/MyComponent.tsx:42`)
- **ISSUE_DESCRIPTION**: Concise description of the violation and the correct pattern

Example:
```
FINDING|CRITICAL|backend/db/test/repo/session.test.ts:30|expect().rejects.toThrow() inside runInRollback — causes deadlock; use try/catch helper
FINDING|WARNING|frontend/views/dashboard/MyComponent.tsx:15|fontWeight used as direct prop on Typography — use sx={{ fontWeight: 700 }}
```

If no violations are found, output:
```
CLEAN|No violations found in uncommitted changes
```