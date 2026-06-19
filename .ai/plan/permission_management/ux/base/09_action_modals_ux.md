UX Specification: System Modals

This file defines the generic overlays triggered by actions in the main views. Complex workflows have their own files.

1. Create/Edit Group Modal

Trigger: [ + Create Group ] or [ Edit ]

Components:

Title: "Create Permission Group" / "Edit Group Details"

Input: Group Name (Text, required, max 255 chars).

Input: Description (Textarea, optional).

Footer: [ Cancel ] [ Save Group ]

2. Bulk Action Confirmations

Trigger: BulkActionBar actions across the platform.

Components:

Title: "Confirm Action"

Body: Dynamic text reflecting the action, count, and target (e.g., "Are you sure you want to remove 5 permissions from the Managers group?").

Warning Alert Box: (If removing access) "Users in this group will immediately lose access to these features unless granted by another group or override."

Footer: [ Cancel ] [ Confirm ] (Primary or Danger color depending on action).