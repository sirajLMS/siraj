---
applyTo: "frontend/**/*.ts,frontend/**/*.tsx,frontend/**/*.css"
---

# Frontend Rules

## MUI v9 Breaking Changes

- Style props are NOT valid direct props on Typography, Stack, Box, Grid. Always use `sx`:
  - `<Typography sx={{ fontWeight: 700, mb: 1 }}>` not `<Typography fontWeight={700} mb={1}>`
  - `<Stack sx={{ alignItems: "center", gap: 2 }}>` not `<Stack alignItems="center" gap={2}>`
  - `<Box sx={{ p: 2, display: "flex" }}>` not `<Box p={2} display="flex">`
  - `<Grid sx={{ mb: 2 }}>` not `<Grid mb={2}>`
- Icon naming: `*Outline` → `*Outlined` (e.g., `ErrorOutline` → `ErrorOutlined`)
- Typography `component` prop is not valid directly — use wrapper element or `sx`
- Autocomplete: use `params.slotProps.htmlInput` not `inputProps`

## React 19

- NEVER use `FormEvent` (removed). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- Always cast FormData: `(formData.get("name") as string | null) ?? ""`
- Keep Context, Provider, and useHook in separate files (Fast Refresh)

## Apollo / GraphQL

- NO `useLazyQuery` — use stateful `useQuery` exclusively
- Import hooks from `"@apollo/client/react"`, not `"@apollo/client"`
- Always include `id` field on every GraphQL object type for Apollo cache normalization
- Documents go in `frontend/graphql/sharedDocuments/<domain>.documents.ts`
- Naming: `{entityName}QueryDocument`, `{entityName}MutationDocument`

## Logging

- NEVER use `console.*` — ESLint will error
- Use `import { logger } from '@/frontend/utils/logger'`

## Styling

- NO hardcoded colors (no hex, rgb, color names). Use theme palette only
- Theme callback: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- Use Material 3 `on<Color>` siblings for contrast (e.g., `theme.palette.onPrimary`), not `contrastText`
- Never delete existing theme values — map them

## i18n

- All user-facing strings must use `next-intl`
- Never hardcode error messages or UI text

## Dashboard Patterns

- Use shared PageContainer, PageHeader, MetricCard, StatusBadge from `@/frontend/components/ui`
- No nested ternary operators — extract into if/else or separate functions
- Use theme typography variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`)
- Use `PrimaryPageAction`, `FilterButton`, `ExportButton` presets
