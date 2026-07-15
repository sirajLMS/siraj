---
name: "01: Fix sessionNotActivated missing from ErrorsLabels type"
overview: "Add sessionNotActivated property to ErrorsLabels type and locale implementations"
todos:
  - id: "1"
    content: Add sessionNotActivated to ErrorsLabels interface in shared/locale/types/errors/index.ts
    status: "pending"
  - id: "2"
    content: Add sessionNotActivated translation to shared/locale/en/errors/index.ts
    status: "pending"
  - id: "3"
    content: Add sessionNotActivated translation to shared/locale/ar/errors/index.ts
    status: "pending"
  - id: "4"
    content: Remove duplicate sessionNotActivated from shared/locale/types/errors/index.ts (line 152)
    status: "pending"
isProject: false
---

# Plan 01: Fix sessionNotActivated Missing from ErrorsLabels

## Files to Modify
1. `shared/locale/types/errors/index.ts` - Add to ErrorsLabels interface, remove duplicate
2. `shared/locale/en/errors/index.ts` - Add English translation
3. `shared/locale/ar/errors/index.ts` - Add Arabic translation

## Backend Files Using This
- `backend/db/repo/scheduling/state-changes.ts:263`
- `backend/services/session/class-session.service.ts:99`

## Details
The ErrorsLabels type is missing `sessionNotActivated` but it's used in backend code. Also there's a duplicate declaration at line 152 that needs removal.
