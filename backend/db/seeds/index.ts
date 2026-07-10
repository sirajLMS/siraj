import { db } from "@/backend/db/drizzleDb";
import { permissionGroups as permissionGroupsSchema } from "@/backend/db/schema";
import { seedOrGet as seedOrGetAdminAuditLogs } from "@/backend/db/seeds/audit/seed-admin-audit-logs";
import { seedOrGet as seedOrGetAuditLogs } from "@/backend/db/seeds/audit/seed-audit-logs";
import { seedOrGet as seedOrGetPaymentMethodPermissions } from "@/backend/db/seeds/auth/seed-payment-method-permissions";
import { seedOrGet as seedOrGetUserPermissionOverrides } from "@/backend/db/seeds/auth/seed-user-permission-overrides";
import { seedOrGet as seedOrGetCurrencyExchangeAuditLogs } from "@/backend/db/seeds/billing/seed-currency-exchange-audit-logs";
import { seedOrGet as seedOrGetCurrencyExchangeRates } from "@/backend/db/seeds/billing/seed-currency-exchange-rates";
import { seedOrGet as seedOrGetCurrencyHedges } from "@/backend/db/seeds/billing/seed-currency-hedges";
import { seedOrGet as seedOrGetInvoiceCoverageMonths } from "@/backend/db/seeds/billing/seed-invoice-coverage-months";
import { seedOrGet as seedOrGetInvoices } from "@/backend/db/seeds/billing/seed-invoices";
import { seedOrGet as seedOrGetPayments } from "@/backend/db/seeds/billing/seed-payments";
import { seedOrGet as seedOrGetSupportedMobileWallets } from "@/backend/db/seeds/billing/seed-supported-mobile-wallets";
import { seedOrGet as seedOrGetSupportedOnlineAccounts } from "@/backend/db/seeds/billing/seed-supported-online-accounts";
import { seedOrGet as seedOrGetSupportedPaymentLinks } from "@/backend/db/seeds/billing/seed-supported-payment-links";
import { seedOrGet as seedOrGetUserPaymentMethods } from "@/backend/db/seeds/billing/seed-user-payment-methods";
import { seedOrGet as seedOrGetMeetingProviders } from "@/backend/db/seeds/meeting/seed-meeting-providers";
import { seedOrGet as seedOrGetClassCommunications } from "@/backend/db/seeds/classes/seed-class-communications";
import { seedOrGet as seedOrGetClassInstances } from "@/backend/db/seeds/classes/seed-class-instances";
import { seedOrGet as seedOrGetClassPerformance } from "@/backend/db/seeds/classes/seed-class-performance";
import { seedOrGet as seedOrGetClassStatusEvents } from "@/backend/db/seeds/classes/seed-class-status-events";
import { seedOrGet as seedOrGetClasses } from "@/backend/db/seeds/classes/seed-classes";
import { seedOrGet as seedOrGetDstMigrationEntries } from "@/backend/db/seeds/classes/seed-dst-migration-entries";
import { seedOrGet as seedOrGetDstMigrationRuns } from "@/backend/db/seeds/classes/seed-dst-migration-runs";
import { seedOrGet as seedOrGetGroupClassEnrollments } from "@/backend/db/seeds/classes/seed-group-class-enrollments";
import { seedOrGet as seedOrGetGroupClasses } from "@/backend/db/seeds/classes/seed-group-classes";
import { seedOrGet as seedOrGetRecurringScheduleDays } from "@/backend/db/seeds/classes/seed-recurring-schedule-days";
import { seedOrGet as seedOrGetComplaintResponses } from "@/backend/db/seeds/complaints/seed-complaint-responses";
import { seedOrGet as seedOrGetComplaints } from "@/backend/db/seeds/complaints/seed-complaints";
import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { seedOrGet as seedOrGetNotificationDeliveries } from "@/backend/db/seeds/notifications/seed-notification-deliveries";
import { seedOrGet as seedOrGetUserNotificationPreferences } from "@/backend/db/seeds/notifications/seed-user-notification-preferences";
import { seedOrGet as seedOrGetParents } from "@/backend/db/seeds/parents/seed-parents";
import { seedOrGet as seedOrGetSuggestions } from "@/backend/db/seeds/parents/seed-suggestions";
import { seedOrGet as seedOrGetSystemSettings } from "@/backend/db/seeds/shared/system-settings";
import { seedOrGet as seedOrGetTimezones } from "@/backend/db/seeds/shared/timezones";
import { verifySeedCoverage } from "@/backend/db/seeds/shared/verify-coverage";
import { seedOrGet as seedOrGetLearningResources } from "@/backend/db/seeds/storage/seed-learning-resources";
import { seedOrGet as seedOrGetSiteContent } from "@/backend/db/seeds/storage/seed-site-content";
import { seedOrGet as seedOrGetStudentProgress } from "@/backend/db/seeds/students/seed-student-progress";
import { seedOrGet as seedOrGetStudentStatusHistory } from "@/backend/db/seeds/students/seed-student-status-history";
import { seedOrGet as seedOrGetStudents } from "@/backend/db/seeds/students/seed-students";
import { seedOrGet as seedOrGetLeaveQuotaUsage } from "@/backend/db/seeds/teachers/seed-leave-quota-usage";
import { seedOrGet as seedOrGetLeaveRequests } from "@/backend/db/seeds/teachers/seed-leave-requests";
import { seedOrGet as seedOrGetTeacherAvailabilityWindows } from "@/backend/db/seeds/teachers/seed-teacher-availability-windows";
import { seedOrGet as seedOrGetTeacherPayments } from "@/backend/db/seeds/teachers/seed-teacher-payments";
import { seedOrGet as seedOrGetTeacherRecurringUnavailability } from "@/backend/db/seeds/teachers/seed-teacher-recurring-unavailability";
import { seedOrGet as seedOrGetTeacherVacationRequests } from "@/backend/db/seeds/teachers/seed-teacher-vacation-requests";
import { seedOrGet as seedOrGetTeachers } from "@/backend/db/seeds/teachers/seed-teachers";
import { seedOrGet as seedOrGetUserDeviceTokens } from "@/backend/db/seeds/users/seed-user-device-tokens";
import { seedOrGet as seedOrGetUsers } from "@/backend/db/seeds/users/seed-users";
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
  TeacherEntity,
  TimezoneEntity,
  UserSelectType,
} from "@/backend/types";

