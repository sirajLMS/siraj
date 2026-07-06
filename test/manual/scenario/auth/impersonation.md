# Manual scenario: Admin user impersonation

## Prerequisites

- Log in as a super admin (`users.is_super_admin = true` or demo `super_admin` group when `IS_DEMO=true`).
- Target user exists, is active, and is not a super admin.

## Start impersonation (primary: profile Administration)

1. Open a **teacher** or **parent** profile (`/teachers/[id]/profile` or `/parents/[id]/profile`).
2. In the **Administration** section, click **Log in as**.
3. Optionally enter a reason and confirm.

### Secondary entry points

- **Managers**, **Teachers**, or **Parents** directory row actions.
- **Permissions → Assigned users** list.

## While impersonating

1. Verify the banner: **You are logged in as {name}. Return to your normal login**
2. Open the **header user menu**: dual avatars on the trigger; **Return to your normal login** in the menu.
3. Verify sidebar/nav matches the target user's permissions.
4. Confirm sensitive admin actions are blocked (billing admin mutations, permission group edits, manager creation).
5. Confirm **Simulate permission group** is not shown in the header menu.
6. Confirm actions are attributed to the admin in `admin_audit_logs` (`IMPERSONATION_START` / `IMPERSONATION_END`).

## End impersonation

1. Click **Return to your normal login** in the banner or header user menu.
2. Verify the banner disappears and admin navigation returns.
3. Confirm `impersonationStatus.isActive` is false.

## Security checks

- Super admin cannot impersonate another super admin.
- Non-super-admin receives forbidden when calling `startImpersonation`.
- Starting impersonation ends any active permission group simulation.
- Impersonation auto-expires after 30 minutes (Redis + JWT validation).
