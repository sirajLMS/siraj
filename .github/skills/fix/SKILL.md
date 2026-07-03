---
name: fix
description: Use when you have lint errors, formatting issues, or before committing code to ensure it passes CI.
---

# Fix Lint and Formatting

## Instructions

1. Run `bun biome:check` to fix formatting and lint issues
2. Run lint via the lint queue client (NEVER run `bun lint` directly):
   ```bash
   curl -s -X POST http://localhost:4777/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"fix-skill","files":["<file-path>"]}'
   ```
3. Report any remaining manual fixes needed

## Common Mistakes

- **Running prettier on wrong files** - `bun biome:check` only formats changed files
- **Ignoring linc errors** - These will fail CI, fix them before committing
- **Disable lint** - biome ignore and eslint disable are not allowed
