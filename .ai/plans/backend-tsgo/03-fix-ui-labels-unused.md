---
name: "03: Fix UiLabels declared but never used"
overview: "Remove unused UiLabels import from message.ts or add ui key to MessageSchema"
todos:
  - id: "1"
    content: Either remove UiLabels import from shared/locale/types/message.ts or add "ui": UiLabels to MessageSchema
    status: "pending"
isProject: false
---

# Plan 03: Fix UiLabels Declared But Never Used

## File to Modify
- `shared/locale/types/message.ts` - Line 98: 'UiLabels' is declared but never used

## Details
The UiLabels is imported but not added to MessageSchema. Since we're using sub-namespaces (ui.paymentMethod, ui.meetingConfig, etc.), we have two options:
1. Remove the UiLabels import (if not using top-level ui namespace)
2. Add "ui": UiLabels to MessageSchema and create combined exports (requires Plan 01 from frontend plans)

Recommendation: Remove the UiLabels import since we're using sub-namespaces.
