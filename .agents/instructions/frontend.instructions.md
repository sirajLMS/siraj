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
- aria-live regions: use `component="output"` with `aria-live="polite"` (oxlint `prefer-tag-over-role` rejects `role="status"` on non-`<output>` elements)
- Reduced motion: detect with `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })`; pass `timeout={0}` to MUI `Fade`/`Grow`/`Slide` and skip `@keyframes` classes when reduced
- `@keyframes`: embed directly in `sx` prop objects — not via `@mui/material/styles` `keyframes`
- Use mui-mcp server if available for component API docs

### React 19

- NEVER `FormEvent` (removed). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- FormData casting: `(formData.get("name") as string | null) ?? ""` - avoids `@typescript-eslint/no-base-to-string`
- `MutableRefObject` deprecated - use `RefObject<T>` (`current` is mutable)
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
- Locale is NOT part of URL params (no `[locale]` segment) — read it via `getLocale()` from `@/shared/locale/server-cookies`
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
  import { getServerUserContext } from "@/backend/lib/auth/server-auth";
  import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
  const { userId, context } = await getServerUserContext();
  if (!userId || !context) await redirectToLogin();
  ```
- Redirects use plain paths (`redirect("/login")`) — there is NO `[locale]` URL segment, so never prefix paths with the locale

### Apollo & GraphQL

- NO `useLazyQuery` - use stateful `useQuery` exclusively (tracks loading/error/data automatically)
- Import hooks from `"@apollo/client/react"`, NOT `"@apollo/client"` or `"@apollo/client/core"`
- Import `gql` and `TypedDocumentNode` from `"@apollo/client"` (NOT `"@apollo/client/core"`):
  ```ts
  import { gql, type TypedDocumentNode } from "@apollo/client";        // gql + TypedDocumentNode
  import { useQuery, useApolloClient } from "@apollo/client/react";     // hooks ONLY
  ```
- `id` field on ALL object types in selection sets (Apollo cache normalization)
- Shared Apollo Client instance from `frontend/common/graphql/`
- Documents in `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`
- Export all documents from `frontend/common/graphql/sharedDocuments/index.ts`
- Document naming: `{entityName}QueryDocument` / `{entityName}MutationDocument`
- TypedDocumentNode convention table:

  | Operation | Const name | TypedDocumentNode type |
  |---|---|---|
  | query | `{entityName}QueryDocument` | `TypedDocumentNode<{EntityName}Query, {EntityName}QueryVariables>` |
  | mutation | `{entityName}MutationDocument` | `TypedDocumentNode<{EntityName}Mutation, {EntityName}MutationVariables>` |
  | no-arg query | `{entityName}QueryDocument` | `TypedDocumentNode<{EntityName}Query>` (omit second type param) |

- Import pattern for documents:
  ```ts
  import { gql, type TypedDocumentNode } from "@apollo/client";
  import type { EntityNameQuery, EntityNameQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";
  ```
- All generated types (operation results, variables, enums, extracted field types, inputs) live in the single `graphql.ts` file. The old `graphql-types.ts` and `operations.ts` files no longer exist.
- For nested field types, use compact extracted names: `{OperationName}_{field}` (e.g., `MeQuery_me`)
- NEVER inline type literals - always use generated types from `frontend/common/graphql/generated/gql/graphql`
- Codegen after schema/document changes (both steps required):
  ```bash
  ~/.bun/bin/bun run generate:gqlSchema
  ~/.bun/bin/bun codegen
  ```

### Zustand Stores

- Strictly typed using GraphQL generated types (import from `graphql.ts`)
- **NO MAPPING (CRITICAL)**: No type mapping functions, no intermediate conversion layers, no indexed-access workarounds (e.g., `NonNullable<MeQuery["me"]>`). Use the exact codegen-generated extracted type name directly (e.g., `MeQuery_me`).
- **NO SCHEMA TYPES**: No schema-level object types (e.g., `User`). Only operation-derived types from `graphql.ts`.
- **NO HARDCODED TYPES**: Never redefine types that should come from codegen. If codegen doesn't emit a needed type, fix the codegen config or the document — don't create a local type.
- Resolve type issues by adjusting GraphQL schema/queries - do NOT manually map or redefine types
- If schema and frontend types misalign, fix the schema or query - never create mapping workarounds

### Theme & Styling

- NO hardcoded colors - no hex (`#fff`), rgb/rgba, or CSS color names (`red`, `blue`)
- Theme callback for palette values: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- `on<Color>` siblings for contrast (e.g., `theme.palette.onPrimary` not `primary.contrastText`)
- Never delete existing theme values - map them (e.g., `boxShadow` -> `theme.palette.shadow.card`)
- Use theme font variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) - no hardcoded font `sx`
- No string-based palette access: `color="primary.main"` is WRONG - use `sx` callback instead

