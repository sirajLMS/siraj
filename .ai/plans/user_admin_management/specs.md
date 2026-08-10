# Feature Specification: Super Admin User Entity Management (Status + Password Reset)

## Feature Overview
Enable super admins to manage the base user entity fields (AccountStatus and password) on other users' profile edit pages, with audit logging and optional email notifications.

## User Stories

**User Story 1:** As a super admin, I want to change a user's account status (ACTIVATED/DEACTIVATED) from their profile edit page, so that I can quickly activate or deactivate user access without navigating to a separate admin panel.

**User Story 2:** As a super admin, I want to reset a user's password from their profile edit page, so that I can help users who have lost access to their accounts without requiring them to use the "forgot password" flow.

**User Story 3:** As a super admin, I want to optionally send an email notification when resetting a user's password, so that the user is informed of the change and can log in with the new credentials.

**User Story 4:** As a super admin, I want all status changes and password resets to be audit logged, so that there is a complete trail of administrative actions on user accounts.

## Acceptance Criteria (EARS Format)

### Account Status Management
1. WHEN a super admin views another user's profile edit page THEN the system SHALL display an Account Status dropdown with ACTIVATED/DEACTIVATED options
2. WHEN a super admin changes a user's account status and saves THEN the system SHALL update the user's `status` field in the database
3. WHEN a super admin changes a user's account status THEN the system SHALL create an audit log entry with action "USER_STATUS_CHANGED" and metadata containing the new status
4. WHEN a non-super-admin attempts to change account status THEN the system SHALL deny the action with insufficient permissions error
5. WHEN a super admin changes their own account status via admin path THEN the system SHALL allow it (no self-restriction for status)

### Admin Password Reset
6. WHEN a super admin views another user's profile edit page THEN the system SHALL display a "Reset Password" button/action
7. WHEN a super admin clicks "Reset Password" THEN the system SHALL open a dialog with new password, confirm password, and "Send notification email" checkbox (default checked)
8. WHEN a super admin submits the reset password form with valid data THEN the system SHALL hash the new password and update the user's password in the database
9. WHEN a super admin resets a user's password with "Send notification email" checked THEN the system SHALL send a password reset notification email to the user
10. WHEN a super admin resets a user's password with "Send notification email" unchecked THEN the system SHALL NOT send an email notification
11. WHEN a super admin attempts to reset their own password via admin path THEN the system SHALL deny with "cannot reset own password via admin" error (must use changePassword)
12. WHEN a non-super-admin attempts to reset password THEN the system SHALL deny with insufficient permissions error
13. WHEN password reset succeeds THEN the system SHALL create an audit log entry with action "USER_PASSWORD_RESET_BY_ADMIN" and metadata containing emailSent boolean

### Permission & Scope
14. WHEN a super admin edits any user type (teacher, parent, staff, student, supervisor) THEN the system SHALL show status dropdown and reset password action for all user types
15. WHEN a super admin impersonates another user THEN the system SHALL NOT allow admin password reset (notImpersonating: true)
16. WHEN a super admin performs admin password reset THEN the system SHALL require USER_ADMIN_RESET_PASSWORD permission

### Frontend Integration
17. WHEN a super admin is in admin scope (editing another user) THEN the system SHALL show status field and reset password button in the appropriate admin section for each user type
18. WHEN the profile edit form is submitted with status change THEN the system SHALL include status in the updateUserProfile mutation
19. WHEN the reset password dialog is submitted THEN the system SHALL call adminResetPassword mutation separately from profile save

## Edge Cases & Constraints

- **Self-restriction**: Super admin cannot reset their own password via admin path (must use regular changePassword)
- **Impersonation block**: Admin password reset blocked during impersonation sessions
- **Student status separation**: StudentStatus (Regular/Suspended/OnLeave) is separate from AccountStatus (ACTIVATED/DEACTIVATED) - only AccountStatus is in scope
- **Email notification failure**: If email fails to send, password reset still succeeds but emailSent=false in audit log
- **Password strength**: New password must pass existing validation rules
- **Audit log**: All actions must create entries in admin_audit_logs table

## Technical Constraints

- Must follow existing GraphQL mutation patterns (authScopes, notImpersonating, requireAuth, ctx.t())
- Must use existing permission system (AppPermission enum, PermissionsService)
- Must use existing audit logging (AdminAuditLogService)
- Must use existing email/notification system (CommunicationService.dispatch)
- Must follow existing type definition patterns (backend/types/)
- Must run quality gate (tsgo, biome, lint) on all new/modified files