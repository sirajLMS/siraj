---
name: "01: Fix sessionNotActivated missing from ErrorsLabels type"
overview: "Add sessionNotActivated property to ErrorsLabels type and implementations"
todos:
  - id: "1"
    content: Add sessionNotActivated to ErrorsLabels interface in shared/locale/types/errors/index.ts
    status: "pending"
  - id: "2"
    content: Add sessionNotActivated to English implementation in shared/locale/en/errors/index.ts
    status: "pending"
  - id: "3"
    content: Add sessionNotActivated to Arabic implementation in shared/locale/ar/errors/index.ts
    status: "pending"
isProject: false
---

# Plan 01: Fix sessionNotActivated Missing from ErrorsLabels

## Files to Modify
1. `shared/locale/types/errors/index.ts` - Add sessionNotActivated to ErrorsLabels interface
2. `shared/locale/en/errors/index.ts` - Add English translation
3. `shared/locale/ar/errors/index.ts` - Add Arabic translation

## Details
The ErrorsLabels type is missing `sessionNotActivated` property but it's being used in:
- `backend/db/repo/scheduling/state-changes.ts:263`
- `backend/services/session/class-session.service.ts:99`

And the locale implementations have it but the type doesn't, causing errors in both directions.
