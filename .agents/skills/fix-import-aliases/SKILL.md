---
name: fix-import-aliases
description: Simple regex-based import alias fixer using parallel subagents. Asks whether to fix frontend, backend, both, or custom path, then launches parallel subagents to convert relative imports to @/ path alias.
disable-model-invocation: true
---

# Fix Import Aliases (Parallel Subagents)

Simple regex-based skill to fix import aliases using `@/` path alias instead of relative `./` or `../` imports. Uses **parallel subagents** for maximum speed.

## Usage

Run this skill and it will ask which scope to fix:
1. **Frontend only** (`frontend/**/*.ts,tsx`)
2. **Backend only** (`backend/**/*.ts,tsx`)
3. **Both** (frontend + backend in parallel)
4. **Custom path** (specify glob pattern)
5. **All TypeScript files** (app, backend, frontend, shared, test, scripts in parallel)

Then launches parallel subagents to replace:
- `from './...` → `from '@/...'`
- `from '../...` → `from '@/...'`
- `import('./...'` → `import('@/...'`
- `import('../...'` → `import('@/...'`

Skips barrel files (`**/index.ts`).

## Script

Run the fix script:

```bash
.agents/skills/fix-import-aliases/fix-import-aliases.sh
```

The script will:
1. Prompt for scope
2. Launch parallel subagents (one per directory)
3. Each subagent processes its assigned directory independently
4. Wait for all to complete
5. Report done

## Parallel Subagent Design

- **One subagent per directory** (e.g., frontend, backend, shared, etc.)
- Each subagent runs independently in background
- Uses `sed` for fast regex replacement
- Handles both GNU sed (Linux) and BSD sed (macOS)
- Skips files without relative imports for speed
- Skips `index.ts` barrel files (per ESLint rule)