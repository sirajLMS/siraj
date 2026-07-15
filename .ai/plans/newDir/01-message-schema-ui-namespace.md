---
name: "01: Add UiLabels to MessageSchema and create combined ui namespace"
overview: "Add top-level 'ui' namespace to MessageSchema by importing UiLabels and creating combined exports"
todos:
  - id: "1"
    content: Add UiLabels import to shared/locale/types/message.ts
    status: "pending"
  - id: "2"
    content: Add "ui": UiLabels to MessageSchema type in shared/locale/types/message.ts
    status: "pending"
  - id: "3"
    content: Add namespace path mapping for "ui" in shared/locale/server.ts
    status: "pending"
  - id: "4"
    content: Add namespace path mapping for "ui" in shared/locale/server-graphql.ts
    status: "pending"
  - id: "5"
    content: Create shared/locale/en/ui/index.ts with combined ui export
    status: "pending"
  - id: "6"
    content: Create shared/locale/ar/ui/index.ts with combined ui export
    status: "pending"
isProject: false
---

# Plan 01: Add UiLabels to MessageSchema and Create Combined ui Namespace

## Files to Modify
1. `shared/locale/types/message.ts` - Add UiLabels import and "ui" key to MessageSchema
2. `shared/locale/server.ts` - Add namespace path for "ui"
3. `shared/locale/server-graphql.ts` - Add namespace path for "ui"
4. `shared/locale/en/ui/index.ts` - Create combined ui export (new file)
5. `shared/locale/ar/ui/index.ts` - Create combined ui export (new file)

## Details
The MessageSchema currently has specific sub-namespaces like "ui.paymentMethod", "ui.meetingConfig" but no combined "ui" key. We need to:
1. Import UiLabels from @/shared/locale/types/ui
2. Add "ui": UiLabels to MessageSchema
3. Add "ui": "ui/index" to namespacePaths in both server files
4. Create combined export files that combine all individual UI sub-namespaces
