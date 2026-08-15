# Task 18: Permission Seed Audit — Outcome

**Date**: 2026-08-15
**Task**: 18 — Permission seed audit
**Status**: ✅ Complete

## Summary of Audit

1. **Permission Group Audited**: `academy_admin` (Display Name: `"مدير الأكاديمية"` / `"Manager"`)
2. **Permissions Included**:
   - `auth.login`, `auth.view_own_profile`
   - `dashboard.view_metrics`, `dashboard.filter_metrics`, `dashboard.search`
   - `schedule.view_list`, `schedule.filter_advanced`, `schedule.view_timezones`, `schedule.search_availability`, `schedule.view_weekly`, `schedule.view_workload`, `schedule.create_class`, `schedule.delete_class`, `schedule.clear_weekly`
   - `history.view_calendar`, `history.view_details`
   - `session.override_actions`, `session.view_details`, `session.activate_override`, `session.reschedule`, `session.reset`, `session.update_status.start`, `session.update_status.absent`, `session.update_status.leave`
   - `notification.view_alerts`
   - `billing.view_unpaid_invoices`, `billing.view_history`, `billing.create_invoice`, `billing.update_status_paid`, `billing.delete_invoice`, `billing.view_exchange_rates`, `billing.refresh_exchange_rates`
   - `user.view_profile`, `staff.view_directory`, `staff.edit_profile`
   - `parent.view_directory`, `parent.view_profile`, `parent.manage_status`, `parents.create`
   - `student.view_associated`, `student.edit_quota`, `student.reassign_teacher`, `student.manage_status`, `students.list`, `students.create`, `students.edit`, `students.change_teacher`, `students.change_status`
   - `document.manage_parent_docs`
   - `resources.list`, `resources.upload`, `resources.delete`
   - `report.generate_custom`, `report.view_financials`
   - `teachers.create`, `teachers.edit`, `teachers.list`
   - `complaints.list`, `complaints.delete`, `complaints.respond`
   - `suggestions.list`, `suggestions.review`
3. **Excluded Superadmin-Only Permissions**:
   - `permission_groups.manage` ❌ NOT assigned to `academy_admin`
   - `permission_groups.assign` ❌ NOT assigned to `academy_admin`
4. **Seed File Consistency**:
   - Verified matching definitions between `backend/db/migration/3-system_permissions_and_groups.sql` and `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql`.
