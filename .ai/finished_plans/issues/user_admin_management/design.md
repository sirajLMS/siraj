# Technical Design: Super Admin User Entity Management (Status + Password Reset)

## Overview
This design adds two capabilities to the super admin profile editing experience:
1. **Account Status editing** - Extend the existing `updateUserProfile` mutation to accept `status` field in `CoreUserProfileFields`
2. **Admin Password Reset** - New `adminResetPassword` mutation with optional email notification

Both features integrate with existing permission system, audit logging, and notification infrastructure.

## Design Goals
1. **Minimal surface area** - Reuse existing `updateUserProfile` for status, add single new mutation for password reset
2. **Consistent permissions** - Use existing `PROFILE_CORE_IDENTITY_EDIT_OTHER` for status, new `USER_ADMIN_RESET_PASSWORD` for password reset
3. **Audit compliance** - All actions logged via `AdminAuditLogService`
4. **Notification integration** - Optional email via existing `CommunicationService.dispatch`
5. **Frontend parity** - Show in admin sections for all user types (teacher, parent, staff, student, supervisor)

## Key Design Decisions

### Decision: Status Field in CoreUserProfileFields
**Context:** Where to place the `status` field for super admin editing
**Options Considered:**
1. Add to `CoreUserProfileFields` - Reuses existing `updateUserProfile` mutation
2. Create separate `updateUserStatus` mutation - More granular but more surface area
3. Add to role-specific admin inputs (StaffAdminProfileUpdateInput already has status) - Inconsistent across user types

**Decision:** Add to `CoreUserProfileFields`
**Rationale:** 
- Single mutation (`updateUserProfile`) handles all core user fields
- Consistent across all user types (teacher, parent, staff, student, supervisor)
- Super admin already has `PROFILE_CORE_IDENTITY_EDIT_OTHER` permission
- Minimal code changes

### Decision: New Permission for Password Reset
**Context:** Password reset is a sensitive operation requiring explicit permission
**Options Considered:**
1. Reuse `STAFF_EDIT` or `PROFILE_CORE_IDENTITY_EDIT_OTHER` - Too broad
2. Create new `USER_ADMIN_RESET_PASSWORD` - Explicit, auditable, principle of least privilege

**Decision:** Create new `USER_ADMIN_RESET_PASSWORD` permission
**Rationale:**
- Password reset is high-risk operation
- Explicit permission enables fine-grained control
- Audit trail can reference specific permission
- Follows existing pattern (e.g., `PARENT_MANAGE_STATUS`, `STUDENT_MANAGE_STATUS`)

### Decision: Separate Mutation for Password Reset
**Context:** Password reset requires different input (new password only, no current password) and optional email
**Options Considered:**
1. Extend `updateUserProfile` with optional password fields - Mixes concerns, complex validation
2. New `adminResetPassword` mutation - Clean separation, explicit intent

**Decision:** New `adminResetPassword` mutation
**Rationale:**
- Different validation logic (no current password required)
- Optional email notification parameter
- Clear audit action type
- Follows existing pattern (`changePassword` vs `updateOwnProfile`)

### Decision: Self-Restriction on Password Reset
**Context:** Super admin should not reset their own password via admin path
**Options Considered:**
1. Allow self-reset - Convenience but security risk
2. Block self-reset, direct to `changePassword` - Security best practice

**Decision:** Block self-reset with clear error
**Rationale:**
- Prevents accidental lockout
- Forces use of `changePassword` which requires current password
- Consistent with `updateManagerProfile` blocking super admin editing other super admins

### Decision: Impersonation Block
**Context:** Admin actions should not be available during impersonation
**Decision:** Add `notImpersonating: true` to `adminResetPassword` auth scope
**Rationale:** Follows existing pattern for sensitive mutations (`createManager`, `adminRevokeMeetingProviderToken`)

## Architecture

### Data Flow: Status Update
```
Frontend (Profile Edit Form)
    → updateUserProfile(userId, { core: { status: "DEACTIVATED" } })
    → ProfileService.updateUserProfile()
    → ProfileService.updateCoreUserFields()
    → UserRepository.updateStatus()
    → AdminAuditLogService.log("USER_STATUS_CHANGED")
    → Return updated UnifiedProfile
```

