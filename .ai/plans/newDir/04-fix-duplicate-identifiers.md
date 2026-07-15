---
name: "04: Fix duplicate sessionNotActivated in errors/index.ts"
overview: "Remove duplicate identifier in shared/locale/types/errors/index.ts"
todos:
  - id: "1"
    content: Remove duplicate sessionNotActivated line 152 in errors/index.ts
    status: "completed"
isProject: false
---

# Plan 04: Fix Duplicate Identifiers

## File to Modify
- `shared/locale/types/errors/index.ts` - Line 134 and 152 both declare `sessionNotActivated`

## Fix
Remove the duplicate entry on line 152 (the second occurrence).
