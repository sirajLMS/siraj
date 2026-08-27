## Theme and Styling Rules

- **NO hardcoded colors allowed** - All colors MUST come from the theme palette.
- **NEVER use hex colors, rgb/rgba values, or color names**.
- **NO Quotes for Colors**: Never use string-based palette access (e.g., `color="primary.main"`).
- **Theme Callback Pattern**: Use the theme callback pattern ONLY when theme-specific values are needed:
    - `sx={(theme) => ({ color: theme.palette.primary.main })}`
- **Universal Contrast**: Use Material 3 `on<Color>` siblings instead of `contrastText` (e.g., `theme.palette.onPrimary`).
- **NO DELETION**: Never delete existing theme values like `boxShadow`. Map them to `theme.palette.shadow.card`.
- Refer to **THEME_PALETTE.md** for all color tokens and access patterns.
- **Emotion RTL**: Never pass stylis’s `prefixer` into RTL Emotion caches (`stylisPlugins: [rtlPlugin]` only). See `docs/frontend/emotion-rtl-stylis.md`.

## Code Style Rules

- **Review [IMPLEMENTATION_LEARNINGS.md](IMPLEMENTATION_LEARNINGS.md)** for detailed error resolutions to prevent repeating previous mistakes.
- **No nested ternary operators** - SonarJS will flag them as code smells
- Extract nested ternaries into if/else statements or separate functions
- **Clean Comments & JSDoc Standards (CRITICAL)**:
  - NEVER write internal planning or tracking tags in code comments or JSDoc (e.g. no `REQ-xx`, `Task x.x`, `Phase x`, or citing `.ai/plans/`).
  - Code comments and JSDoc MUST describe the *what*, *why*, and *domain behavior* of the code in clean, production-grade technical terms.
  - Avoid redundant comments that simply restate function or component names.

## Commit Message Rules

- Write concise, descriptive commit messages that clearly explain what was changed
- Focus on the actual changes made, not on compliance statements
- NEVER include repetitive endings like "- Ensured all changes comply with Bun package manager rules and maintain code quality standards."
- Use imperative mood (e.g., "Add feature" not "Added feature" or "Adding feature")

## React & Next.js Patterns

- **Event Types**: NEVER use `FormEvent` (deprecated/removed in React 19). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`.
- **FormData**: Always cast results: `(formData.get("name") as string | null) ?? ""` to avoid `@typescript-eslint/no-base-to-string`.
- **Context/Hooks**: Keep `Context`, `Provider`, and `useHook` in separate files to avoid Fast Refresh warnings.
- **NextAuth**: In App Router `route.ts`, cast handler: `const handler = NextAuth(authOptions) as (req: Request) => Promise<Response>`.

## MUI Breaking Changes (v9+)

- use mui-mcp server if available.

- **Typography style props**: `fontWeight`, `textAlign`, `mb`, `mt`, etc. are NOT valid direct props. Always use `sx`: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`.
- **Stack layout props**: `alignItems`, `justifyContent`, `flexWrap`, `gap`, `mb`, `mt`, etc. must go in `sx`: `<Stack sx={{ alignItems: "center", justifyContent: "space-between" }}>`.
- **Box shorthand props**: `p`, `px`, `py`, `mt`, `mb`, `display`, `flex`, `textAlign`, `component` etc. must go in `sx`: `<Box sx={{ p: 2, display: "flex" }}>`.
- **Grid props**: `alignItems`, `justifyContent`, `mb`, `mt`, `order` must go in `sx`: `<Grid sx={{ mb: 2 }}>`.
- **MUI Icons rename**: `*Outline` → `*Outlined` (e.g. `ErrorOutline` → `ErrorOutlined`, `CheckCircleOutline` → `CheckCircleOutlined`).
- **MUI X DatePicker autoComplete**: Use `slotProps={{ textField: { slotProps: { htmlInput: { autoComplete: "off" } } } }}` — not directly in `textField`.
- **Autocomplete inputProps removed**: `AutocompleteRenderInputParams` no longer has `inputProps`. Use `params.slotProps.htmlInput` instead.
- **Typography `component` prop**: Not a valid direct prop — use a wrapper element or `sx` workaround.
- **ListItemText primary slot fontWeight**: Use `slotProps` or wrap content instead of passing `fontWeight` directly in `primaryTypographyProps`.

