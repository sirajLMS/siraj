import { loadSeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services";

type TableCategory = "seeded" | "migration" | "excluded";

interface TableCoverageEntry {
  table: string;
  category: TableCategory;
  seeder?: string;
}

const TABLE_COVERAGE: readonly TableCoverageEntry[] = [
  { table: "timezones", category: "seeded", seeder: "timezones.ts" },
  { table: "system_settings", category: "seeded", seeder: "system-settings.ts" },
  { table: "users", category: "seeded", seeder: "seed-users.ts" },
  { table: "user_permission_groups", category: "seeded", seeder: "seed-users.ts" },
  { table: "staff_profiles", category: "seeded", seeder: "seed-users.ts" },
  { table: "teachers", category: "seeded", seeder: "seed-teachers.ts" },
  { table: "parents", category: "seeded", seeder: "seed-parents.ts" },
  { table: "students", category: "seeded", seeder: "seed-students.ts" },
  { table: "teacher_assignments", category: "seeded", seeder: "seed-students.ts" },
  { table: "books", category: "seeded", seeder: "seed-books.ts" },
  { table: "class_categories", category: "seeded", seeder: "seed-class-categories.ts" },
  { table: "class_subjects", category: "seeded", seeder: "seed-class-subjects.ts" },
  { table: "subject_resources", category: "seeded", seeder: "seed-subject-resources.ts" },
  { table: "recurring_schedules", category: "seeded", seeder: "seed-classes.ts" },
  { table: "recurring_schedule_days", category: "seeded", seeder: "seed-recurring-schedule-days.ts" },
  { table: "class_instances", category: "seeded", seeder: "seed-class-instances.ts" },
  { table: "class_instance_performance", category: "seeded", seeder: "seed-class-performance.ts" },
  { table: "class_status_events", category: "seeded", seeder: "seed-class-status-events.ts" },
  { table: "group_classes", category: "seeded", seeder: "seed-group-classes.ts" },
  { table: "group_class_enrollments", category: "seeded", seeder: "seed-group-class-enrollments.ts" },
  { table: "class_communications", category: "seeded", seeder: "seed-class-communications.ts" },
  { table: "class_meeting_configs", category: "seeded", seeder: "seed-class-meeting-configs.ts" },
  { table: "user_meeting_configs", category: "seeded", seeder: "seed-user-meeting-configs.ts" },
  { table: "meeting_providers", category: "seeded", seeder: "seed-meeting-providers.ts" },
  { table: "teacher_availability_windows", category: "seeded", seeder: "seed-teacher-availability-windows.ts" },
  { table: "teacher_recurring_unavailability", category: "seeded", seeder: "seed-teacher-recurring-unavailability.ts" },
  { table: "teacher_vacation_requests", category: "seeded", seeder: "seed-teacher-vacation-requests.ts" },
  { table: "teacher_important_notes", category: "seeded", seeder: "seed-teacher-important-notes.ts" },
  { table: "leave_requests", category: "seeded", seeder: "seed-leave-requests.ts" },
  { table: "leave_quota_usage", category: "seeded", seeder: "seed-leave-quota-usage.ts" },
  { table: "student_progress", category: "seeded", seeder: "seed-student-progress.ts" },
  { table: "student_status_history", category: "seeded", seeder: "seed-student-status-history.ts" },
  { table: "dst_migration_runs", category: "seeded", seeder: "seed-dst-migration-runs.ts" },
  { table: "dst_migration_entries", category: "seeded", seeder: "seed-dst-migration-entries.ts" },
  { table: "teacher_payments", category: "seeded", seeder: "seed-teacher-payments.ts" },
  { table: "credit_transactions", category: "seeded", seeder: "seed-credit-transactions.ts" },
  { table: "lesson_reports", category: "seeded", seeder: "seed-lesson-reports.ts" },
  { table: "teacher_dues", category: "seeded", seeder: "seed-teacher-dues.ts" },
  { table: "currency_exchange_rates", category: "seeded", seeder: "seed-currency-exchange-rates.ts" },
  { table: "supported_mobile_wallets", category: "seeded", seeder: "seed-supported-mobile-wallets.ts" },
  { table: "supported_payment_links", category: "seeded", seeder: "seed-supported-payment-links.ts" },
  { table: "supported_online_accounts", category: "seeded", seeder: "seed-supported-online-accounts.ts" },
  { table: "currency_exchange_audit_logs", category: "seeded", seeder: "seed-currency-exchange-audit-logs.ts" },
  { table: "currency_hedges", category: "seeded", seeder: "seed-currency-hedges.ts" },
  { table: "invoices", category: "seeded", seeder: "seed-invoices.ts" },
  { table: "invoice_coverage_months", category: "seeded", seeder: "seed-invoice-coverage-months.ts" },
  { table: "invoice_payment_submissions", category: "seeded", seeder: "seed-invoice-payment-submissions.ts" },
  { table: "payments", category: "seeded", seeder: "seed-payments.ts" },
  { table: "user_payment_methods", category: "seeded", seeder: "seed-user-payment-methods.ts" },
  { table: "user_notification_preferences", category: "seeded", seeder: "seed-user-notification-preferences.ts" },
  { table: "user_device_tokens", category: "seeded", seeder: "seed-user-device-tokens.ts" },
  { table: "notification_deliveries", category: "seeded", seeder: "seed-notification-deliveries.ts" },
  { table: "complaints", category: "seeded", seeder: "seed-complaints.ts" },
  { table: "complaint_responses", category: "seeded", seeder: "seed-complaint-responses.ts" },
  { table: "suggestions", category: "seeded", seeder: "seed-suggestions.ts" },
  { table: "learning_resources", category: "seeded", seeder: "seed-learning-resources.ts" },
  { table: "admin_audit_logs", category: "seeded", seeder: "seed-admin-audit-logs.ts" },
  { table: "audit_logs", category: "seeded", seeder: "seed-audit-logs.ts" },
  { table: "site_content", category: "seeded", seeder: "seed-site-content.ts" },
  { table: "user_permission_overrides", category: "seeded", seeder: "seed-user-permission-overrides.ts" },
  { table: "storage_file", category: "seeded", seeder: "file-seed-helper.ts" },
  { table: "storage_directory", category: "seeded", seeder: "system-settings.ts" },
  { table: "student_files", category: "seeded", seeder: "seed-students.ts" },
  { table: "teacher_files", category: "seeded", seeder: "seed-teachers.ts" },
  { table: "parent_files", category: "seeded", seeder: "seed-parents.ts" },
  { table: "invoice_files", category: "seeded", seeder: "seed-invoices.ts" },
  { table: "complaint_files", category: "seeded", seeder: "seed-complaints.ts" },
  { table: "learning_resource_files", category: "seeded", seeder: "seed-learning-resources.ts" },
  { table: "staff_profile_files", category: "seeded", seeder: "seed-users.ts" },
  { table: "user_files", category: "seeded", seeder: "seed-users.ts" },
  { table: "recurring_schedule_files", category: "seeded", seeder: "seed-classes.ts" },
  { table: "class_instance_files", category: "seeded", seeder: "seed-class-instances.ts" },
  { table: "permissions", category: "migration" },
  { table: "permission_groups", category: "migration" },
  { table: "group_permissions", category: "migration" },
  { table: "sessions", category: "excluded" },
  { table: "session_metadata", category: "excluded" },
  { table: "session_config", category: "excluded" },
  { table: "password_reset_tokens", category: "excluded" },
  { table: "auth_rate_limits", category: "excluded" },
  { table: "rate_limit_cache", category: "excluded" },
  { table: "session_cache", category: "excluded" },
  { table: "signed_url", category: "excluded" },
  { table: "fx_sync_runs", category: "excluded" },
  { table: "impersonation_sessions", category: "excluded" },
] as const;

const STANDARD_PROFILE_TABLES = TABLE_COVERAGE.filter(entry => entry.category === "seeded").map(entry => entry.table);

export async function verifySeedCoverage(failedSteps: readonly string[] = []): Promise<void> {
  const config = loadSeedConfig();
  if (config.profile !== "standard") {
    logger.log("Skipping seed coverage verification (SEED_PROFILE is not standard).");
    return;
  }

  const counts = await ReferenceDataService.getTableRowCounts(STANDARD_PROFILE_TABLES);
  const failures: string[] = [];

  for (const tableName of STANDARD_PROFILE_TABLES) {
    const rowCount = counts[tableName] ?? 0;
    if (rowCount === 0) {
      failures.push(tableName);
    }
  }

  if (failedSteps.length > 0) {
    logger.error(`Seed steps that failed earlier: ${failedSteps.join(", ")}`);
  }

  if (failures.length > 0) {
    throw new Error(`Seed coverage verification failed — empty tables: ${failures.join(", ")}`);
  }

  logger.log(`Seed coverage verification passed (${STANDARD_PROFILE_TABLES.length} tables).`);
}
