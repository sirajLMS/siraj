---
name: fix-import-aliases
description: Fix import path aliases using LLM editing tools (no scripts). Uses parallel subagents to fix relative imports (@/ path alias) across frontend, backend, or both. No plan creation, no complex workflows - just model-based replacements.
---

# Fix Import Aliases

LLM-based skill to fix import aliases using `@/` path alias instead of relative `./` or `../` imports.

## CRITICAL: NO SCRIPTS FOR REGEX REPLACEMENT

> [!IMPORTANT]
> **This skill is strictly forbidden from using any scripts, programs, or CLI commands (such as shell scripts `.sh`, Python `.py`, Node `.js`/`.ts`, or commands like `sed`, `awk`, `perl`) to perform regex search-and-replace on imports.**
>
> All import alias fixes must be done using standard model-based file editing tools (such as `replace_file_content` or `multi_replace_file_content`). This ensures that the replacements are semantically correct and do not break edge cases.

## Usage

Run this skill and it will ask which scope to fix:
1. **Frontend only** (`frontend/**/*.ts,tsx`)
2. **Backend only** (`backend/**/*.ts,tsx`)
3. **Both** (frontend + backend)
4. **Custom path** (specify glob pattern)
5. **All TypeScript** (app, backend, frontend, shared, test, scripts)

Then launches **parallel subagents** to process files in batches.

## Import Analysis & Path Resolution

Before making any replacement, the subagent must carefully resolve the relative import path to its target location relative to the project root:

1. **Locate the Source File**: Identify the directory of the file currently being processed.
2. **Resolve the Target Path**: Calculate the target path by applying the relative path (`./` or `../`) to the source directory.
   - *Example*: If the file is `frontend/views/dashboard/index.tsx` (directory: `frontend/views/dashboard`) and the import is `../../components/ui/button`, resolving `../../` from `frontend/views/dashboard` goes up to `frontend/`, making the target path `frontend/components/ui/button`.
3. **Map to Alias**:
   - The `@/` alias maps to the root directory.
   - Any root-relative target path `path/to/module` maps to `@/path/to/module`.
   - In the example above, `frontend/components/ui/button` becomes `@/frontend/components/ui/button`.
4. **DO NOT Dumb-Replace**:
   - Never simply prepend `@/` or `@/frontend/` to the relative path. Doing so (e.g., producing `@/frontend/../../components`) is invalid and will break imports.
   - Always fully resolve the path to its canonical, absolute-from-root form first.

## Parallel Subagent Execution

To process files efficiently:
1. Use `grep_search` to find files containing relative imports (`./` or `../`).
2. Group the found files into batches.
3. Launch parallel subagents to process each batch.
4. **Each subagent must view the files, resolve the import paths as described above, and use `replace_file_content` or `multi_replace_file_content` to make the edits.** Subagents must NEVER write or run scripts to automate the replacement.
5. Verify changes with the in-process lint service (no HTTP server):
   ```bash
   bun run scripts/lint-service.ts -f <file-path> --id fix-imports
   ```