Frontend project's rules: Read frontend/AGENTS.md

## SonarQube Issue Management

- **Existing Results**: When `.scannerwork/sonar-result.json` is present, use `scripts/sonar-manager.ts`. **Do NOT run a new Sonar analysis command.**
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
- **Always use the logger utility**: `import { logger } from '@/src/utils/logger'`
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
