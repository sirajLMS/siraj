import { db } from "@/backend/db/drizzleDb";
import { permissionGroups as permissionGroupsSchema } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";
import type {
  ClassInstanceEntity,
  InvoiceSelectType,
  ParentEntity,
  PermissionGroupEntity,
  RecurringScheduleDayEntity,
  RecurringScheduleEntity,
  StudentEntity,
  SystemSettingSelectType,
  TeacherBankingDetailsHistorySelectType,
  TeacherEntity,
  TimezoneEntity,
  UserEntity,
} from "@/backend/types";
import { loadSeedConfig, type SeedConfig } from "./lib";
import { seedOrGet as seedOrGetAdminAuditLogs } from "./seed-admin-audit-logs";
import { seedOrGet as seedOrGetAuditLogs } from "./seed-audit-logs";
import { seedOrGet as seedOrGetClassInstances } from "./seed-class-instances";
import { seedOrGet as seedOrGetClassPerformance } from "./seed-class-performance";
import { seedOrGet as seedOrGetClassStatusEvents } from "./seed-class-status-events";
import { seedOrGet as seedOrGetClasses } from "./seed-classes";
import { seedOrGet as seedOrGetComplaintResponses } from "./seed-complaint-responses";
import { seedOrGet as seedOrGetComplaints } from "./seed-complaints";
import { seedOrGet as seedOrGetCurrencyExchangeAuditLogs } from "./seed-currency-exchange-audit-logs";
import { seedOrGet as seedOrGetCurrencyExchangeRates } from "./seed-currency-exchange-rates";
import { seedOrGet as seedOrGetCurrencyHedges } from "./seed-currency-hedges";
import { seedOrGet as seedOrGetDstMigrationEntries } from "./seed-dst-migration-entries";
import { seedOrGet as seedOrGetDstMigrationRuns } from "./seed-dst-migration-runs";
import { seedOrGet as seedOrGetInvoiceCoverageMonths } from "./seed-invoice-coverage-months";
import { seedOrGet as seedOrGetInvoices } from "./seed-invoices";
import { seedOrGet as seedOrGetLearningResources } from "./seed-learning-resources";
import { seedOrGet as seedOrGetLeaveQuotaUsage } from "./seed-leave-quota-usage";
import { seedOrGet as seedOrGetLeaveRequests } from "./seed-leave-requests";
import { seedOrGet as seedOrGetNotificationDeliveries } from "./seed-notification-deliveries";
import { seedOrGet as seedOrGetParents } from "./seed-parents";
import { seedOrGet as seedOrGetPayments } from "./seed-payments";
import { seedOrGet as seedOrGetRecurringScheduleDays } from "./seed-recurring-schedule-days";
import { seedOrGet as seedOrGetSiteContent } from "./seed-site-content";
import { seedOrGet as seedOrGetStudentProgress } from "./seed-student-progress";
import { seedOrGet as seedOrGetStudentStatusHistory } from "./seed-student-status-history";
import { seedOrGet as seedOrGetStudents } from "./seed-students";
import { seedOrGet as seedOrGetSuggestions } from "./seed-suggestions";
import { seedOrGet as seedOrGetTeacherAvailabilityWindows } from "./seed-teacher-availability-windows";
import { seedOrGet as seedOrGetTeacherBankingDetails } from "./seed-teacher-banking-details-history";
import { seedOrGet as seedOrGetTeacherPayments } from "./seed-teacher-payments";
import { seedOrGet as seedOrGetTeacherRecurringUnavailability } from "./seed-teacher-recurring-unavailability";
import { seedOrGet as seedOrGetTeacherVacationRequests } from "./seed-teacher-vacation-requests";
import { seedOrGet as seedOrGetTeachers } from "./seed-teachers";
import { seedOrGet as seedOrGetUserDeviceTokens } from "./seed-user-device-tokens";
import { seedOrGet as seedOrGetUserNotificationPreferences } from "./seed-user-notification-preferences";
import { seedOrGet as seedOrGetUserPermissionOverrides } from "./seed-user-permission-overrides";
import { seedOrGet as seedOrGetUsers } from "./seed-users";
import { seedOrGet as seedOrGetSystemSettings } from "./system-settings";
import { seedOrGet as seedOrGetTimezones } from "./timezones";
import { verifySeedCoverage } from "./verify-coverage";

