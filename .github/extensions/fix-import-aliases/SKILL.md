---
name: fix-import-aliases
description: Fix import path aliases to use @/ instead of relative ./ or ../ imports across frontend, backend, or specific paths
---

# Fix Import Path Aliases

## Usage
This skill fixes relative imports (./ or ../) to use the @/ path alias as required by AGENTS.md. It can be used for:
- Frontend files ("./ or ../ → @/frontend/...")
- Backend files ("./ or ../ → @/backend/...")
- Both frontend and backend
- Specific paths or files

## How It Works
1. **Asks for scope**: Frontend, backend, both, or specific path
2. **Finds files** with relative imports using grep
3. **Fixes imports** using regex replacement
4. **Verifies** the fixes with lint

## Base Logic
```typescript
interface FixImportOptions {
  scope: "frontend" | "backend" | "both" | "custom";
  customPath?: string;
}

function getBasePath(importPath: string, filePath: string): string {
  // Determine if frontend or backend and return appropriate base path
  if (filePath.includes("/frontend/")) {
    return "@/frontend";
  } else if (filePath.includes("/backend/")) {
    return "@/backend";
  }
  return "@";
}

function fixRelativeImport(importStatement: string, filePath: string): string {
  const basePath = getBasePath(importStatement, filePath);
  
  // Simple regex to replace relative imports
  return importStatement
    .replace(/from ["']\.\.\//g, `from "${basePath}/`)
    .replace(/from ["']\.\//g, `from "${basePath}/`);
}
```

## Implementation Steps
1. Ask user for scope (frontend, backend, both, or custom path)
2. Find files with relative imports using:
   ```bash
   grep -l "import.*['\"]\.\./\|import.*['\"]\./" <path>
   ```
3. For each file:
   - Identify each relative import
   - Convert to @/ path alias
   - Update the file
4. Run lint check on modified files
5. Report summary of changes

## Examples
```bash
# Find relative imports in backend
find backend -name "*.ts" | xargs grep -l "import.*['\"]\.\./\|import.*['\"]\./"

# Check lint
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"fix-imports","files":["<file-path>"]}'
```

## Limitations
- Only handles TypeScript/JavaScript files (.ts, .tsx, .js, .jsx)
- Simple regex-based replacement (may need refinement for complex cases)
- Assumes standard project structure with frontend/ and backend/ directories