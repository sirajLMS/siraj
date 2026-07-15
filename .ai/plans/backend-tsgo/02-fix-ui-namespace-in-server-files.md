---
name: "02: Fix 'ui' namespace in server.ts and server-graphql.ts"
overview: "Remove or fix the 'ui' namespace path mapping that's causing type errors"
todos:
  - id: "1"
    content: Remove 'ui' entry from namespacePaths in shared/locale/server.ts (line 114)
    status: "pending"
  - id: "2"
    content: Remove 'ui' entry from namespacePaths in shared/locale/server-graphql.ts (line 108)
    status: "pending"
  - id: "3"
    content: Verify the fix doesn't break ui sub-namespace loading
    status: "pending"
isProject: false
---

# Plan 02: Fix 'ui' Namespace in Server Files

## Files to Modify
1. `shared/locale/server.ts` - Remove 'ui': 'ui/index' from namespacePaths
2. `shared/locale/server-graphql.ts` - Remove 'ui': 'ui/index' from namespacePaths

## Details
The 'ui' key was added to MessageSchema but the namespacePaths maps it to 'ui/index' which doesn't exist as a single file. The UI sub-namespaces (ui.paymentMethod, ui.meetingConfig, etc.) are loaded individually. The top-level 'ui' key should either:
- Not be in namespacePaths (let the individual sub-namespaces handle loading)
- Or point to a combined export file

Currently it causes: "Object literal may only specify known properties, and 'ui' does not exist in type 'Record<keyof MessageSchema, string>'"
