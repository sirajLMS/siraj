## SonarQube Issue Management

- **Existing Results**: When `.scannerwork/sonar-result.json` is present, use `scripts/sonar-manager.ts`. **Do NOT run a new Sonar analysis command (`sonar-scan`) manually if issues exist.**
- **Mandatory Workflow**: Follow the [NEW_PAGE_WORKFLOW.md](NEW_PAGE_WORKFLOW.md) for all new page implementations.
- **Strict Remediation**: Once `quality-gate` (or `sonar-scan`) has generated results with issues, you MUST ONLY use `sonar-manager` to interact with them. Running `sonar-scan` again while issues are unresolved is forbidden as it bypasses the state machine.
- **Mandatory Priority**: All DUPLICATIONS must be resolved before addressing standard ISSUES.
- **Parallel Workflow**:
  1.  **Resolve Duplications**:
      - Run `bun scripts/sonar-manager.ts list-duplicates`.
      - Delegate fixing to sub-agents. Assign ALL files in a duplication group to ONE agent.
      - Clear entries with `bun scripts/sonar-manager.ts delete --file <path>` or `--all-duplicates`.
  2.  **Resolve Issues**:
      - Run `bun scripts/sonar-manager.ts list-files`.
      - Delegate EACH file to a separate sub-agent.
      - Each sub-agent: `list-issues --file <path>`, apply fix, then `delete --file <path>`.
  3.  **Final Verification**: Both `list-duplicates` and `list-files` must return empty.

## AI Agent Communication Rules

- **NEVER create summary markdown files** for work completed (e.g., `SUMMARY.md`, `CHANGES.md`, `REPORT.md`, `FIXED.md`)
- **DO respond in chat** with a clear summary of what was done
- Summary files clutter the repository and are not needed
- Exception: Documentation files that are part of the project structure (e.g., `README.md`, `CONTRIBUTING.md`, `API.md`)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Scripts and Commands

- Prefer Bun's built-in commands over npm equivalents
- Use `~/.bun/bin/bun create` for scaffolding new projects
- Use layer-specific test scripts (see `package.json`):
  - `bun run build:test` — production build for UI/E2E (`.next-test-prod`; **required before** `test:ui:e2e`)
  - `bun run test:graphql` — GraphQL integration tests (`frontend/common/graphql/test/`; dev server)
  - `bun run test:ui:components` — UI component tests (`test/ui/components/`; Happy DOM, no server)
  - `bun run test:ui:e2e` — UI end-to-end tests (`test/ui/e2e/`; production `next start`)
  - `bun run test:ui:static` — mobile/desktop import isolation (`test/ui/mobile-desktop-isolation.test.ts`)
  - `bun run test:ui` — all UI tests (components + e2e + static)
  - `bun run test:ui:kill` — kill test servers on ports 3001/3020–3199 only (never dev:3000 or start:4000)
  - `bun run test` — all tests across all layers
- UI test details: `test/ui/AGENTS.md`
- Use `~/.bun/bin/bun build` for building projects
- Use `bun quality-gate` for automated iterative code quality verification

## Package Manager Configuration

- Always use Bun as the package manager instead of npm, yarn, or pnpm
- Use the specific Bun binary path: ~/.bun/bin/bun
- When installing packages, use: ~/.bun/bin/bun install
- When adding packages, use: ~/.bun/bin/bun add <package-name>
- When removing packages, use: ~/.bun/bin/bun remove <package-name>
- When running scripts, use: ~/.bun/bin/bun run <script-name>
- When executing files directly, use: ~/.bun/bin/bun <file-path>

## Logging

- **NEVER use `console` methods directly** - ESLint will error
- **Always use the logger utility**: `import { logger } from '@/frontend/utils/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`
- `info`, `warn`, and `debug` are suppressed in production; `error` always logs.

---

## applyTo: "\*_/_"

These are some guidelines when using the SonarQube MCP server.

# Important Tool Guidelines

## Basic usage

- **IMPORTANT**: After you finish generating or modifying any code files at the very end of the task, you MUST call the `analyze_file_list` tool (if it exists) to analyze the files you created or modified.
- **IMPORTANT**: When starting a new task, you MUST disable automatic analysis with the `toggle_automatic_analysis` tool if it exists.
- **IMPORTANT**: When you are done generating code at the very end of the task, you MUST re-enable automatic analysis with the `toggle_automatic_analysis` tool if it exists.

## Project Keys

- When a user mentions a project key, use `search_my_sonarqube_projects` first to find the exact project key
- Don't guess project keys - always look them up

## Code Language Detection

- When analyzing code snippets, try to detect the programming language from the code syntax
- If unclear, ask the user or make an educated guess based on syntax

## Branch and Pull Request Context

- Many operations support branch-specific analysis
- If user mentions working on a feature branch, include the branch parameter

## Code Issues and Violations

- After fixing issues, do not attempt to verify them using `search_sonar_issues_in_projects`, as the server will not yet reflect the updates

# Common Troubleshooting

## Authentication Issues

- SonarQube requires USER tokens (not project tokens)
- When the error `SonarQube answered with Not authorized` occurs, verify the token type

## Project Not Found

- Use `search_my_sonarqube_projects` to find available projects
- Verify project key spelling and format

## Code Analysis Issues

- Ensure programming language is correctly specified
- Remind users that snippet analysis doesn't replace full project scans
- Provide full file content for better analysis results

## Theme and Styling Rules

