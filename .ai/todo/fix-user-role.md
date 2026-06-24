# Fix: Remove `role` field from user-related code

## Problem
The system is permissions-driven and should not have a `role` concept for users. The `role` field currently exists in several places as a display-only derived value, but it should be removed entirely.

## Affected Files

1. **`backend/services/auth/permissions.service.ts`**
   - `UserPermissionContext` type has a `role: string` field
   - `getUserContext()` derives role from permission group slugs (e.g., "Teacher", "Parent", "User")
   - Remove `role` from the type and the function

2. **`frontend/stores/userStore.ts`**
   - `UserState` interface has `role: string`
   - `setUser` sets `role` from the user object
   - Remove `role` from the store

3. **`frontend/views/dashboard/components/DashboardLayout.tsx`**
   - Props include `userRole: string` and `roleLabel: string`
   - Passed to `TopNavbar` and `Sidebar`
   - Remove these props

4. **`frontend/views/dashboard/components/TopNavbar.tsx`**
   - Receives and displays `userRole` and `roleLabel`
   - Remove role display

5. **`frontend/views/dashboard/components/Sidebar.tsx`**
   - Receives `roleLabel` prop
   - Remove role display

6. **`frontend/views/dashboard/types/dashboard.ts`**
   - `UserInfo` interface has `role: string`
   - Remove `role` field

7. **`frontend/graphql/generated/gql/graphql-types.ts`**
   - Generated `User` type has `role` field
   - This is auto-generated; update the GraphQL schema/Pothos to stop exposing role

8. **`backend/graphql/pothos/auth.pothos.ts`**
   - Exposes `role` as a field on the User Pothos object
   - Remove the field

## Priority
Low — this is a cleanup task. The `role` field is currently harmless (derived, not stored), but it contradicts the permissions-driven architecture.
