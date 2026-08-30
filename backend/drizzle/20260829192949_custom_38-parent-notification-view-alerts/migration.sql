-- Source: 38-parent-notification-view-alerts.sql
-- Parent notification alerts permission grant
-- Grants `notification.view_alerts` to the `parent_default` system group so
-- parent accounts can open the on-app notifications bell and drawer — the same
-- visibility rule already held by `student_default` (and admin/supervisor
-- groups). ON_APP deliveries (e.g. ACCOUNTING_PAYMENT_RECORDED,
-- ACCOUNTING_LOW_HOURS) are already dispatched to parents; without this grant
-- the bell is hidden by the client permission gate and the alerts query /
-- mark-read mutations reject the parent context.
-- The permission row and enum value already exist; this file only adds the
-- group grant. Idempotent: safe to re-run.

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key = 'notification.view_alerts'
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint

