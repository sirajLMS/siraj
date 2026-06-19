Permission Management — Plan 3: Frontend Core (Apollo, Zustand, i18n)

Section 1: Task D — Apollo Documents

File: frontend/graphql/sharedDocuments/permission-management.documents.ts

Define TypedDocumentNode for all operations defined in Plan 2.

Ensure all fragments include id.

Include new bulk mutation documents (bulkAssignUsersToGroupMutationDocument, etc.).

Section 2: Task E — Zustand Store

File: frontend/stores/permissionManagementStore.ts

State Requirements:

Data: groups, permissions, overrides.

UI State: selectedGroupIds[], selectedUserIds[], selectedPermissionIds[].

Dialog States: isCreateGroupOpen, isBulkRemoveUsersOpen, isManageOverridesOpen.

Memory Leak Fix: Include a complete reset() method.

Section 3: Task F — i18n Translations

Files: shared/messages/en.ts, shared/messages/ar/

Required Namespaces (dashboard.permissions):

Tabs: groupsTab, catalogTab, overridesTab.

Single Group: currentPermissions, addPermissions, assignedUsers.

Badges/Tooltips: corePermissionTooltip, systemGroupBadge, explicitGrant, explicitDeny.

Bulk Actions: removeUsersConfirmTitle, removeUsersConfirmBody.

Overrides Modal: effectivePermissions, editOverrides, inheritDefault.

Success Criteria:

[x] Apollo documents strictly typed.

[x] Zustand store exposes a reset() method to be called on unmount.

[x] Arabic translations map 1:1 with English keys.