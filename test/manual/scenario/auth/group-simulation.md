# Manual scenario: Permission group simulation

## Prerequisites

- Log in as a super admin.
- At least one permission group exists in the database (e.g. `teacher`, `parent`).

## Start simulation (header user menu)

1. Open the **header user menu** (avatar, top-right).
2. Choose **Simulate permission group**.
3. Pick a group from the submenu (e.g. **Teacher**).
4. Verify the banner: **You are previewing the site as the {name} permission group.**
5. Verify sidebar/nav reflects that group's permissions (not full super-admin nav).
6. Verify your identity in **me** / profile areas still shows the admin account.

## While simulating

1. Browse pages allowed for the simulated group.
2. Confirm super-admin-only pages are hidden or blocked.
3. Confirm `permissionGroupSimulationStatus.isActive` is true with the selected `groupSlug`.

## End simulation

1. Open the header user menu and click **Return to normal permissions** (or use the banner link).
2. Verify super-admin navigation returns.
3. Confirm `permissionGroupSimulationStatus.isActive` is false.

## Mutual exclusion with impersonation

1. Start **Log in as** on a user from a directory or profile **Administration** panel.
2. Confirm **Simulate permission group** is not available in the header menu.
3. End impersonation, then start group simulation — impersonation must not remain active.

## Security checks

- Non-super-admin cannot call `startPermissionGroupSimulation`.
- Starting simulation ends any active impersonation session (and vice versa).
