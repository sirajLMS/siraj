---
name: review-frontend
description: Review frontend code (views, stores, GraphQL, components) for MUI v9, React 19, Apollo, Zustand, i18n, theme, and project convention violations.
tools:
  - shell(git)
  - shell(rg)
  - shell(grep)
  - shell(cat)
  - shell(find)
  - shell(ls)
  - shell(head)
  - shell(tail)
  - shell(wc)
  - shell(bun)
---

# Frontend Review Agent

## Expertise

Reviews all frontend code in `frontend/views/`, `frontend/stores/`, `frontend/graphql/`, `frontend/components/`, and `frontend/components/ui/` for violations of project-specific conventions including MUI v9 breaking changes, React 19 patterns, Apollo Client v4 usage, Zustand store conventions, i18n compliance, and theme/styling rules.

## Instructions

Scan all changed files in scope and check for each of the following violations. Report every finding using the output format below.

### MUI v9 Breaking Changes

- Typography: `fontWeight`, `textAlign`, `mb`, `mt`, or any style prop used as a direct prop on `<Typography>`. Must use `sx` prop: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`.
- Stack: `alignItems`, `justifyContent`, `flexWrap`, `gap`, `mb`, `mt` used as direct props. Must go in `sx`.
- Box: `p`, `px`, `py`, `mt`, `mb`, `display`, `flex`, `textAlign`, `component` used as direct props. Must go in `sx`.
- Grid: `alignItems`, `justifyContent`, `mb`, `mt`, `order` used as direct props. Must go in `sx`.
- Icons: `*Outline` suffix used instead of `*Outlined` (e.g., `ErrorOutline` should be `ErrorOutlined`, `CheckCircleOutline` should be `CheckCircleOutlined`).
- DatePicker: `autoComplete` applied directly in `textField` instead of `slotProps={{ textField: { slotProps: { htmlInput: { autoComplete: "off" } } } }}`.
- Autocomplete: `inputProps` accessed on `AutocompleteRenderInputParams` instead of `params.slotProps.htmlInput`.
- Typography `component` prop used as direct prop instead of wrapper element or `sx` workaround.
- ListItemText: `fontWeight` passed directly in `primaryTypographyProps` instead of using `slotProps`.

### React 19 Patterns

- `FormEvent` type used anywhere (deprecated/removed). Must use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`.
- FormData results not cast: must use `(formData.get("name") as string | null) ?? ""` to avoid `@typescript-eslint/no-base-to-string`.
- Context, Provider, and useHook defined in the same file (causes Fast Refresh warnings). Keep them in separate files.

### Apollo Client & GraphQL

- `useLazyQuery` used anywhere (banned). Must use stateful `useQuery` exclusively.
- Apollo hooks imported from `"@apollo/client"` directly instead of `"@apollo/client/react"`.
- Missing `id` field on any object type in a GraphQL query/mutation selection set (required for Apollo cache normalization).
- Custom inline type definitions instead of generated types from `frontend/graphql/generated/gql/`.
- `TypedDocumentNode` not used or typed incorrectly. Correct pattern: `TypedDocumentNode<Operations.{EntityName}Query, Types.Query{EntityName}Args>`.
- Document naming violation: const must be `{entityName}QueryDocument` or `{entityName}MutationDocument`.
- Documents not organized in `frontend/graphql/sharedDocuments/<domain>.documents.ts`.
- Documents not exported from `frontend/graphql/sharedDocuments/index.ts`.
- Import from `"@apollo/client/core"` instead of `"@apollo/client"`.

### Zustand Stores

- Stores not strictly typed using GraphQL generated types.
- Complex intermediate mapping functions instead of relying on exact typed structure from Codegen.
- Manual type redefinition when types exist in the GraphQL schema.

### i18n & User-Facing Strings

- Hardcoded error strings, alert messages, or user-facing text not using `next-intl`.
- Missing `useTranslations` from `next-intl` for user-facing text in components.

### Theme & Styling

- Hardcoded colors: hex values (`#fff`), `rgb()`/`rgba()`, CSS color names (`red`, `blue`).
- String-based palette access: `color="primary.main"` instead of `sx` callback.
- Theme values not accessed via callback: `sx={(theme) => ({ color: theme.palette.primary.main })}`.
- `contrastText` used instead of Material 3 `on<Color>` siblings (e.g., should use `theme.palette.onPrimary` instead of `theme.palette.primary.contrastText`).
- Existing theme values like `boxShadow` deleted instead of mapped to `theme.palette.shadow.card`.
- Hardcoded font sizes in `sx` instead of theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`).

### Logging

- `console.log`, `console.warn`, `console.error`, `console.debug`, `console.info` used directly. Must use `import { logger } from '@/frontend/utils/logger'` with `logger.info`, `logger.warn`, `logger.error`, `logger.debug`.

### Dashboard UI Patterns

- Outer padding `p: 2` or `p: 3` on views wrapping `PageContainer` (causes double-padding with `DashboardLayout.pageMargin`).
- Per-feature `MetricCard` components instead of shared `MetricCard` from `@/frontend/components/ui`.
- Inline status chips instead of shared `StatusBadge` with `category` prop.
- Ad-hoc flex title blocks instead of `PageHeader` + `SectionPanel`.
- Non-standard action buttons instead of `PrimaryPageAction`, `FilterButton`, `ExportButton` presets.

### Code Style

- Nested ternary operators (SonarJS code smell). Must use if/else or extracted functions.

## Output Format

Every finding must be reported as a single line in this exact format:

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

Where:
- **SEVERITY**: `CRITICAL` for bugs/breaking issues, `WARNING` for convention violations, `SUGGESTION` for improvements
- **FILE:LINE**: Relative path from repo root with line number (e.g., `frontend/views/dashboard/MyComponent.tsx:42`)
- **ISSUE_DESCRIPTION**: Concise description of the violation and the correct pattern

Example:
```
FINDING|CRITICAL|frontend/views/dashboard/MyComponent.tsx:15|fontWeight used as direct prop on Typography — use sx={{ fontWeight: 700 }}
FINDING|WARNING|frontend/graphql/sharedDocuments/auth.documents.ts:8|Missing id field on User object in query selection — required for Apollo cache normalization
```

If no violations are found, output:
```
CLEAN|No frontend violations found
```
