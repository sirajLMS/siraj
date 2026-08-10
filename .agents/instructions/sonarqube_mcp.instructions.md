---
applyTo: "**/*"
---

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


### Oxlint Rules (CRITICAL — NO `oxlint-disable` comments)

- **no-unsafe-type-assertion**: Oxlint is STRICTER than ESLint. `as unknown as T` does NOT bypass it. Use type guards (`value is Type`), `instanceof Error`, `find()` with widening cast `(v as string)`, or `.$type<Enum>()` on Drizzle columns. For `response.json()` use `const data: Type = await response.json()` or type guards.
- **no-await-in-loop**: Use `Promise.all(items.map(async ...))` for independent iterations. Use recursive helpers or `reduce` chains for sequential iterations (shared transactions). `for await...of` is NOT flagged.
- **consistent-function-scoping**: Move functions that don't capture parent variables to module scope.
- **no-object-type-as-default-prop**: Extract `{}` / `[]` defaults to module-level constants.
- **no-underscore-dangle**: Rename `_field` → `field`, or use bracket notation `obj["_ref"]` for external APIs.
- **no-unsafe-enum-comparison**: Use `String(a) === String(Enum.VALUE)`, string literals, or `Set`-based lookups.
- **no-shadow**: Use destructuring rename `{ prop: newName }` or `_` prefix for unused params.
- **consistent-return**: Use `return undefined` instead of bare `return;`. Config override exists for `useEffect`.
- Config overrides in `oxlint.config.mts` for test files (`unbound-method: off`) and `useEffect` files (`consistent-return: off`) are legitimate — NOT `oxlint-disable` comments.