- **NO hardcoded colors allowed** - All colors MUST come from the theme palette.
- **NEVER use hex colors, rgb/rgba values, or color names**.
- **NO Quotes for Colors**: Never use string-based palette access (e.g., `color="primary.main"`).
- **Theme Callback Pattern**: Use the theme callback pattern ONLY when theme-specific values are needed:
    - `sx={(theme) => ({ color: theme.palette.primary.main })}`
- **Universal Contrast**: Use Material 3 `on<Color>` siblings instead of `contrastText` (e.g., `theme.palette.onPrimary`).
- **NO DELETION**: Never delete existing theme values like `boxShadow`. Map them to `theme.palette.shadow.card`.
- Refer to **THEME_PALETTE.md** for all color tokens and access patterns.

## Code Quality Checks

**The "Zero-Tolerance" Quality Gate:**

After making any code modifications, you MUST run the automated quality gate:

```bash
bun quality-gate
```

**Workflow Lifecycle:**
1.  **Stages**: The script runs sequential stages: `BASIC_CHECKS` (tsgo, biome, lint) -> `CODESCENE` -> `SONAR_SCAN` -> `SONAR_RESULTS`.
2.  **State Persistence**: Progress is saved in `.quality-gate-state.json`. If a stage fails, the script exits and saves its state.
3.  **Ownership Mechanism**:
    *   If `CODESCENE` fails, state is owned by `codescene`. Run `bun run codescene --file <path>` to fix. Once all files reach "Perfect health", the script automatically transfers ownership back to `quality-gate` and advances to `SONAR_SCAN`.
    *   If `SONAR_RESULTS` fails, state is owned by `sonar-manager`. Use `bun scripts/sonar-manager.ts` to resolve duplications/issues. Once cleared, it transfers ownership back to `quality-gate` and advances to `SONAR_RESULTS` (Final check).
4.  **Resuming**: Simply run `bun quality-gate` again. It will resume from the last failed stage only if it "owns" the state or if you've resolved the blocking issues.
5.  **Fresh Start**: If you encounter a "state lock" or want to force a clean-slate verification (e.g., after a large refactor), use `bun quality-gate:fresh`. This clears the saved state and stale Sonar results.
6.  **Live Streaming**: All output is streamed live. Use the real-time logs to identify failures immediately.

- **NEVER** bypass this gate.
- **NEVER** skip CodeScene or SonarQube diagnostics—they catch architectural issues that linting misses.
- **Timeout**: The gate has a default 5-minute timeout to prevent hanging.

## Code Style Rules

- **Review [IMPLEMENTATION_LEARNINGS.md](IMPLEMENTATION_LEARNINGS.md)** for detailed error resolutions to prevent repeating previous mistakes.
- **No nested ternary operators** - SonarJS will flag them as code smells
- Extract nested ternaries into if/else statements or separate functions

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
- **Directory structure**: Place versioned files in `mobile/` and `desktop/` subdirectories under each domain. Shared components in `shared/`.
- **Zero `useMediaQuery`**: `.mobile.tsx` and `.desktop.tsx` files must never import or call `useMediaQuery` (ESLint enforced).
- **Zero viewport context**: `.mobile.tsx` and `.desktop.tsx` files must never import `useViewport` or `ViewportContext` (ESLint enforced).
- **No cross-imports**: `.mobile.tsx` must not import `.desktop.tsx` and vice versa (ESLint enforced).
- **ViewModel pattern**: Business logic lives in `useXxViewModel()` hooks. All mutable state in Zustand stores (survives viewport tier switching). `File` objects in `useRef` in the hook, not Zustand (serialization safety).
- **Switcher uses `ResponsiveViewSwitch` with lazy loading**: The `xxView.tsx` switcher calls `createLazyView()` at module top level (static import paths required by `next/dynamic`) and passes lazy component refs to `<ResponsiveViewSwitch>`. Only the matching tier's code is downloaded. `ResponsiveViewSwitch` internally reads `useViewport()` and wraps in `Suspense` + `ErrorBoundary`.
- **Shared components**: Non-versioned components (e.g., `StatusBadge`, `BaseCard`) used by both tiers. They contain NO `useMediaQuery` and NO viewport logic. Metric **cards** are not imported by views — use tier `*MetricCardGrid` instead.
- **Component directory convention**:
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
    xxView.tsx
  ```

## Mobile vs Desktop Isolation

- **File naming**: `.mobile.tsx` for mobile views/components, `.desktop.tsx` for desktop views/components. No suffix for shared components.
- **Directory structure**: Place versioned files in `mobile/` and `desktop/` subdirectories under their domain. Shared components in `shared/` subdirectory.
- **Zero useMediaQuery**: `.mobile.tsx` and `.desktop.tsx` files must NEVER import or call `useMediaQuery` — viewport tier is decided by the parent switcher (`View.tsx`).
- **Zero viewport context**: `.mobile.tsx` and `.desktop.tsx` files must NEVER import `useViewport` or `ViewportContext` — they are already tier-specific.
- **No cross-imports**: `.mobile.tsx` must not import `.desktop.tsx` and vice versa (ESLint enforced via `no-restricted-imports`).
- **ViewModel pattern**: Business logic lives in `useXxViewModel()` hooks, not in view components or Context.
- **Zustand for state**: All UI state (filters, pagination, dialog open, form values) lives in Zustand stores so it survives viewport tier switching during resize.
- **Only `ResponsiveViewSwitch` reads viewport**: The switcher component delegates to `ResponsiveViewSwitch` (which reads `useViewport()` internally) — the switcher file itself no longer imports `useViewport`. Only the matching `.mobile.tsx` or `.desktop.tsx` is lazy-loaded.
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


## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.