export type SeedContext = {
  config?: SeedConfig;
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: PermissionGroupEntity[];
  users?: UserEntity[];
  teachers?: TeacherEntity[];
  parents?: ParentEntity[];
  students?: StudentEntity[];
  classes?: RecurringScheduleEntity[];
  recurringScheduleDays?: RecurringScheduleDayEntity[];
  classInstances?: ClassInstanceEntity[];
  exchangeRates?: Awaited<ReturnType<typeof seedOrGetCurrencyExchangeRates>>;
  invoices?: InvoiceSelectType[];
  bankingDetails?: TeacherBankingDetailsHistorySelectType[];
};

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");

  if (!context.config) {
    context.config = loadSeedConfig();
    logger.log(`Seed profile: ${context.config.profile} (anchor: ${context.config.anchorDate.toISOString()})`);
  }

  const config = context.config;

  if (!context.systemSettings) {
    logger.log("Seeding system settings...");
    context.systemSettings = await seedOrGetSystemSettings();
  }

  if (!context.timezones) {
    logger.log("Seeding common timezones...");
    context.timezones = await seedOrGetTimezones();
  }

  if (!context.permissionGroups) {
    logger.log("Fetching system permission groups...");
    context.permissionGroups = await db.select().from(permissionGroupsSchema);
  }

  if (!context.users) {
    logger.log("Seeding system users...");
    context.users = await seedOrGetUsers(context.permissionGroups, config);
  }

  if (!context.teachers) {
    logger.log("Seeding system teachers...");
    context.teachers = await seedOrGetTeachers(context.users, context.timezones, config);
  }

  if (!context.parents) {
    logger.log("Seeding system parents...");
    context.parents = await seedOrGetParents(context.users, config);
  }

  if (!context.students) {
    logger.log("Seeding system students...");
    context.students = await seedOrGetStudents(context.parents, context.teachers, config);
  }

  if (!context.classes) {
    logger.log("Seeding system classes...");
    context.classes = await seedOrGetClasses(context.teachers, context.students, config);
  }

  if (!context.recurringScheduleDays) {
    logger.log("Seeding recurring schedule days...");
    context.recurringScheduleDays = await seedOrGetRecurringScheduleDays(context.classes, config);
  }

  if (!context.classInstances) {
    logger.log("Seeding system class instances...");
    context.classInstances = await seedOrGetClassInstances(
      context.classes,
      context.teachers,
      context.students,
      config
    );
  }

  logger.log("Seeding class performance and status events...");
  await seedOrGetClassPerformance(context.classInstances, config);
  await seedOrGetClassStatusEvents(context.classInstances, context.teachers, config);

  logger.log("Seeding scheduling extensions...");
  await seedOrGetTeacherAvailabilityWindows(context.teachers, context.timezones, config);
  await seedOrGetTeacherRecurringUnavailability(context.teachers, context.timezones, config);
  await seedOrGetTeacherVacationRequests(context.teachers, context.users, context.timezones, config);

  const leaveRequests = await seedOrGetLeaveRequests(
    context.classInstances,
    context.teachers,
    context.users,
    config
  );
  await seedOrGetLeaveQuotaUsage(leaveRequests, context.students, config);
  await seedOrGetStudentProgress(context.classInstances, config);
  await seedOrGetStudentStatusHistory(context.students, context.users, config);

  const dstRuns = await seedOrGetDstMigrationRuns(context.users, config);
  await seedOrGetDstMigrationEntries(dstRuns, context.classes);

  context.bankingDetails = await seedOrGetTeacherBankingDetails(context.teachers, context.users, config);
  await seedOrGetTeacherPayments(context.bankingDetails, config);

  if (config.enableBilling) {
    logger.log("Seeding billing domain...");
    context.exchangeRates = await seedOrGetCurrencyExchangeRates(config);
    await seedOrGetCurrencyExchangeAuditLogs(context.exchangeRates, context.users, config);
    await seedOrGetCurrencyHedges(config);
    context.invoices = await seedOrGetInvoices(context.parents, context.students, context.users, config);
    await seedOrGetInvoiceCoverageMonths(context.invoices, config);
    await seedOrGetPayments(context.invoices, config);
  }

  if (config.enableCommunications) {
    logger.log("Seeding communications domain...");
    await seedOrGetUserNotificationPreferences(context.users, config);
    const deviceTokens = await seedOrGetUserDeviceTokens(context.users, config);
    await seedOrGetNotificationDeliveries(context.users, deviceTokens, config);
    const complaints = await seedOrGetComplaints(context.parents, context.students, context.users, config);
    await seedOrGetComplaintResponses(complaints, context.users, config);
    await seedOrGetSuggestions(context.parents, context.users, config);
    await seedOrGetLearningResources(context.users, config);
    await seedOrGetSiteContent(context.users, config);
  }

  if (config.enableAuditLogs) {
    logger.log("Seeding audit domain...");
    await seedOrGetAdminAuditLogs(context.users, config);
    await seedOrGetAuditLogs(context.users, context.invoices ?? [], config);
    await seedOrGetUserPermissionOverrides(context.users, config);
  }

  logger.log("Verifying seed coverage...");
  await verifySeedCoverage();

  logger.log("Master seed process completed.");
  return context;
}