## Dashboard UI Patterns

**Read [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) before building or refactoring dashboard pages.**
**Use [.github/CODE_REVIEW_CHECKLIST.md](.github/CODE_REVIEW_CHECKLIST.md) when reviewing code.**
**See `docs/frontend/meeting-integrations-ui.md` for the canonical reference on meeting integration UI patterns (MetricCardGrid, AppDataGrid, OAuth callback, reconnect-all, status badges, clipboard, i18n, mobile-desktop, Zod factory, animations, permissions).**

- **Layout (desktop):** Use `PageContainer` inside views — never add outer `p: 2/3` (double-padding with `DashboardLayout.pageMargin`).
- **Layout (mobile):** `DashboardLayoutMobile` is edge-to-edge (`px: 0`). Do **not** put horizontal padding on `MobilePageContainer` / `MobileContentStack`. Content owns inset via `mobileContentGutterSx`, `MobileContentInset`, `MobilePageHeader`, scroll rows, and section panels — see `frontend/mobile/AGENTS.md`.
- **Lists / tables:** Desktop → `AppDataGrid` / `DesktopAppDataGrid` with required `paginationOptions`. Mobile entity collections → `MobileCardList` + `MobileCardListItem` with required `paginationOptions` (`server` when the ViewModel already has page/totalCount/onPageChange; never fake `client` on a server-sliced page). Pager stays visible whenever `paginationOptions !== false` (even single page). List primitives own pager UI — never pass `slots.pagination` or sibling `MobilePaginationControls` next to a list. Desktop ad-hoc card lists may use sibling `DesktopPaginationControls` when intentional. Do not use MUI `Table` / `Pagination`.
- **Metrics:** Views must never import or render `MetricCard` / `MobileMetricCard` / `DesktopMetricCard`. Use only `MobileMetricCardGrid` (mobile) or `DesktopMetricCardGrid` (desktop), including when there is a single metric. Cards are internal to the grid (+ Storybook).
- **Status:** Use shared `StatusBadge` with the correct `category` prop — no inline status chips.
- **Headers:** Use `PageHeader` + `SectionPanel` — not ad-hoc flex title blocks.
- **Actions:** Use `PrimaryPageAction`, `FilterButton`, `ExportButton` presets.
- **Typography:** Use theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) — avoid hardcoded font `sx`.

## Mobile vs Desktop Isolation

- **File naming**: `.mobile.tsx` for mobile views/components, `.desktop.tsx` for desktop views/components. No suffix for shared components.
- **Directory structure**: Place versioned files in `mobile/` and `desktop/` subdirectories under their domain. Shared components in `shared/` subdirectory.
- **Zero useMediaQuery**: `.mobile.tsx` and `.desktop.tsx` files must NEVER import or call `useMediaQuery` — viewport tier is decided by the parent switcher (`View.tsx`).
- **Zero viewport context**: `.mobile.tsx` and `.desktop.tsx` files must NEVER import `useViewport` or `ViewportContext` — they are already tier-specific.
- **No cross-imports**: `.mobile.tsx` must not import `.desktop.tsx` and vice versa (ESLint enforced via `no-restricted-imports`).
- **ViewModel pattern**: Business logic lives in `useXxViewModel()` hooks, not in view components or Context. All mutable state in Zustand stores (survives viewport tier switching). `File` objects in `useRef` in the hook, not Zustand (serialization safety).
- **Switcher uses `ResponsiveViewSwitch` with lazy loading**: The `xxView.tsx` switcher calls `createLazyView()` at module top level (static import paths required by `next/dynamic`) and passes lazy component refs to `<ResponsiveViewSwitch>`. Only the matching tier's code is downloaded. `ResponsiveViewSwitch` internally reads `useViewport()` and wraps in `Suspense` + `ErrorBoundary`. The switcher file itself no longer imports `useViewport`.
- **Shared components**: Non-versioned components (e.g., `StatusBadge`, `BaseCard`) used by both tiers. They contain NO `useMediaQuery` and NO viewport logic. Metric **cards** are not imported by views — use tier `*MetricCardGrid` instead.
- **Serialization safety**: Non-serializable values (`File`, `Blob`, `FormData`, `Promise`) must NOT be stored in `persist`-enabled Zustand stores. Use a non-persisted store, `partialize` to exclude them, or keep them in a `useRef` in the ViewModel hook.
- **Component directory layout**:
  ```
  <domain>/
    mobile/
      xx.mobile.tsx
      components/
        xxCard.mobile.tsx
    desktop/
      xx.desktop.tsx
      components/
        xxGrid.desktop.tsx
    shared/
      xxShared.tsx
    useXxViewModel.ts
    xxView.tsx          (switcher)
  ```