### Data Flow: Password Reset
```
Frontend (Reset Password Dialog)
    → adminResetPassword(userId, { newPassword, sendNotificationEmail: true })
    → AuthPasswordService.adminResetPassword()
    → PermissionsService.hasPermission(USER_ADMIN_RESET_PASSWORD)
    → validatePasswordStrength()
    → hashPassword()
    → UserRepository.updatePassword()
    → AdminAuditLogService.log("USER_PASSWORD_RESET_BY_ADMIN")
    → CommunicationService.dispatch(PASSWORD_RESET_BY_ADMIN) [if email requested]
    → Return { success: true, emailSent: boolean }
```

## UX/Navigation Specification

### New Routes & URLs
No new routes - features integrate into existing profile edit pages.

### Sidebar/Navigation Integration
No navigation changes - features appear in existing profile edit pages when in admin scope.

### Role-Based Access Matrix

| Feature | SUPER_ADMIN | ACADEMY_ADMIN | SUPERVISOR | TEACHER | PARENT | STUDENT | STAFF |
|---------|-------------|---------------|------------|---------|--------|---------|-------|
| View Status Dropdown | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Status | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reset Password Button | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Execute Password Reset | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Per-Audience Rendering
All user types (teacher, parent, staff, student, supervisor) show:
- **Status dropdown** in admin section when `isAdminScope=true`
- **Reset Password button** in admin section when `isAdminScope=true`

### Mobile vs Desktop Variants
- **Desktop**: Status dropdown in Account/Identity section; Reset Password as button in Actions area
- **Mobile**: Status in collapsible admin section; Reset Password in overflow menu or dedicated admin card

### Permission Mapping
| Action | Permission | Scope |
|--------|------------|-------|
| Edit user status | `PROFILE_CORE_IDENTITY_EDIT_OTHER` | ProfileScope.OTHER |
| Admin reset password | `USER_ADMIN_RESET_PASSWORD` | Global (notImpersonating) |

## Component Specifications

### Backend Types

#### CoreUserProfileFields (Extended)
```typescript
// backend/types/profile/profile.types.ts
export type CoreUserProfileFields = {
  readonly name?: string;
  readonly email?: string;
  readonly avatarUrl?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  readonly timezone?: IanaTimezone | null;
  readonly status?: AccountStatus | null;  // NEW
};
```

#### Admin Password Reset Types
```typescript
// backend/types/auth/auth.types.ts
export type AdminResetPasswordInput = {
  readonly userId: string;
  readonly newPassword: string;
  readonly sendNotificationEmail?: boolean;
};

export type AdminResetPasswordResult = {
  readonly success: boolean;
  readonly emailSent: boolean;
};
```

### GraphQL Schema (Pothos)

#### CoreUserProfileFieldsInputPothosObject (Extended)
```typescript
// backend/graphql/pothos/profile/profile.pothos.ts
export const CoreUserProfileFieldsInputPothosObject = gqlSchemaBuilder
  .inputRef<CoreUserProfileFields>("CoreUserProfileFieldsInput")
  .implement({
    fields: t => ({
      // ...existing fields
      status: t.field({ 
        type: AccountStatusPothosObject, 
        required: false,
        description: "User account status (super admin only)"
      }),
    }),
  });
```

#### Admin Password Reset Input/Output
```typescript
// backend/graphql/pothos/auth/auth.pothos.ts
export const AdminResetPasswordInputPothosObject = gqlSchemaBuilder
  .inputRef<AdminResetPasswordInput>("AdminResetPasswordInput")
  .implement({
    fields: t => ({
      userId: t.id({ required: true }),
      newPassword: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      sendNotificationEmail: t.boolean({ required: false, defaultValue: true }),
    }),
  });

export const AdminResetPasswordResultPothosObject = gqlSchemaBuilder
  .objectRef<AdminResetPasswordResult>("AdminResetPasswordResult")
  .implement({
    fields: t => ({
      success: t.boolean({ nullable: false }),
      emailSent: t.boolean({ nullable: false }),
    }),
  });
```

### Backend Services

#### ProfileService.updateCoreUserFields (Extended)
```typescript
// backend/services/profile/profile.service.ts
async function updateCoreUserFields(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  core: CoreUserProfileFields,
  locale?: string
): Promise<void> {
  // ...existing identity/contact handling
  
  // NEW: Status handling
  if (core.status !== undefined) {
    const statusPermission = scope === ProfileScope.OWN
      ? AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN
      : AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER;
    if (!(await PermissionsService.hasPermission(actorUserId, statusPermission))) {
      throw new Error(tErrors.insufficientPermissions);
    }
    await UserRepository.updateStatus(targetUserId, core.status, undefined, locale);
    
    // Audit log
    await AdminAuditLogService.log({
      actorUserId,
      targetUserId,
      action: "USER_STATUS_CHANGED",
      metadata: { newStatus: core.status },
    });
  }
}
```

