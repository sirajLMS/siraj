# Plan: Task 4.1 — Schema Indexing Audit (Combined)

**Target Directory:** `.ai/plans/neon`
**Outcome Directory:** `.ai/plans/neon/outcome`
**Related Tasks:** [tasks.md](file://.ai/plans/neon/tasks.md)
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)
**Related Design:** [design.md](file://.ai/plans/neon/design.md)
**Source Plans:** `db_index_minimax_m3.md` (comprehensive scope) + `db_index_deepseek4pro.md` (high-priority subset)

---

## 1. Scope (Confirmed)

- **All missing indexes** (~200+ across 36 schema files)
- **Standard `CREATE INDEX`** (via `drizzle-kit generate`, not CONCURRENTLY)
- **Composite indexes included** for multi-column query patterns
- **Standard B-tree indexes** for soft-delete columns (NOT partial `WHERE deleted_at IS NULL` indexes — standard indexes serve both `IS NULL` and `IS NOT NULL` queries and avoid query planner confusion)

---

## 2. Audit Methodology

Cross-referenced every `where(eq(...))`, `where(and(...))`, `where(isNull(...))`, and `orderBy(...)` call in `backend/db/repo/**/*.ts` against the indexes declared in `backend/db/schema/**/*.ts`. Columns that appear in WHERE/ORDER BY clauses but lack a corresponding index are flagged as missing.

### Index Types to Add

| Type | Pattern | Example |
|---|---|---|
| Single-column FK | `index("table_fk_idx").on(table.fkCol)` | `index("class_instances_recurring_schedule_id_idx").on(table.recurringScheduleId)` |
| Single-column filter | `index("table_col_idx").on(table.col)` | `index("teacher_dues_status_idx").on(table.status)` |
| Composite (multi-col WHERE) | `index("table_c1_c2_idx").on(table.c1, table.c2)` | `index("class_instances_teacher_state_start_idx").on(table.teacherId, table.executionState, table.scheduledStartAt)` |
| Sort column | `index("table_col_idx").on(table.col)` | `index("users_created_at_idx").on(table.createdAt)` |
| Soft-delete column | `index("table_deleted_at_idx").on(table.deletedAt)` | `index("recurring_schedules_deleted_at_idx").on(table.deletedAt)` |

### Why NOT Partial Indexes for `deletedAt`

- PostgreSQL handles NULL efficiently in standard B-tree indexes
- Partial indexes can confuse the query planner when the query doesn't exactly match the partial predicate
- Standard indexes also serve queries that filter on `deleted_at IS NOT NULL` (admin views)

---

## 3. Files to Edit (36 total)

### 3.1 `backend/db/schema/users/users.ts` (~12 indexes)

| Index Name | Column(s) | Reason |
|---|---|---|
| `users_last_login_at_idx` | `last_login_at` | Sort/reporting |
| `users_created_at_idx` | `created_at` | Sort/reporting |
| `users_updated_at_idx` | `updated_at` | Sort/reporting |
| `users_deleted_at_idx` | `deleted_at` | Soft-delete filter |
| `users_display_currency_idx` | `display_currency` | Filter/reporting |
| `users_timezone_idx` | `timezone` | Filter/reporting |
| `users_is_super_admin_idx` | `is_super_admin` | Admin queries |
| `users_phone_idx` | `phone` | Search |
| `users_name_idx` | `name` | Search |
| `users_status_deleted_at_idx` | `status, deleted_at` | Active user lookup (composite) |
| `users_status_created_at_idx` | `status, created_at` | User listing (composite) |

### 3.2 `backend/db/schema/auth/impersonation.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `impersonation_sessions_started_at_idx` | `started_at` | Sort/reporting |
| `impersonation_sessions_ended_at_idx` | `ended_at` | Filter/reporting |

### 3.3 `backend/db/schema/permissions/permissions.ts` (~13 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `permissions_resource_idx` | `resource` | Filter/permission grouping |
| `permissions_action_idx` | `action` | Filter/permission grouping |
| `permissions_is_system_idx` | `is_system` | System permission queries |
| `permission_groups_is_system_idx` | `is_system` | System group queries |
| `permission_groups_created_by_user_id_idx` | `created_by_user_id` | FK/audit queries |
| `permission_groups_created_at_idx` | `created_at` | Sort/reporting |
| `permission_groups_updated_at_idx` | `updated_at` | Sort/reporting |
| `user_permission_groups_assigned_at_idx` | `assigned_at` | Sort/reporting |
| `user_permission_groups_assigned_by_user_id_idx` | `assigned_by_user_id` | FK/audit queries |
| `user_permission_overrides_state_idx` | `state` | Filter/reporting |
| `user_permission_overrides_assigned_by_user_id_idx` | `assigned_by_user_id` | FK/audit queries |
| `user_permission_overrides_created_at_idx` | `created_at` | Sort/reporting |
| `group_permissions_permission_id_idx` | `permission_id` | Reverse lookup (only group_id indexed currently) |

### 3.4 `backend/db/schema/audit/audit.ts` (~5 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `admin_audit_logs_created_at_idx` | `created_at` | Sort/audit timeline |
| `admin_audit_logs_ip_address_idx` | `ip_address` | Filter/security reporting |
| `audit_logs_entity_type_entity_id_created_at_idx` | `entity_type, entity_id, created_at` | Entity audit timeline (composite) |
| `audit_logs_actor_user_id_created_at_idx` | `actor_user_id, created_at` | Actor audit timeline (composite) |
| `audit_logs_action_created_at_idx` | `action, created_at` | Action audit timeline (composite) |

### 3.5 `backend/db/schema/teachers/teachers.ts` (6 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `teachers_created_at_idx` | `created_at` | Sort/reporting |
| `teachers_updated_at_idx` | `updated_at` | Sort/reporting |
| `teachers_nationality_idx` | `nationality` | Filter/reporting |
| `teachers_country_code_idx` | `country_code` | Filter/reporting |
| `teachers_gender_idx` | `gender` | Filter/reporting |
| `teachers_rate_currency_idx` | `rate_currency` | Filter/reporting |

### 3.6 `backend/db/schema/teachers/teacher-availability.ts` (~4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `teacher_vacation_requests_requested_by_user_id_idx` | `requested_by_user_id` | FK/audit queries |
| `teacher_vacation_requests_processed_by_user_id_idx` | `processed_by_user_id` | FK/audit queries |
| `teacher_vacation_requests_start_at_idx` | `start_at` | Range filter |
| `teacher_vacation_requests_end_at_idx` | `end_at` | Range filter |

### 3.7 `backend/db/schema/teachers/teacher-dues.ts` (5 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `teacher_dues_student_id_idx` | `student_id` | FK/student dashboard |
| `teacher_dues_teacher_payment_id_idx` | `teacher_payment_id` | FK/payment reconciliation |
| `teacher_dues_approved_by_user_id_idx` | `approved_by_user_id` | FK/audit queries |
| `teacher_dues_currency_idx` | `currency` | Filter/reporting |
| `teacher_dues_rate_source_idx` | `rate_source` | Filter/reporting |

### 3.8 `backend/db/schema/teachers/teacher-notes.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `teacher_important_notes_is_published_idx` | `is_published` | Filter (`teacher-notes.repository.ts:21`) |
| `teacher_important_notes_deleted_at_idx` | `deleted_at` | Soft-delete filter (`teacher-notes.repository.ts:89,130`) |
| `teacher_important_notes_created_by_user_id_idx` | `created_by_user_id` | FK/audit queries |

### 3.9 `backend/db/schema/teachers/teacher-payments.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `teacher_payments_payment_date_idx` | `payment_date` | Range filter (`teacher-payment.repository.ts:18,33`) |
| `teacher_payments_payment_method_type_idx` | `payment_method_type` | Filter/reporting |
| `teacher_payments_is_test_payment_idx` | `is_test_payment` | Filter/reporting |

### 3.10 `backend/db/schema/teachers/staff.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `staff_profiles_created_at_idx` | `created_at` | Sort/reporting |
| `staff_profiles_updated_at_idx` | `updated_at` | Sort/reporting |
| `staff_profiles_rate_currency_idx` | `rate_currency` | Filter/reporting |

### 3.11 `backend/db/schema/parents/parents.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `parents_created_at_idx` | `created_at` | Sort/reporting |
| `parents_updated_at_idx` | `updated_at` | Sort/reporting |
| `parents_invoice_type_idx` | `invoice_type` | Filter/reporting |
| `parents_currency_idx` | `currency` | Filter/reporting |

### 3.12 `backend/db/schema/students/students.ts` (~10 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `students_language_idx` | `language` | Filter/reporting |
| `students_date_of_birth_idx` | `date_of_birth` | Filter/reporting |
| `students_updated_at_idx` | `updated_at` | Sort/reporting |
| `students_deleted_at_idx` | `deleted_at` | Soft-delete filter |
| `students_parent_id_deleted_at_idx` | `parent_id, deleted_at` | Parent dashboard (composite) |
| `students_primary_teacher_id_status_deleted_at_idx` | `primary_teacher_id, status, deleted_at` | Teacher dashboard (composite) |
| `student_progress_parent_visible_idx` | `parent_visible` | Parent dashboard queries |
| `student_progress_created_at_idx` | `created_at` | Sort/progress timeline |
| `teacher_assignments_ended_at_idx` | `ended_at` | Filter for active assignments (`student.repository.ts:491`) |
| `teacher_assignments_assigned_by_user_id_idx` | `assigned_by_user_id` | FK/audit queries |

### 3.13 `backend/db/schema/classes/scheduling.ts` (~30 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `class_instances_recurring_schedule_id_idx` | `recurring_schedule_id` | FK (`recurring.ts:59`, `class-instances.ts:59`) |
| `class_instances_user_meeting_config_id_idx` | `user_meeting_config_id` | FK |
| `class_instances_meeting_provider_id_idx` | `meeting_provider_id` | FK |
| `class_instances_activated_by_user_id_idx` | `activated_by_user_id` | FK/audit |
| `class_instances_force_activated_by_user_id_idx` | `force_activated_by_user_id` | FK/audit |
| `class_instances_booking_timezone_id_idx` | `booking_timezone_id` | FK/timezone joins |
| `class_instances_created_at_idx` | `created_at` | Sort/reporting |
| `class_instances_updated_at_idx` | `updated_at` | Sort/reporting |
| `class_instances_actual_start_at_idx` | `actual_start_at` | Range filter |
| `class_instances_actual_end_at_idx` | `actual_end_at` | Range filter |
| `class_instances_activated_at_idx` | `activated_at` | Filter/reporting |
| `class_instances_quota_deducted_idx` | `quota_deducted` | Filter/reporting |
| `class_instances_payroll_credited_idx` | `payroll_credited` | Filter/reporting |
| `class_instances_is_rate_overridden_idx` | `is_rate_overridden` | Filter/reporting |
| `class_instances_rate_source_idx` | `rate_source` | Filter/reporting |
| `class_instances_deleted_at_idx` | `deleted_at` | Soft-delete filter (`scheduling-queries.repository.helpers.ts:99`) |
| `class_instances_teacher_state_start_idx` | `teacher_id, execution_state, scheduled_start_at` | Teacher dashboard (composite) |
| `class_instances_student_state_start_idx` | `student_id, execution_state, scheduled_start_at` | Student dashboard (composite) |
| `class_instances_state_start_idx` | `execution_state, scheduled_start_at` | Activation window scan (composite) |
| `recurring_schedules_deleted_at_idx` | `deleted_at` | Soft-delete filter (`recurring-schedule.repository.ts:49`, `recurring.ts:310`) |
| `recurring_schedules_effective_from_idx` | `effective_from` | Range filter |
| `recurring_schedules_effective_until_idx` | `effective_until` | Range filter |
| `recurring_schedules_created_at_idx` | `created_at` | Sort/reporting |
| `recurring_schedules_updated_at_idx` | `updated_at` | Sort/reporting |
| `recurring_schedules_teacher_id_deleted_at_idx` | `teacher_id, deleted_at` | Teacher schedule lookup (composite) |
| `recurring_schedules_student_id_deleted_at_idx` | `student_id, deleted_at` | Student schedule lookup (composite) |
| `recurring_schedule_days_recurring_schedule_id_idx` | `recurring_schedule_id` | FK (separate from unique composite) |
| `class_status_events_event_type_idx` | `event_type` | Filter/reporting |
| `class_status_events_actor_user_id_idx` | `actor_user_id` | FK/audit queries |
| `leave_requests_requested_by_user_id_idx` | `requested_by_user_id` | FK/audit queries |
| `leave_requests_processed_by_user_id_idx` | `processed_by_user_id` | FK/audit queries |
| `leave_requests_status_idx` | `status` | Filter/reporting |
| `leave_requests_requester_type_idx` | `requester_type` | Filter/reporting |
| `leave_requests_created_at_idx` | `created_at` | Sort/reporting |
| `leave_requests_processed_at_idx` | `processed_at` | Filter/reporting |
| `leave_quota_usage_period_year_period_month_idx` | `period_year, period_month` | Monthly quota lookup (composite) |
| `dst_migration_runs_created_at_idx` | `created_at` | Sort/reporting |
| `dst_migration_entries_recurring_schedule_id_idx` | `recurring_schedule_id` | FK/schedule migration tracking |
| `dst_migration_entries_result_idx` | `result` | Filter/reporting |
| `class_instance_performance_created_at_idx` | `created_at` | Sort/reporting |
| `class_instance_performance_updated_at_idx` | `updated_at` | Sort/reporting |

### 3.14 `backend/db/schema/classes/class-category.ts` (1 index)

| Index Name | Columns | Reason |
|---|---|---|
| `class_categories_deleted_at_idx` | `deleted_at` | Soft-delete filter |

### 3.15 `backend/db/schema/classes/class-subject.ts` (1 index)

| Index Name | Columns | Reason |
|---|---|---|
| `class_subjects_deleted_at_idx` | `deleted_at` | Soft-delete filter |

### 3.16 `backend/db/schema/classes/group-class.ts` (~12 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `group_classes_created_at_idx` | `created_at` | Sort/reporting |
| `group_classes_audit_logged_at_idx` | `audit_logged_at` | Sort/audit timeline |
| `group_classes_class_type_idx` | `class_type` | Filter/reporting |
| `group_classes_original_date_idx` | `original_date` | Filter/reporting |
| `group_classes_rescheduled_date_idx` | `rescheduled_date` | Filter/reporting |
| `group_class_enrollments_attendance_status_idx` | `attendance_status` | Filter/reporting |
| `group_class_enrollments_created_at_idx` | `created_at` | Sort/reporting |
| `class_communications_is_active_idx` | `is_active` | Filter/reporting |
| `class_communications_is_delivered_idx` | `is_delivered` | Filter/reporting |
| `class_communications_notification_delivery_id_idx` | `notification_delivery_id` | FK/delivery tracking |
| `class_communications_class_status_event_id_idx` | `class_status_event_id` | FK/event tracking |
| `class_communications_timestamp_idx` | `timestamp` | Sort/reporting |
| `class_communications_created_at_idx` | `created_at` | Sort/reporting |

### 3.17 `backend/db/schema/classes/lesson-reports.ts` (~9 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `lesson_reports_submitted_by_user_id_idx` | `submitted_by_user_id` | FK/audit queries |
| `lesson_reports_reviewed_by_user_id_idx` | `reviewed_by_user_id` | FK/audit queries |
| `lesson_reports_submitted_at_idx` | `submitted_at` | Sort/reporting |
| `lesson_reports_reviewed_at_idx` | `reviewed_at` | Filter/reporting |
| `lesson_reports_lesson_date_idx` | `lesson_date` | Range filter |
| `lesson_reports_attendance_evaluation_idx` | `attendance_evaluation` | Filter/reporting |
| `lesson_reports_status_submitted_at_idx` | `status, submitted_at` | Review queue (composite) |
| `lesson_reports_teacher_id_status_idx` | `teacher_id, status` | Teacher dashboard (composite) |
| `lesson_reports_student_id_status_idx` | `student_id, status` | Student dashboard (composite) |

### 3.18 `backend/db/schema/billing/billing.ts` (~11 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `invoices_due_date_idx` | `due_date` | Range filter (`billing.repository.ts:567`) |
| `invoices_paid_date_idx` | `paid_date` | Range filter (`billing.repository.ts:879,888`) |
| `invoices_created_by_user_id_idx` | `created_by_user_id` | FK/audit queries |
| `invoices_email_sent_at_idx` | `email_sent_at` | Filter/email queue |
| `payments_payment_date_idx` | `payment_date` | Range filter/reporting |
| `payments_created_at_idx` | `created_at` | Sort/reporting |
| `currency_exchange_rates_effective_date_idx` | `effective_date` | Range filter/rate lookup |
| `currency_exchange_rates_created_at_idx` | `created_at` | Sort/reporting |
| `currency_exchange_audit_logs_created_at_idx` | `created_at` | Sort/audit timeline |
| `currency_exchange_audit_logs_changed_by_user_id_idx` | `changed_by_user_id` | FK/audit queries |
| `currency_hedges_hedge_type_idx` | `hedge_type` | Filter/reporting |
| `currency_hedges_created_at_idx` | `created_at` | Sort/reporting |

### 3.19 `backend/db/schema/billing/credit-transactions.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `credit_transactions_created_at_idx` | `created_at` | Sort/student credit history |
| `credit_transactions_source_payment_id_idx` | `source_payment_id` | FK/payment reconciliation |
| `credit_transactions_credited_by_user_id_idx` | `credited_by_user_id` | FK/audit queries |

### 3.20 `backend/db/schema/billing/fx-sync.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `fx_sync_runs_started_at_idx` | `started_at` | Sort (`fx-sync.repository.ts`) |
| `fx_sync_runs_finished_at_idx` | `finished_at` | Filter/reporting |
| `fx_sync_runs_trigger_type_idx` | `trigger_type` | Filter/reporting |
| `fx_sync_runs_created_at_idx` | `created_at` | Sort/reporting |

### 3.21 `backend/db/schema/billing/invoice-payment-submissions.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `invoice_payment_submissions_submitted_by_user_id_idx` | `submitted_by_user_id` | FK/audit queries |
| `invoice_payment_submissions_reviewed_by_user_id_idx` | `reviewed_by_user_id` | FK/audit queries |
| `invoice_payment_submissions_submitted_at_idx` | `submitted_at` | Sort/reporting |
| `invoice_payment_submissions_reviewed_at_idx` | `reviewed_at` | Filter/reporting |

### 3.22 `backend/db/schema/billing/user-payment-methods.ts` (~8 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `user_payment_methods_verified_at_idx` | `verified_at` | Filter/reporting |
| `user_payment_methods_verified_by_user_id_idx` | `verified_by_user_id` | FK/audit queries |
| `user_payment_methods_created_at_idx` | `created_at` | Sort/reporting |
| `user_payment_methods_direction_idx` | `direction` | Filter (`user-payment-method.repository.ts`) |
| `user_payment_methods_is_default_idx` | `is_default` | Filter (`user-payment-method.repository.ts:114,141,156`) |
| `user_payment_methods_user_id_is_default_idx` | `user_id, is_default` | Default lookup (composite) |
| `user_payment_methods_user_id_direction_idx` | `user_id, direction` | Direction filter (composite) |

### 3.23 `backend/db/schema/billing/currencies.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `supported_currencies_country_code_idx` | `country_code` | Filter/reporting |
| `supported_currencies_sort_order_idx` | `sort_order` | Sort/listing |
| `supported_currencies_created_at_idx` | `created_at` | Sort/reporting |

### 3.24 `backend/db/schema/billing/supported-mobile-wallets.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `supported_mobile_wallets_currency_code_idx` | `currency_code` | Filter/reporting |
| `supported_mobile_wallets_phone_region_idx` | `phone_region` | Filter/reporting |
| `supported_mobile_wallets_supported_directions_idx` | `supported_directions` | Filter/reporting |
| `supported_mobile_wallets_created_at_idx` | `created_at` | Sort/reporting |

### 3.25 `backend/db/schema/billing/supported-online-accounts.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `supported_online_accounts_identifier_kind_idx` | `identifier_kind` | Filter/reporting |
| `supported_online_accounts_supported_directions_idx` | `supported_directions` | Filter/reporting |
| `supported_online_accounts_is_active_idx` | `is_active` | Filter/reporting |
| `supported_online_accounts_created_at_idx` | `created_at` | Sort/reporting |

### 3.26 `backend/db/schema/billing/supported-payment-links.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `supported_payment_links_is_active_idx` | `is_active` | Filter/reporting |
| `supported_payment_links_supported_directions_idx` | `supported_directions` | Filter/reporting |
| `supported_payment_links_created_at_idx` | `created_at` | Sort/reporting |

### 3.27 `backend/db/schema/communications/communications.ts` (~25 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `notification_deliveries_device_token_id_idx` | `device_token_id` | FK/delivery tracking |
| `notification_deliveries_sent_at_idx` | `sent_at` | Filter/delivery reporting |
| `notification_deliveries_delivered_at_idx` | `delivered_at` | Filter/delivery reporting |
| `notification_deliveries_failed_at_idx` | `failed_at` | Filter/failure reporting |
| `notification_deliveries_opened_at_idx` | `opened_at` | Filter/engagement reporting |
| `notification_deliveries_user_id_status_created_at_idx` | `user_id, status, created_at` | User notification feed (composite) |
| `notification_deliveries_status_created_at_idx` | `status, created_at` | Delivery queue scan (composite) |
| `user_device_tokens_is_active_idx` | `is_active` | Filter (`notification.repository.ts:193`) |
| `user_device_tokens_last_used_at_idx` | `last_used_at` | Filter/token cleanup |
| `user_device_tokens_user_id_is_active_idx` | `user_id, is_active` | Active token lookup (composite) |
| `user_notification_preferences_channel_idx` | `channel` | Filter/preference lookup |
| `user_notification_preferences_event_type_idx` | `event_type` | Filter/preference lookup |
| `user_notification_preferences_enabled_idx` | `enabled` | Filter/preference lookup |
| `complaints_student_id_idx` | `student_id` | FK/student complaint history |
| `complaints_category_idx` | `category` | Filter/reporting |
| `complaints_created_at_idx` | `created_at` | Sort/reporting |
| `complaints_updated_at_idx` | `updated_at` | Sort/reporting |
| `complaint_responses_responder_user_id_idx` | `responder_user_id` | FK/audit queries |
| `complaint_responses_created_at_idx` | `created_at` | Sort/response timeline |
| `complaint_responses_email_sent_idx` | `email_sent` | Filter/email queue |
| `suggestions_created_at_idx` | `created_at` | Sort/reporting |
| `suggestions_reviewed_at_idx` | `reviewed_at` | Filter/reporting |
| `suggestions_email_sent_at_idx` | `email_sent_at` | Filter/email queue |
| `learning_resources_uploaded_by_user_id_idx` | `uploaded_by_user_id` | FK/audit queries |
| `learning_resources_created_at_idx` | `created_at` | Sort/reporting |
| `learning_resources_display_name_idx` | `display_name` | Search |

### 3.28 `backend/db/schema/meeting/user-meeting-configs.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `user_meeting_configs_is_default_idx` | `is_default` | Filter (`user-meeting-config.repository.ts:55,64`) |
| `user_meeting_configs_user_id_is_default_idx` | `user_id, is_default` | Default lookup (composite) |

### 3.29 `backend/db/schema/meeting/class-meeting-configs.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `class_meeting_configs_is_default_idx` | `is_default` | Filter (`class-meeting-config.repository.ts:67,90`) |
| `class_meeting_configs_provider_id_idx` | `provider_id` | FK/provider joins |

### 3.30 `backend/db/schema/meeting/meeting-providers.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `meeting_providers_created_at_idx` | `created_at` | Sort/reporting |
| `meeting_providers_updated_at_idx` | `updated_at` | Sort/reporting |

### 3.31 `backend/db/schema/storage/storage.ts` (~6 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `signed_url_created_at_idx` | `created_at` | Sort/reporting |
| `signed_url_file_path_idx` | `file_path` | Filter/file lookup |
| `signed_url_content_hash_idx` | `content_hash` | Filter/dedup |
| `storage_files_is_protected_idx` | `is_protected` | Filter/reporting |
| `storage_directories_is_protected_idx` | `is_protected` | Filter/reporting |
| `storage_directories_allow_uploads_idx` | `allow_uploads` | Filter/reporting |

### 3.32 `backend/db/schema/storage/site-content.ts` (4 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `site_content_updated_by_user_id_idx` | `updated_by_user_id` | FK/audit queries |
| `site_content_created_at_idx` | `created_at` | Sort/reporting |
| `site_content_updated_at_idx` | `updated_at` | Sort/reporting |
| `site_content_is_published_content_type_idx` | `is_published, content_type` | Public content listing (composite) |

### 3.33 `backend/db/schema/books/books.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `books_availability_status_idx` | `availability_status` | Filter/reporting |
| `books_created_at_idx` | `created_at` | Sort/reporting |
| `books_name_idx` | `name` | Search |

### 3.34 `backend/db/schema/shared/settings.ts` (3 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `system_settings_updated_by_user_id_idx` | `updated_by_user_id` | FK/audit queries |
| `system_settings_updated_at_idx` | `updated_at` | Sort/reporting |
| `system_settings_data_type_idx` | `data_type` | Filter/reporting |

### 3.35 `backend/db/schema/shared/cache.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `rate_limit_cache_value_idx` | `value` | Filter/rate limit lookup |
| `session_cache_value_idx` | `value` | Filter/session lookup |

### 3.36 `backend/db/schema/shared/timezones.ts` (2 indexes)

| Index Name | Columns | Reason |
|---|---|---|
| `timezones_is_dst_supported_idx` | `is_dst_supported` | Filter/DST queries |
| `timezones_base_offset_minutes_idx` | `base_offset_minutes` | Filter/offset queries |

---

## 4. Execution Steps

### Step 1: Edit Schema Files (36 files)

Add missing indexes inside each `pgTable` callback's second argument. All edits follow the existing pattern:

```typescript
index("table_column_idx").on(table.column)
```

**Composite indexes** use:
```typescript
index("table_col1_col2_idx").on(table.col1, table.col2)
```

### Step 2: Generate Migration

```bash
bun db generate
```

This runs `drizzle-kit generate --ignore-conflicts` (per `scripts/dbActions/actions.ts:55`), producing a new folder under `backend/drizzle/<timestamp>_*/migration.sql` with all `CREATE INDEX` statements.

### Step 3: Apply Migration to Local Database

```bash
bun db migrate
```

This runs `backend/db/scripts/migrate.ts` which auto-bundles custom migrations, ensures idempotency (`IF NOT EXISTS` wrapping), and applies all pending migrations from `backend/drizzle/` to the local database. Per repo policy, `db reset` and `db cleanGenerate` are disabled.

### Step 4: Per-File Quality Verification

For each of the 36 edited schema files, run:
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"4.1-verify","files":["<file-path>"]}'
```

### Step 5: Global Quality Gate

```bash
bun tsgo          # 0 errors
bun biome:check   # 0 errors
bun run lint      # 0 errors, 0 warnings
```

### Step 6: Write Outcome File

Create `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md` with:
- Audit methodology (cross-referenced repo `where(eq(...))` calls against schema indexes)
- Complete list of indexes added per table
- Migration generation/apply steps
- Quality verification results
- Carry-over knowledge for Task 5

### Step 7: Update Progress

Mark task 4.1 as `[x]` in `.ai/plans/neon/tasks.md`.

---

## 5. Index Naming Convention

All indexes follow the existing project convention: `{table_name}_{column_name(s)}_idx`

- Single column: `{table}_{col}_idx`
- Composite: `{table}_{col1}_{col2}_idx`

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Large migration may take time to apply | Run during low-traffic window; standard `CREATE INDEX` locks table briefly |
| Index bloat on small tables | Skip indexes on tables with <1000 expected rows (none identified — all tables are production-scale) |
| Duplicate index names | Drizzle will error on duplicate names; verify uniqueness before generating |
| Schema drift between local DB and migration | Run `bun db migrate` immediately after generating migration |
| Migration may produce `CREATE INDEX` without `IF NOT EXISTS` | `bun db migrate` runs `ensureIdempotentMigrations` which auto-wraps all statements with `IF NOT EXISTS` before applying |
| Query planner may not use new indexes | Standard B-tree indexes on filtered columns are reliably used by PostgreSQL |

---

## 7. Non-Negotiable Execution Protocol

1. **Pre-Execution Outcome Knowledge Read:** Read ALL existing files in `.ai/plans/neon/outcome/` before executing.
2. **Per-File Quality Verification Loop:** After each file edit, run `bun tsgo` + `bun biome:check` + lint queue for the target file.
3. **Global Health Check:** Before marking complete, run `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with zero errors and zero warnings.
4. **Post-Execution Outcome File:** Write outcome document under `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md`.
5. **Task Progress Tracking:** Update task checkbox `[ ]` -> `[x]` in `tasks.md` upon completion.

---

## 8. Changes from Source Plans

| Change | Source | Reason |
|---|---|---|
| Removed partial indexes (`WHERE deleted_at IS NULL`) | Plan 2 | Standard B-tree indexes are simpler, serve both `IS NULL` and `IS NOT NULL` queries, and avoid query planner confusion |
| Added `class-category.ts` (1 index) | Plan 2 | Plan 1 missed this file; `deletedAt` column exists without index |
| Added `class-subject.ts` (1 index) | Plan 2 | Plan 1 missed this file; `deletedAt` column exists without index |
| Removed duplicate `teacher_important_notes` indexes from section 3.6 | Audit | These indexes belong only in `teacher-notes.ts` (section 3.8), not `teacher-availability.ts` |
| Reduced `teacher-availability.ts` from 7 to 4 indexes | Audit | Removed 3 duplicate `teacher_important_notes` entries |
| Use `bun db generate` + `bun db migrate` instead of raw `drizzle-kit generate` + `bun run db push` | Project convention | `bun db generate` already includes `--ignore-conflicts`; `bun db migrate` auto-bundles custom migrations, ensures idempotency, and applies via proper migration runner |
| Total files: 34 → 36 | Combined | Added `class-category.ts` and `class-subject.ts` from Plan 2 |