- **ESLint enforcement**: `no-restricted-imports` rules block cross-imports and `useMediaQuery` usage in versioned files (see `eslint.config.mjs`).
- **Existing patterns**: See `frontend/views/AGENTS.md` for ViewModel conventions and `frontend/common/stores/AGENTS.md` for serialization rules.
- **Cross-reference**: See `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`.

### Duplication Elimination via Scaffold Extraction

When eliminating desktop↔mobile code duplication, use the `*Shared.tsx` / `__shared__/` scaffold pattern:
- Create shared component in `frontend/common/components/ui/__shared__/*Shared.tsx` with `SharedOptions` interface
- Create options file `*Shared.options.ts` with `DESKTOP_OPTIONS` and `MOBILE_OPTIONS`
- Desktop/mobile files become thin wrappers (1-5 lines) importing the scaffold + options
- See `docs/frontend/ui-shared-scaffold-pattern.md` for the full pattern
- See `docs/frontend/duplication-elimination-patterns.md` for all Patterns A-G
- NEVER use `jscpd:ignore` — fix the root cause instead

## Important References

- `docs/frontend/meeting-integrations-ui.md` - Meeting integration UI patterns canonical reference
- `docs/frontend/whatsapp-ui-patterns.md` - WhatsApp UI patterns canonical reference
- `docs/frontend/quota-ui-patterns.md` - Quota UI patterns canonical reference
- `docs/frontend/ui-shared-scaffold-pattern.md` - UI Shared Scaffold (*Shared.tsx) pattern
- `docs/frontend/duplication-elimination-patterns.md` - Duplication elimination patterns
- `docs/frontend/emotion-rtl-stylis.md` - Emotion RTL stylis cache rules

### New MUI v9 Patterns

- **`@keyframes` in sx**: Embed `@keyframes` directly in sx prop objects — not via `@mui/material/styles` `keyframes`.
- **`component="output"` for aria-live**: Use `<Box component="output" aria-busy>` instead of `role="status"` (oxlint `prefer-tag-over-role`). Use `<Box component="alert">` instead of `role="alert"` on non-Alert elements.
- **Stack `alignItems`/`justifyContent`**: NOT valid direct props — always use `sx`.

### New React 19 Patterns

- **RefObject**: React 19 deprecates `MutableRefObject`. Use `RefObject<T>` — `current` is mutable.
- **`renderHook` unavailable in `bun:test`**: Use consumer-component pattern (render a component calling the hook, capture state via `useEffect`).

### New Accessibility Patterns

- **`aria-invalid`**: `aria-invalid={!!error}` on form `TextField`s with validation errors.
- **`PermissionDeniedFallback`**: `LockOutlined` icon + title + description + `role="alert"` — not bare `null`.
- **Reduced motion**: `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` → set MUI `Fade`/`Grow` `timeout={0}` when true.

### Enum Safety

- **`no-unsafe-enum-comparison` (oxlint)**: Use `Record<string, string>` lookup tables, not switch statements on enum values.
- **`no-unsafe-type-assertion` (oxlint)**: Use type guards (`value is Type`) instead of `as` casts.

## Performance & Serverless Optimization

- **Client logger `batchInterval`** MUST be at least 30s in production; `beforeunload` flush is required (uses `fetch` with `keepalive: true`, NOT `navigator.sendBeacon`); error/warn logs MUST bypass min-batch-size guard via `hasPriorityLog` flag
- **`RequirePermission`** MUST NOT log DEBUG messages by default — gate behind `process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"`
- **Poll interval optimization**: `NOTIFICATION_COUNT_POLL_INTERVAL_MS` is 120s (not 60s); `useIdleDetection` pauses polling after 5 min idle; `visibilitychange` pauses when tab hidden

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.
