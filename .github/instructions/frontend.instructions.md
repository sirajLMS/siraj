---
applyTo: "frontend/**/*.ts,frontend/**/*.tsx,frontend/**/*.css,app/**/*.ts,app/**/*.tsx"
---

# Frontend Rules

### MUI v9 Breaking Changes

- Style props are NOT valid direct props. Always use `sx`:
  - `<Typography sx={{ fontWeight: 700, mb: 1 }}>` not `<Typography fontWeight={700} mb={1}>`
  - `<Stack sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>` not `<Stack alignItems="center" gap={2}>`
  - `<Box sx={{ p: 2, display: "flex" }}>` not `<Box p={2} display="flex">`
  - `<Grid sx={{ mb: 2 }}>` not `<Grid mb={2}>`
- Invalid direct props per component - all must go in `sx`:
  - Typography: `fontWeight`, `textAlign`, `mb`, `mt`, `p`, `color`, `variant` as style overrides
  - Stack: `alignItems`, `justifyContent`, `flexWrap`, `gap`, `mb`, `mt`, `direction`
  - Box: `p`, `px`, `py`, `mt`, `mb`, `display`, `flex`, `textAlign`, `component`
  - Grid: `alignItems`, `justifyContent`, `mb`, `mt`, `order`
- Icon naming: `*Outline` -> `*Outlined` (e.g., `ErrorOutline` -> `ErrorOutlined`, `CheckCircleOutline` -> `CheckCircleOutlined`)
- DatePicker autoComplete: must use nested slotProps, not directly on `textField`:
  ```tsx
  <DatePicker slotProps={{ textField: { slotProps: { htmlInput: { autoComplete: "off" } } } }} />
  ```
- Autocomplete: `params.slotProps.htmlInput` not `params.inputProps` (`AutocompleteRenderInputParams` no longer has `inputProps`)
- Typography `component` prop: not valid directly - use wrapper element or `sx` workaround
- ListItemText: use `slotProps` not `primaryTypographyProps` for font weight
- Use mui-mcp server if available for component API docs

### React 19

- NEVER `FormEvent` (removed). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- FormData casting: `(formData.get("name") as string | null) ?? ""` - avoids `@typescript-eslint/no-base-to-string`
- Context, Provider, and useHook in separate files (Fast Refresh requirement)
  - `MyContext.tsx` - exports `Context` and `Provider`
  - `useMyHook.ts` - exports the hook
- NextAuth handler cast in App Router `route.ts`:
  ```ts
  const handler = NextAuth(authOptions) as (req: Request) => Promise<Response>;
  ```

### Next.js 16 (BREAKING CHANGES)

- This is NOT standard Next.js - APIs, conventions, and file structure differ from training data
- Read `node_modules/next/dist/docs/` before writing any Next.js code - heed deprecation notices
- Server Components (`app/`): no hooks (`useState`, `useEffect`), no browser APIs, no repos/DB
- Server Components call services directly - NOT GraphQL. Use cached wrappers for deduplication
- Layouts cannot pass props to page children - pages only receive `params` and `searchParams`
- `await params` for locale: `const { locale } = await params;`
- `React.cache()` pattern for layout-page data sharing - memoizes per request, executes only once:
  ```ts
  import { cache } from "react";
  import { SessionService } from "@/backend/services/auth/session.service";
  export const getCurrentUser = cache(async (userId: string) => {
    return SessionService.getCurrentUserProfile(userId);
  });
  ```
- Place cached wrappers in `backend/lib/auth/` or similar shared location
- `getServerUserContext()` auth guard in layouts:
  ```ts
  import { redirect } from "next/navigation";
  import { getServerUserContext } from "@/backend/lib/auth/server-auth";
  const { userId, context } = await getServerUserContext();
  if (!userId || !context) redirect(`/${locale}/login`);
  ```
- Server translations: `getTranslations()` / `getMessages()` from `next-intl/server`
- Client translations: `useTranslations()` from `next-intl`
- Locale in redirects: `redirect(`/${locale}/login`)` - never `redirect("/login")`

### New Page Workflow

- Mandatory: follow `NEW_PAGE_WORKFLOW.md` for all new page implementations
- See `COMPONENT_PATTERNS.md` before building or refactoring dashboard pages
- See `.github/CODE_REVIEW_CHECKLIST.md` when reviewing code

### Apollo & GraphQL

- NO `useLazyQuery` - use stateful `useQuery` exclusively (tracks loading/error/data automatically)
- Import hooks from `"@apollo/client/react"`, NOT `"@apollo/client"` or `"@apollo/client/core"`
- Import `gql` and `TypedDocumentNode` from `"@apollo/client"` (NOT `"@apollo/client/core"`):
  ```ts
  import { gql, type TypedDocumentNode } from "@apollo/client";        // gql + TypedDocumentNode
  import { useQuery, useApolloClient } from "@apollo/client/react";     // hooks ONLY
  ```
- `id` field on ALL object types in selection sets (Apollo cache normalization)
- Shared Apollo Client instance from `frontend/graphql/`
- Documents in `frontend/graphql/sharedDocuments/<domain>.documents.ts`
- Export all documents from `frontend/graphql/sharedDocuments/index.ts`
- Document naming: `{entityName}QueryDocument` / `{entityName}MutationDocument`
- TypedDocumentNode convention table:

  | Operation | Const name | TypedDocumentNode type |
  |---|---|---|
  | query | `{entityName}QueryDocument` | `TypedDocumentNode<Operations.{EntityName}Query, Types.Query{EntityName}Args>` |
  | mutation | `{entityName}MutationDocument` | `TypedDocumentNode<Operations.{EntityName}Mutation, Types.Mutation{EntityName}Args>` |
  | no-arg query | `{entityName}QueryDocument` | `TypedDocumentNode<Operations.{EntityName}Query>` (omit second type param) |

