-- Source: 48-prune-view-other-defaults.sql
-- Migration: Prune profile field `view_other` grants from default parent/teacher groups
-- Removes `group_permissions` rows for `parent_default` and `teacher_default` where the
-- permission is any granted `profile.<group>.view_other` key. These groups must only see
-- their own profile fields; `view_other` visibility belongs to staff/admin groups.
-- Keeps all `view_own` / `edit_own` grants, the `permissions` rows themselves, and every
-- other group untouched (super_admin / academy_admin / supervisor_default retain their
-- `view_other` grants).
-- Key set extracted from `6a-profile-field-permissions.sql` (repaired by
-- `6d-profile-fine-grained-only.sql`): 9 parent profile sections, 5 teacher sections.
-- Plain DELETEs: idempotent, safe to re-run.
-- No trigger disable needed: `trg_protect_system_permissions` guards the `permissions`
-- table only, and this migration deletes exclusively from `group_permissions`.

DELETE FROM group_permissions gp
USING permission_groups g, permissions p
WHERE gp.group_id = g.id
  AND gp.permission_id = p.id
  AND g.slug IN ('parent_default', 'teacher_default')
  AND p.key::text IN (
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.teacher_students.view_other'
  );--> statement-breakpoint

