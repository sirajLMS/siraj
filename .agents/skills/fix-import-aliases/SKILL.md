---
name: fix-import-aliases
description: Simple regex-based import alias fixer. Uses parallel subagents to fix relative imports (@/ path alias) across frontend, backend, or both. No plan creation, no complex workflows - just regex search/replace via parallel subagents.
disable-model-invocation: true
---

# Fix Import Aliases

Simple regex-based skill to fix import aliases using `@/` path alias instead of relative `./` or `../` imports.

## Usage

Run this skill and it will ask which scope to fix:
1. **Frontend only** (`frontend/**/*.ts,tsx`)
2. **Backend only** (`backend/**/*.ts,tsx`)
3. **Both** (frontend + backend)
4. **Custom path** (specify glob pattern)
5. **All TypeScript** (app, backend, frontend, shared, test, scripts)

Then launches **parallel subagents** to process files in batches.

## Parallel Subagent Execution

The skill uses the `Task` tool to launch multiple `shell` subagents in parallel, each processing a batch of files. This provides massive speedup on large codebases.

## Script

Run the fix script:

```bash
.agents/skills/fix-import-aliases/fix-import-aliases.sh
```

The script will prompt for scope and run the replacements.