- Import pattern for documents:
  ```ts
  import { gql, type TypedDocumentNode } from "@apollo/client";
  import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
  import type * as Operations from "@/frontend/graphql/generated/gql/operations";
  ```
- NEVER inline type literals - always use generated types from `frontend/graphql/generated/gql/`
- Codegen after schema/document changes (both steps required):
  ```bash
  ~/.bun/bin/bun run generate:gqlSchema
  ~/.bun/bin/bun codegen
  ```

### Zustand Stores

- Strictly typed using GraphQL generated types (import from `graphql-types.ts`)
- No complex intermediate mapping functions
- Resolve type issues by adjusting GraphQL schema/queries - do NOT manually map or redefine types
- If schema and frontend types misalign, fix the schema or query - never create mapping workarounds

### Theme & Styling

- NO hardcoded colors - no hex (`#fff`), rgb/rgba, or CSS color names (`red`, `blue`)
- Theme callback for palette values: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- `on<Color>` siblings for contrast (e.g., `theme.palette.onPrimary` not `primary.contrastText`)
- Never delete existing theme values - map them (e.g., `boxShadow` -> `theme.palette.shadow.card`)
- Use theme font variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) - no hardcoded font `sx`
- No string-based palette access: `color="primary.main"` is WRONG - use `sx` callback instead
- Reference `THEME_PALETTE.md` for all color tokens and access patterns

### Dashboard UI Patterns

- `PageContainer` inside views - never add outer `p: 2/3` (double-padding with `DashboardLayout.pageMargin`)
- `AppDataGrid` (`@mui/x-data-grid`) via feature `*DataGrid` wrappers - mobile uses `*CardList` components
- `MetricCard` shared from `@/frontend/components/ui` - no per-feature metric card components
- `StatusBadge` with `category` prop - no inline status chips
- `PageHeader` + `SectionPanel` - no ad-hoc flex title blocks
- `PrimaryPageAction`, `FilterButton`, `ExportButton` presets for actions
- Embedded tables (e.g., `RegisteredStudentsSection`) may use MUI `Table` styled to `palette.table.header` tokens

### i18n

- All user-facing strings via `next-intl` - never hardcode error messages or UI text
- Client components: `useTranslations` hook from `next-intl`
- Server components: `getTranslations()` from `next-intl/server`
- Server components passing messages to client: `getMessages()` from `next-intl/server`

### Logging

- NEVER use `console.*` - ESLint will error
- `import { logger } from '@/frontend/utils/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`
- Production: info/warn/debug suppressed, error always logs

### Storybook

- `<RequirePermission>` defaults to admin - use `useUserStore.setState()` for specific perms (e.g., Parent vs Teacher)
- Auto-wrapped in `NextIntlClientProvider` - component must use `useTranslations` for compatibility
- Real `userStore` aliased to `mockUserStore` - prefer mock stores for predictable initial state
- Decorators in metadata `decorators` array, not wrapping component directly in story function

### Views & Components

- Functional components only - no class components
- Domain structure: `frontend/views/dashboard/` - group related views and sub-components logically
- Access control: `<RequirePermission>` wrapper for permission-gated components
- Client data fetching: Apollo `useQuery` with generated TypedDocumentNodes
- Server data fetching: call services via cached wrappers (never repos/DB directly)

### Code Quality

- Run `bun quality-gate` after modifications - sequential stages: BASIC_CHECKS -> CODESCENE -> SONAR_SCAN -> SONAR_RESULTS
- State persists in `.quality-gate-state.json` - re-run `bun quality-gate` to resume from last failure
- CODESCENE failure: run `bun run codescene --file <path>` to fix
- SONAR_RESULTS failure: use `bun scripts/sonar-manager.ts` to resolve
- Fresh start: `bun quality-gate:fresh` (clears state and stale results)
- NEVER bypass quality gate or skip CodeScene/SonarQube diagnostics
- Default 5-minute timeout to prevent hanging

### Commit Message Rules

- Write concise, descriptive messages - focus on what was changed
- NEVER include repetitive endings like "- Ensured all changes comply with..."
- Use imperative mood (e.g., "Add feature" not "Added feature" or "Adding feature")

### Code Style

- No nested ternary operators - extract into if/else or separate functions (SonarJS code smell)
- See `IMPLEMENTATION_LEARNINGS.md` for known error resolutions to prevent repeating past mistakes

### Commands

- Always use `~/.bun/bin/bun` - never npm/yarn/pnpm
- Install: `~/.bun/bin/bun install` / `~/.bun/bin/bun add <pkg>` / `~/.bun/bin/bun remove <pkg>`
- Run scripts: `~/.bun/bin/bun run <script-name>`
- Dev server: `bun run dev` (Turbopack, port 3000) or `bun run dev:safe` (safe mode)
- Build: `bun run build`
- Type check: `bun run tsgo` (fast TypeScript, NOT `tsc`)
- Lint: `bun run lint` (ESLint with auto-fix)
- Format: `bun run format` (Biome) / `bun run biome:check` (Biome lint + format + unsafe fixes)
- Quality: `bun quality-gate` / `bun quality-gate:fresh`
- GraphQL: `bun run generate:gqlSchema` then `bun codegen`
- Database: `bun run db` (via scripts/dbActions.ts)
- Layer-specific test scripts:
  - `bun run test:graphql` - GraphQL integration tests
  - `bun run test:ui:components` - UI component tests
  - `bun run test:ui:e2e` - E2E tests
  - `bun run test:ui` - all UI tests (components + e2e)
  - `bun run test` - all tests
