---
name: "04: Fix duplicate identifiers in shared/locale/types/errors/index.ts"
overview: "Remove duplicate 'sessionNotActivated' declaration"
todos:
  - id: "1"
    content: Remove duplicate sessionNotActivated line in shared/locale/types/errors/index.ts (line 152)
    status: "pending"
isProject: false
---

# Plan 04: Fix Duplicate Identifiers

## Files to Modify
- `shared/locale/types/errors/index.ts`

## Details
Line 134 and line 152 both declare `readonly sessionNotActivated: string;`. Remove the duplicate at line 152.