### Dashboard UI Patterns

- `PageContainer` inside **desktop** views - never add outer `p: 2/3` (double-padding with `DashboardLayout.pageMargin`)
- **Mobile** shell is edge-to-edge (`DashboardLayoutMobile` `px: 0`); content owns horizontal inset via `mobileContentGutterSx` / `MobileContentInset` / padding primitives — do not pad `MobilePageContainer` / `MobileContentStack`
- `AppDataGrid` / `DesktopAppDataGrid` / `MobileCardList` with required `paginationOptions` — list primitives own pager UI; never MUI `Table`/`Pagination` or raw `DataGrid`
- `MetricCard` / `MobileMetricCard` / `DesktopMetricCard` — views must never import these; use only `MobileMetricCardGrid` (mobile) or `DesktopMetricCardGrid` (desktop), including single-metric cases
- `StatusBadge` with `category` prop - no inline status chips
- `PageHeader` + `SectionPanel` - no ad-hoc flex title blocks
- `PrimaryPageAction`, `FilterButton`, `ExportButton` presets for actions

### i18n

- All user-facing strings via the compile-time TypeScript i18n system in `@/shared/locale` - never hardcode error messages or UI text
- Client components: `useAppTranslation("<namespace>")` from `@/shared/locale/client`
- Server components: `getTranslations(locale)` from `@/shared/locale/server` (synchronous, single string arg, returns property-chain — NOT awaited)
- Client components are wrapped in `LocaleProvider` from `@/frontend/common/providers/LocaleProvider` (NOT `NextIntlClientProvider`)

### Logging

- NEVER use `console.*` - ESLint will error
- `import { logger } from '@/frontend/utils/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`
- Production: info/warn/debug suppressed, error always logs
- **Client logger `batchInterval`** MUST be at least 30s in production; `beforeunload` flush required (uses `fetch` with `keepalive: true`, NOT `navigator.sendBeacon`); error/warn logs MUST bypass min-batch-size guard
- **RequirePermission** MUST NOT log DEBUG messages by default — gate behind `process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"`

### Storybook

- `<RequirePermission>` defaults to admin - use `useUserStore.setState()` for specific perms (e.g., Parent vs Teacher)
- Auto-wrapped in `LocaleProvider` from `@/frontend/common/providers/LocaleProvider` - component must use `useAppTranslation` from `@/shared/locale/client` for compatibility
- Real `userStore` aliased to `mockUserStore` - prefer mock stores for predictable initial state
- Decorators in metadata `decorators` array, not wrapping component directly in story function

### Views & Components

- Functional components only - no class components
- Domain structure: `frontend/views/dashboard/` - group related views and sub-components logically
- Access control: `<RequirePermission>` wrapper for permission-gated components
- Client data fetching: Apollo `useQuery` with generated TypedDocumentNodes
- Server data fetching: call services via cached wrappers (never repos/DB directly)
- **Duplicate view logic**: When desktop and mobile variants share presentation logic, extract a `*Shared.tsx` scaffold into a `__shared__/` directory at the parent level. Desktop/mobile variants import ONLY from the scaffold — never from each other.
- Form `TextField`s with validation errors: `aria-invalid={!!error}`