#### AuthPasswordService.adminResetPassword (New)
```typescript
// backend/services/auth/auth-password.service.ts
export namespace AuthPasswordService {
  // ...existing changePassword()
  
  export async function adminResetPassword(
    actorUserId: string,
    targetUserId: string,
    input: AdminResetPasswordInput,
    locale?: string
  ): Promise<AdminResetPasswordResult> {
    const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;

    // Permission check
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId, 
      AppPermission.USER_ADMIN_RESET_PASSWORD
    );
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    // Self-restriction
    if (actorUserId === targetUserId) {
      throw new Error(tErrors.cannotResetOwnPasswordViaAdmin);
    }

    // Validate target user exists
    const targetUser = await UserRepository.findUserByIdOrThrow(targetUserId, locale);

    // Validate password strength
    await validatePasswordStrength(input.newPassword, locale);

    // Hash and update
    const hashedPassword = await hashPassword(input.newPassword);
    await UserRepository.updatePassword(targetUserId, hashedPassword, undefined, locale);

    // Audit log
    await AdminAuditLogService.log({
      actorUserId,
      targetUserId,
      action: "USER_PASSWORD_RESET_BY_ADMIN",
      metadata: { emailSent: input.sendNotificationEmail ?? true },
    });

    // Optional email notification
    let emailSent = false;
    if (input.sendNotificationEmail ?? true) {
      try {
        await CommunicationService.dispatch({
          userId: targetUserId,
          eventType: NotificationEventType.PASSWORD_RESET_BY_ADMIN,
          locale,
          metadata: { resetByAdmin: true },
        });
        emailSent = true;
      } catch (err) {
        logger.warn("Failed to send password reset notification", { err, targetUserId });
      }
    }

    return { success: true, emailSent };
  }
}
```

### GraphQL Mutations

#### updateUserProfile (No Change - Works Automatically)
The existing mutation in `backend/graphql/mutation/profile/profile.mutation.ts` already accepts `UpdateUserProfileInput` which includes `core: CoreUserProfileFields` - status field will work automatically.

#### adminResetPassword (New)
```typescript
// backend/graphql/mutation/auth/admin-password.mutation.ts (NEW FILE)
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AdminResetPasswordInputPothosObject, AdminResetPasswordResultPothosObject } from "@/backend/graphql/pothos/auth/auth.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AuthPasswordService } from "@/backend/services/auth/auth-password.service";
import type { AdminResetPasswordInput } from "@/backend/types/auth/auth.types";

gqlSchemaBuilder.mutationField("adminResetPassword", t =>
  t.field({
    type: AdminResetPasswordResultPothosObject,
    authScopes: { 
      permission: AppPermission.USER_ADMIN_RESET_PASSWORD, 
      notImpersonating: true 
    },
    args: {
      input: t.arg({ type: AdminResetPasswordInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return AuthPasswordService.adminResetPassword(
        actorUserId,
        args.input.userId,
        args.input,
        ctx.locale
      );
    },
    description: "Super admin reset user password with optional email notification",
  })
);
```

### Frontend Components

#### useProfileFieldAccess (Extended)
```typescript
// frontend/common/views/dashboard/profile/shared/useProfileFieldAccess.ts
export function useProfileFieldAccess(options: UseProfileFieldAccessOptions = {}) {
  // ...existing
  
  const canEditStatus = (): boolean => {
    const permission = scope === ProfileScope.Own 
      ? resolvePermission("core_identity", "edit_own")
      : resolvePermission("core_identity", "edit_other");
    return hasPermission(permission);
  };

  const canAdminResetPassword = (): boolean => {
    return hasPermission(AppPermission.USER_ADMIN_RESET_PASSWORD);
  };

  return { canView, canEdit, canViewField, showField, scope, canEditStatus, canAdminResetPassword };
}
```

