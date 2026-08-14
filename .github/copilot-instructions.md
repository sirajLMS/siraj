# Repository Copilot Instructions

## Codebase Search Protocol

- **ALWAYS PREFER `search_codebase`**: When searching for code snippets, business logic, components, types, database schemas, or service definitions, use the `search_codebase` MCP tool (`milvus-rag`).
- `search_codebase` performs semantic RAG searches over the Milvus vector database for this repository (`rag____master`).
- Do NOT default to raw `grep` or browsing files when looking up codebase context.

## Linting Rules

- **NEVER add `oxlint-disable` comments** — fix the root cause instead. See `docs/quality/linting-rules.md` for fix patterns.
- Fixing oxlint issues can introduce ESLint/sonarjs errors (e.g., removing `void` triggers `no-new`, removing `as` triggers `different-types-comparison`). Always run `bun lint` and `bun lint:type-aware` after oxlint fixes.
- Type guards (`value is Type`) are the universal escape hatch for `no-unsafe-type-assertion`.

