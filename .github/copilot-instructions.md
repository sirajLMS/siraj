# Repository Copilot Instructions

## Codebase Search Protocol

- **ALWAYS PREFER `search_codebase`**: When searching for code snippets, business logic, components, types, database schemas, or service definitions, use the `search_codebase` MCP tool (`milvus-rag`).
- `search_codebase` performs semantic RAG searches over the Milvus vector database for this repository (`rag____master`).
- Do NOT default to raw `grep` or browsing files when looking up codebase context.