#### ResetPasswordDialog (New)
```typescript
// frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.tsx (NEW)
"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox, Alert } from "@mui/material";
import { useMutation } from "@apollo/client/react";
import { adminResetPasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { logger } from "@/frontend/utils/logger";
import { Translation, useAppTranslation } from "@/shared/locale";

interface ResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  onSuccess: () => void;
}

export function ResetPasswordDialog({ open, onClose, targetUserId, onSuccess }: ResetPasswordDialogProps) {
  const base = useAppTranslation(Translation.Profile.Base);
  const errors = useAppTranslation(Translation.Errors);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [resetPassword, { loading }] = useMutation(adminResetPasswordMutationDocument);

  const handleSubmit = async () => {
    setError(null);
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError(errors.auth.passwordsDoNotMatch);
      return;
    }
    
    try {
      const response = await resetPassword({
        variables: {
          input: { userId: targetUserId, newPassword, sendNotificationEmail: sendEmail }
        }
      });
      
      if (response.data?.adminResetPassword?.success) {
        onSuccess();
        onClose();
      } else {
        setError(errors.auth.passwordResetFailed);
      }
    } catch (err) {
      logger.error("Failed to reset password", err);
      setError(err instanceof Error ? err.message : errors.auth.passwordResetFailed);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{base.resetPassword}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={base.newPassword}
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="new-password"
        />
        <TextField
          label={base.confirmPassword}
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="new-password"
        />
        <FormControlLabel
          control={<Checkbox checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />}
          label={base.sendNotificationEmail}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{base.cancel}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? base.saving : base.resetPassword}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### Integration in Admin Sections
Each user type's admin section adds:
- **Status dropdown** (AccountStatus enum) in Account/Identity section
- **Reset Password button** opening `ResetPasswordDialog`

Files to update per user type:
- `frontend/common/views/dashboard/profile/parent/sections/AccountSection.tsx`
- `frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection.tsx`
- `frontend/common/views/dashboard/profile/staff/sections/AccountSection.tsx`
- `frontend/common/views/dashboard/profile/student/...` (student profile admin section)
- `frontend/common/views/dashboard/profile/supervisor/...` (supervisor profile admin section)

## Error Handling

### Backend Errors
| Scenario | Error Code | Message Key |
|----------|------------|-------------|
| Missing USER_ADMIN_RESET_PASSWORD | FORBIDDEN | insufficientPermissions |
| Self password reset attempt | BAD_USER_INPUT | cannotResetOwnPasswordViaAdmin |
| Password validation failed | BAD_USER_INPUT | passwordTooWeak / passwordsDoNotMatch |
| Target user not found | NOT_FOUND | userNotFound |
| Impersonation active | FORBIDDEN | cannotPerformWhileImpersonating |

### Frontend Errors
- Display localized error messages from `ctx.t()` translations
- Show inline validation for password mismatch
- Toast notification for success/failure

## Testing Strategy

### Unit Tests
- `AuthPasswordService.adminResetPassword` - permission check, self-restriction, password hashing, audit log, email dispatch
- `ProfileService.updateCoreUserFields` - status permission check, status update, audit log

### GraphQL Integration Tests
- `adminResetPassword` mutation - super admin success, non-super-admin denied, self-reset denied, impersonation blocked, email sent/not sent
- `updateUserProfile` with status - super admin can change status for all user types, audit log created

### Frontend Component Tests
- `ResetPasswordDialog` - form validation, mutation call, success/error handling
- Admin sections - status dropdown visibility, reset button visibility, form integration

### E2E Tests
- Super admin edits teacher/parent/staff/student/supervisor profile - changes status, resets password
- Verify audit log entries created
- Verify email sent when checkbox checked

## Migration & Deployment

### Database Migration
```sql
-- New permission
INSERT INTO permissions (key, resource, action, description, category, is_system)
VALUES (
  'user.admin_reset_password'::app_permission,
  'user',
  'admin_reset_password',
  '{"ar": "إعادة تعيين كلمة مرور المستخدم من قبل المشرف", "en": "Admin reset user password"}'::jsonb,
  '{"ar": "إدارة المستخدمين", "en": "User Management"}'::jsonb,
  true
);

-- Grant to super_admin
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin' AND p.key = 'user.admin_reset_password';
```

### Code Generation
```bash
bun run generate:gqlSchema
bun codegen
```

### Quality Gate
```bash
bun quality-gate
```

## Related Documents
- `docs/auth/admin-user-management.md` - To be created during knowledge propagation
- `backend/services/AGENTS.md` - Service layer rules
- `backend/graphql/AGENTS.md` - GraphQL layer rules
- `frontend/AGENTS.md` - Frontend rules
- `.agents/instructions/backend.instructions.md` - Backend implementation guardrails
- `.agents/instructions/frontend.instructions.md` - Frontend implementation guardrails