### Linting Rules

- Oxlint & ESLint/sonarjs fix recipes live in the quality docs. NEVER use `oxlint-disable` comments — fix the root cause.
- **`no-await-in-loop`**: for sequential async work use a recursive `processNext(index, ...)` helper instead of `await` in a loop body; `Promise.all` runs in parallel and is wrong for sequential flows
- **`sonarjs/deprecation` on `document.execCommand`**: bind with an explicit type annotation — `const execCopy: (commandId: string) => boolean = globalThis.document.execCommand.bind(globalThis.document)` — the annotation sheds the deprecation marker

### Code Quality

- Run `bun quality-gate` after modifications - sequential stages: BASIC_CHECKS -> CODESCENE
- State persists in `.quality-gate-state.json` - re-run `bun quality-gate` to resume from last failure
- CODESCENE failure: run `bun run codescene --file <path>` to fix
- Fresh start: `bun quality-gate:fresh` (clears state)
- NEVER bypass quality gate or skip CodeScene diagnostics
- Default 5-minute timeout to prevent hanging

### Commit Message Rules

- Write concise, descriptive messages - focus on what was changed
- NEVER include repetitive endings like "- Ensured all changes comply with..."
- Use imperative mood (e.g., "Add feature" not "Added feature" or "Adding feature")

### Code Style Rules

- No nested ternary operators - extract into if/else or separate functions (SonarJS code smell)
- **Clean Comments & JSDoc Standards (CRITICAL)**:
  - NEVER write internal planning or tracking tags in code comments or JSDoc (e.g. no `REQ-xx`, `Task x.x`, `Phase x`, or citing `.ai/plans/`).
  - Code comments and JSDoc MUST describe the *what*, *why*, and *domain behavior* of the code in clean, production-grade technical terms.
  - Avoid redundant comments that simply restate function or component names.

### Commands

- Always use `~/.bun/bin/bun` - never npm/yarn/pnpm
- Install: `~/.bun/bin/bun install` / `~/.bun/bin/bun add <pkg>` / `~/.bun/bin/bun remove <pkg>`
- Run scripts: `~/.bun/bin/bun run <script-name>`
- Dev server: `bun run dev` (Turbopack, port 3000) or `bun run dev:safe` (safe mode)
- Build: `bun run build`
- Type check: `bun run tsgo` (fast TypeScript, NOT `tsc`)
- Lint: `~/.bun/bin/bun run lint` (this script IS the lint queue client — safe to run directly; calls `requestFullRepoLint` from `scripts/lint-queue-client.ts`). For file-scoped lint, call `requestLint(id, [files])` from the client.
- Format: `bun run format` (Biome) / `bun run biome:check` (Biome lint + format + unsafe fixes)
- Quality: `bun quality-gate` / `bun quality-gate:fresh`
- GraphQL: `bun run generate:gqlSchema` then `bun codegen`
- Database: `bun run db` (via scripts/dbActions.ts — generate, push, migrate, seed, studio — reset & cleanGenerate disabled by repo policy)
- Layer-specific test scripts:
  - `bun run build:test` - production build for UI/E2E (`.next-test-prod`; required before `test:ui:e2e`)
  - `bun run test:graphql` - GraphQL integration tests (dev server)
  - `bun run test:ui:components` - UI component tests (Happy DOM; no server)
  - `bun run test:ui:e2e` - E2E tests (production server; run `build:test` first)
  - `bun run test:ui:static` - mobile/desktop import isolation checks
  - `bun run test:ui` - all UI tests
  - `bun run test:ui:kill` - kill test servers on port 3066 only (never dev:3000 or start:4000)
  - `bun run test` - all tests