export type SeedContext = {
  config?: SeedConfig;
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: PermissionGroupEntity[];
  users?: UserSelectType[];
  teachers?: TeacherEntity[];
  parents?: ParentEntity[];
  students?: StudentEntity[];
  classes?: RecurringScheduleEntity[];
  recurringScheduleDays?: RecurringScheduleDayEntity[];
  classInstances?: ClassInstanceEntity[];
  exchangeRates?: Awaited<ReturnType<typeof seedOrGetCurrencyExchangeRates>>;
  invoices?: InvoiceSelectType[];
  groupClasses?: { id: string; classInstanceId: string; courseName: string }[];
  groupClassEnrollments?: { id: string }[];
  classCommunications?: { id: string }[];
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

  logger.log("Seeding payment method permissions...");
  await seedOrGetPaymentMethodPermissions();

  logger.log("Seeding payment method catalogs...");
  await seedOrGetSupportedMobileWallets();
  await seedOrGetSupportedPaymentLinks();
  await seedOrGetSupportedOnlineAccounts();

  logger.log("Seeding meeting providers...");
  await seedOrGetMeetingProviders();

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

  logger.log("Seeding demo user payment methods...");
  await seedOrGetUserPaymentMethods(context.users ?? [], config);

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
    context.classInstances = await seedOrGetClassInstances(context.classes, context.teachers, context.students, config);
  }

  logger.log("Seeding class performance and status events...");
  await seedOrGetClassPerformance(context.classInstances, config);
  await seedOrGetClassStatusEvents(context.classInstances, context.teachers, config);

  logger.log("Seeding group classes domain...");
  context.groupClasses = await seedOrGetGroupClasses(context.classInstances, context.students ?? [], config);
  context.groupClassEnrollments = await seedOrGetGroupClassEnrollments(
    context.groupClasses,
    context.students ?? [],
    config
  );
  context.classCommunications = await seedOrGetClassCommunications(context.groupClasses, config);

  logger.log("Seeding scheduling extensions...");
  await seedOrGetTeacherAvailabilityWindows(context.teachers, context.users, context.timezones, config);
  await seedOrGetTeacherRecurringUnavailability(context.teachers, context.users, context.timezones, config);
  await seedOrGetTeacherVacationRequests(context.teachers, context.users, context.timezones, config);

  const leaveRequests = await seedOrGetLeaveRequests(
    context.classInstances,
    context.teachers,
    context.users,
    context.students,
    context.parents,
    config
  );
  await seedOrGetLeaveQuotaUsage(leaveRequests, context.students, config);
  await seedOrGetStudentProgress(context.classInstances, config);
  await seedOrGetStudentStatusHistory(context.students, context.users, config);

  const dstRuns = await seedOrGetDstMigrationRuns(context.users, config);
  await seedOrGetDstMigrationEntries(dstRuns, context.classes);

  await seedOrGetTeacherPayments(context.teachers ?? [], context.users ?? [], config);

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
