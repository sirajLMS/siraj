---
name: fix
description: Use when you have lint errors, formatting issues, or before committing code to ensure it passes CI.
---

# Fix Lint and Formatting

## Instructions

1. Run `bun biome:check` to fix formatting and lint issues
2. Run `bun lint` to advanced lint issues
   ```
3. Report any remaining manual fixes needed

## Common Mistakes

- **Running prettier on wrong files** - `bun biome:check` only formats changed files
- **Ignoring linc errors** - These will fail CI, fix them before committing
- **Disable lint** - biome ignore and eslint disable are not allowed
