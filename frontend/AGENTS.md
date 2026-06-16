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
- Use `~/.bun/bin/bun test` for running tests
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

- **Layout:** Use `PageContainer` inside views — never add outer `p: 2/3` (double-padding with `DashboardLayout.pageMargin`).
- **Tables:** Use `AppDataGrid` (`@mui/x-data-grid`) via feature `*DataGrid` wrappers for desktop list pages. Mobile uses `*CardList` components.
- **Metrics:** Use shared `MetricCard` from `@/frontend/components/ui` — do not create per-feature metric card components.
- **Status:** Use shared `StatusBadge` with the correct `category` prop — no inline status chips.
- **Headers:** Use `PageHeader` + `SectionPanel` — not ad-hoc flex title blocks.
- **Actions:** Use `PrimaryPageAction`, `FilterButton`, `ExportButton` presets.
- **Typography:** Use theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) — avoid hardcoded font `sx`.
- **Exceptions:** Embedded tables (e.g. `RegisteredStudentsSection`) may use MUI `Table` styled to `palette.table.header` tokens.
