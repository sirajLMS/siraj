import { seedOrGet as seedOrGetAdminAuditLogs } from "@/backend/db/seeds/audit/seed-admin-audit-logs";
import { seedOrGet as seedOrGetAuditLogs } from "@/backend/db/seeds/audit/seed-audit-logs";
import { seedOrGet as seedOrGetUserPermissionOverrides } from "@/backend/db/seeds/auth/seed-user-permission-overrides";
import { seedOrGet as seedOrGetSupportedCurrencies } from "@/backend/db/seeds/billing/seed-currencies";
import { seedOrGet as seedOrGetCurrencyExchangeAuditLogs } from "@/backend/db/seeds/billing/seed-currency-exchange-audit-logs";
import { seedOrGet as seedOrGetCurrencyExchangeRates } from "@/backend/db/seeds/billing/seed-currency-exchange-rates";
import { seedOrGet as seedOrGetCurrencyHedges } from "@/backend/db/seeds/billing/seed-currency-hedges";
import { seedOrGet as seedOrGetInvoiceCoverageMonths } from "@/backend/db/seeds/billing/seed-invoice-coverage-months";
import { seedOrGet as seedOrGetInvoicePaymentSubmissions } from "@/backend/db/seeds/billing/seed-invoice-payment-submissions";
import { seedOrGet as seedOrGetInvoices } from "@/backend/db/seeds/billing/seed-invoices";
import { seedOrGet as seedOrGetPayments } from "@/backend/db/seeds/billing/seed-payments";
import { seedOrGet as seedOrGetSupportedMobileWallets } from "@/backend/db/seeds/billing/seed-supported-mobile-wallets";
import { seedOrGet as seedOrGetSupportedOnlineAccounts } from "@/backend/db/seeds/billing/seed-supported-online-accounts";
import { seedOrGet as seedOrGetSupportedPaymentLinks } from "@/backend/db/seeds/billing/seed-supported-payment-links";
import { seedOrGet as seedOrGetUserPaymentMethods } from "@/backend/db/seeds/billing/seed-user-payment-methods";
import { seedOrGet as seedOrGetBooks } from "@/backend/db/seeds/books/seed-books";
import { seedOrGet as seedOrGetClassCategories } from "@/backend/db/seeds/classes/seed-class-categories";
import { seedOrGet as seedOrGetClassCommunications } from "@/backend/db/seeds/classes/seed-class-communications";
import { seedOrGet as seedOrGetClassInstances } from "@/backend/db/seeds/classes/seed-class-instances";
import { seedOrGet as seedOrGetClassPerformance } from "@/backend/db/seeds/classes/seed-class-performance";
import { seedOrGet as seedOrGetClassStatusEvents } from "@/backend/db/seeds/classes/seed-class-status-events";
import { seedOrGet as seedOrGetClassSubjects } from "@/backend/db/seeds/classes/seed-class-subjects";
import { seedOrGet as seedOrGetClasses } from "@/backend/db/seeds/classes/seed-classes";
import { seedOrGet as seedOrGetDstMigrationEntries } from "@/backend/db/seeds/classes/seed-dst-migration-entries";
import { seedOrGet as seedOrGetDstMigrationRuns } from "@/backend/db/seeds/classes/seed-dst-migration-runs";
import { seedOrGet as seedOrGetGroupClassEnrollments } from "@/backend/db/seeds/classes/seed-group-class-enrollments";
import { seedOrGet as seedOrGetGroupClasses } from "@/backend/db/seeds/classes/seed-group-classes";
import { seedOrGet as seedOrGetRecurringScheduleDays } from "@/backend/db/seeds/classes/seed-recurring-schedule-days";
import { seedOrGet as seedOrGetSubjectResources } from "@/backend/db/seeds/classes/seed-subject-resources";
import { seedOrGet as seedOrGetComplaintResponses } from "@/backend/db/seeds/complaints/seed-complaint-responses";
import { seedOrGet as seedOrGetComplaints } from "@/backend/db/seeds/complaints/seed-complaints";
import { findAdminUserOrFallback, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logFailedSeedSteps, runSeedStep, type SeedStepResult } from "@/backend/db/seeds/lib/run-seed-step";
import { seedOrGet as seedOrGetCreditTransactions } from "@/backend/db/seeds/lms/seed-credit-transactions";
import { seedOrGet as seedOrGetLessonReports } from "@/backend/db/seeds/lms/seed-lesson-reports";
import { seedOrGet as seedOrGetTeacherDues } from "@/backend/db/seeds/lms/seed-teacher-dues";
import { seedOrGet as seedOrGetClassMeetingConfigs } from "@/backend/db/seeds/meeting/seed-class-meeting-configs";
import { seedOrGet as seedOrGetMeetingProviders } from "@/backend/db/seeds/meeting/seed-meeting-providers";
import { seedOrGet as seedOrGetUserMeetingConfigs } from "@/backend/db/seeds/meeting/seed-user-meeting-configs";
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
import { seedOrGet as seedOrGetTeacherImportantNotes } from "@/backend/db/seeds/teachers/seed-teacher-important-notes";
import { seedOrGet as seedOrGetTeacherPayments } from "@/backend/db/seeds/teachers/seed-teacher-payments";
import { seedOrGet as seedOrGetTeacherRecurringUnavailability } from "@/backend/db/seeds/teachers/seed-teacher-recurring-unavailability";
import { seedOrGet as seedOrGetTeacherVacationRequests } from "@/backend/db/seeds/teachers/seed-teacher-vacation-requests";
import { seedOrGet as seedOrGetTeachers } from "@/backend/db/seeds/teachers/seed-teachers";
import { seedOrGet as seedOrGetUserDeviceTokens } from "@/backend/db/seeds/users/seed-user-device-tokens";
import { seedOrGet as seedOrGetUsers } from "@/backend/db/seeds/users/seed-users";
import logger from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import type {
  ClassInstanceEntity,
  CreditTransactionReturnType,
  GroupWithPermissionIds,
  InvoiceSelectType,
  LessonReportReturnType,
  ParentEntity,
  RecurringScheduleDayEntity,
  RecurringScheduleEntity,
  StudentEntity,
  SystemSettingSelectType,
  TeacherDueReturnType,
  TeacherEntity,
  TimezoneEntity,
  UserSelectType,
} from "@/backend/types";

export type SeedContext = {
  actorUserId?: string;
  config?: SeedConfig;
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: GroupWithPermissionIds[];
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
  creditTransactions?: CreditTransactionReturnType[];
  lessonReports?: LessonReportReturnType[];
  teacherDues?: TeacherDueReturnType[];
  failedSteps?: string[];
};

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");
  const stepResults: SeedStepResult[] = [];

  const step = async <T>(name: string, fn: () => Promise<T>): Promise<T | undefined> => {
    const outcome = await runSeedStep(name, fn);
    stepResults.push(outcome);
    return outcome.ok ? outcome.value : undefined;
  };

  if (!context.config) {
    context.config = loadSeedConfig();
    logger.log(`Seed profile: ${context.config.profile} (anchor: ${context.config.anchorDate.toISOString()})`);
  }

  const config = context.config;

  await seedSystemSettings(context, step);
  await seedTimezones(context, step);
  await seedReferenceData(context, step);
  await seedBooksAndCategories(context, step);
  await seedPermissionGroups(context, step);
  await seedUsersAndActor(context, step, config);
  await seedTeachersAndParents(context, step, config);
  await seedUserConfigs(context, step, config);
  await seedStudentsAndCredits(context, step, config);

  await runScheduleSeeds(context, step, config);

  await step("class-meeting-configs", () => seedOrGetClassMeetingConfigs(context.classInstances ?? [], config));
  await step("class-performance", () => seedOrGetClassPerformance(context.classInstances ?? [], config));
  await step("class-status-events", () =>
    seedOrGetClassStatusEvents(context.classInstances ?? [], context.teachers ?? [], config)
  );

  await runLmsWorkflowSeeds(context, step, config);
  await runGroupClassSeeds(context, step, config);

  await seedTeacherScheduleWindows(context, step, config);
  await seedLeaveRequests(context, step, config);
  await seedStudentProgress(context, step, config);
  await seedStudentStatusHistory(context, step, config);
  await seedDstMigrations(context, step, config);
  await seedTeacherPayments(context, step, config);

  await runBillingSeeds(context, step, config);
  await runCommunicationsSeeds(context, step, config);
  await runAuditLogSeeds(context, step, config);

  const failedSteps = stepResults.filter(result => !result.ok).map(result => result.name);
  context.failedSteps = failedSteps;
  logFailedSeedSteps(stepResults);

  logger.log("Verifying seed coverage...");
  await verifySeedCoverage(failedSteps);

  logger.log("Master seed process completed.");
  return context;
}

async function seedSystemSettings(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.systemSettings) {
    const settings = await step("system-settings", () => seedOrGetSystemSettings());
    if (settings) context.systemSettings = settings;
  }
}

async function seedTimezones(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.timezones) {
    const timezones = await step("timezones", () => seedOrGetTimezones());
    if (timezones) context.timezones = timezones;
  }
}

async function seedReferenceData(_context: SeedContext, step: RunStep): Promise<void> {
  await step("supported-currencies", () => seedOrGetSupportedCurrencies());
  await step("supported-mobile-wallets", () => seedOrGetSupportedMobileWallets());
  await step("supported-payment-links", () => seedOrGetSupportedPaymentLinks());
  await step("supported-online-accounts", () => seedOrGetSupportedOnlineAccounts());
  await step("meeting-providers", () => seedOrGetMeetingProviders());
}

async function seedBooksAndCategories(_context: SeedContext, step: RunStep): Promise<void> {
  await step("books", () => seedOrGetBooks());
  await step("class-categories", () => seedOrGetClassCategories());
  await step("class-subjects", () => seedOrGetClassSubjects());
}

async function seedPermissionGroups(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.permissionGroups) {
    const groups = await step("permission-groups", () => ReferenceDataService.listPermissionGroups());
    if (groups) context.permissionGroups = groups;
  }
}

async function seedUsersAndActor(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!context.users) {
    const users = await step("users", () => seedOrGetUsers(context.permissionGroups, config));
    if (users) context.users = users;
  }

  if (!context.actorUserId && context.users?.length) {
    const actor = findAdminUserOrFallback(context.users);
    if (actor) {
      context.actorUserId = actor.id;
    }
  }
}

async function seedTeachersAndParents(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!context.teachers) {
    const teachers = await step("teachers", () =>
      seedOrGetTeachers(context.users ?? [], context.timezones ?? [], config)
    );
    if (teachers) context.teachers = teachers;
  }

  if (!context.parents) {
    const parents = await step("parents", () => seedOrGetParents(context.users ?? [], config));
    if (parents) context.parents = parents;
  }
}

async function seedUserConfigs(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("user-payment-methods", () => seedOrGetUserPaymentMethods(context.users ?? [], config));
  await step("user-meeting-configs", () => seedOrGetUserMeetingConfigs(context.teachers ?? [], config));
  await step("teacher-important-notes", () =>
    seedOrGetTeacherImportantNotes(context.teachers ?? [], context.users ?? [], config)
  );
}

async function seedStudentsAndCredits(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!context.students) {
    const students = await step("students", () =>
      seedOrGetStudents(context.parents ?? [], context.teachers ?? [], config, context.users ?? [])
    );
    if (students) context.students = students;
  }

  if (!context.creditTransactions) {
    const credits = await step("credit-transactions", () =>
      seedOrGetCreditTransactions(context.students ?? [], context.users ?? [], config)
    );
    if (credits) context.creditTransactions = credits;
  }
}

async function seedTeacherScheduleWindows(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  const teachers = context.teachers ?? [];
  const users = context.users ?? [];
  const timezones = context.timezones ?? [];
  const windowSeeds: Array<[string, () => Promise<unknown>]> = [
    ["teacher-availability-windows", () => seedOrGetTeacherAvailabilityWindows(teachers, users, timezones, config)],
    [
      "teacher-recurring-unavailability",
      () => seedOrGetTeacherRecurringUnavailability(teachers, users, timezones, config),
    ],
    ["teacher-vacation-requests", () => seedOrGetTeacherVacationRequests(teachers, users, timezones, config)],
  ];

  for (const [name, run] of windowSeeds) {
    await step(name, run);
  }
}

async function seedLeaveRequests(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  const leaveRequests = await step("leave-requests", () =>
    seedOrGetLeaveRequests(
      context.classInstances ?? [],
      context.teachers ?? [],
      context.users ?? [],
      context.students ?? [],
      context.parents ?? [],
      config
    )
  );
  if (leaveRequests) {
    await step("leave-quota-usage", () => seedOrGetLeaveQuotaUsage(leaveRequests, context.students ?? [], config));
  }
}

async function seedStudentProgress(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("student-progress", () => seedOrGetStudentProgress(context.classInstances ?? [], config));
}

async function seedStudentStatusHistory(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("student-status-history", () =>
    seedOrGetStudentStatusHistory(context.students ?? [], context.users ?? [], config)
  );
}

async function seedDstMigrations(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  const dstRuns = await step("dst-migration-runs", () => seedOrGetDstMigrationRuns(context.users ?? [], config));
  if (dstRuns) {
    await step("dst-migration-entries", () => seedOrGetDstMigrationEntries(dstRuns, context.classes ?? []));
  }
}

async function seedTeacherPayments(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("teacher-payments", () => seedOrGetTeacherPayments(context.teachers ?? [], context.users ?? [], config));
}

type RunStep = <T>(name: string, fn: () => Promise<T>) => Promise<T | undefined>;

async function runScheduleSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!context.classes) {
    const classes = await step("classes", () =>
      seedOrGetClasses(context.teachers ?? [], context.students ?? [], config)
    );
    if (classes) context.classes = classes;
  }

  if (!context.recurringScheduleDays) {
    const days = await step("recurring-schedule-days", () =>
      seedOrGetRecurringScheduleDays(context.classes ?? [], config)
    );
    if (days) context.recurringScheduleDays = days;
  }

  if (!context.classInstances) {
    const instances = await step("class-instances", () =>
      seedOrGetClassInstances(context.classes ?? [], context.teachers ?? [], context.students ?? [], config)
    );
    if (instances) context.classInstances = instances;
  }
}

async function runGroupClassSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  const groupClasses = await step("group-classes", () =>
    seedOrGetGroupClasses(context.classInstances ?? [], context.students ?? [], config)
  );
  if (groupClasses) context.groupClasses = groupClasses;

  const enrollments = await step("group-class-enrollments", () =>
    seedOrGetGroupClassEnrollments(context.groupClasses ?? [], context.students ?? [], config)
  );
  if (enrollments) context.groupClassEnrollments = enrollments;

  const communications = await step("class-communications", () =>
    seedOrGetClassCommunications(context.groupClasses ?? [], config)
  );
  if (communications) context.classCommunications = communications;
}

async function runLmsWorkflowSeeds(context: SeedContext, step: RunStep, config?: SeedConfig): Promise<void> {
  if (!context.lessonReports) {
    const reports = await step("lesson-reports", () =>
      seedOrGetLessonReports(
        context.classInstances ?? [],
        context.teachers ?? [],
        context.students ?? [],
        context.users ?? [],
        config
      )
    );
    if (reports) context.lessonReports = reports;
  }

  if (!context.teacherDues) {
    const dues = await step("teacher-dues", () =>
      seedOrGetTeacherDues(
        context.lessonReports ?? [],
        context.classInstances ?? [],
        context.teachers ?? [],
        context.users ?? [],
        config
      )
    );
    if (dues) context.teacherDues = dues;
  }
}

async function runBillingSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!config.enableBilling) return;

  const exchangeRates = await step("currency-exchange-rates", () => seedOrGetCurrencyExchangeRates(config));
  if (exchangeRates) context.exchangeRates = exchangeRates;

  await step("currency-exchange-audit-logs", () =>
    seedOrGetCurrencyExchangeAuditLogs(context.exchangeRates ?? [], context.users ?? [], config)
  );
  await step("currency-hedges", () => seedOrGetCurrencyHedges(config));

  const invoices = await step("invoices", () =>
    seedOrGetInvoices(context.parents ?? [], context.students ?? [], context.users ?? [], config)
  );
  if (invoices) context.invoices = invoices;

  await step("invoice-coverage-months", () => seedOrGetInvoiceCoverageMonths(context.invoices ?? [], config));
  await step("invoice-payment-submissions", () =>
    seedOrGetInvoicePaymentSubmissions(context.invoices ?? [], context.parents ?? [], context.users ?? [], config)
  );
  await step("payments", () => seedOrGetPayments(context.invoices ?? [], config));
}

async function runCommunicationsSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!config.enableCommunications) return;

  await step("user-notification-preferences", () => seedOrGetUserNotificationPreferences(context.users ?? [], config));
  const deviceTokens = await step("user-device-tokens", () => seedOrGetUserDeviceTokens(context.users ?? [], config));
  if (deviceTokens) {
    await step("notification-deliveries", () =>
      seedOrGetNotificationDeliveries(context.users ?? [], deviceTokens, config)
    );
  }
  const complaints = await step("complaints", () =>
    seedOrGetComplaints(context.parents ?? [], context.students ?? [], context.users ?? [], config)
  );
  if (complaints) {
    await step("complaint-responses", () => seedOrGetComplaintResponses(complaints, context.users ?? [], config));
  }
  await step("suggestions", () => seedOrGetSuggestions(context.parents ?? [], context.users ?? [], config));
  await step("learning-resources", () => seedOrGetLearningResources(context.users ?? [], config));
  await step("subject-resources", () => seedOrGetSubjectResources());
  await step("site-content", () => seedOrGetSiteContent(context.users ?? [], config));
}

async function runAuditLogSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!config.enableAuditLogs) return;

  await step("admin-audit-logs", () => seedOrGetAdminAuditLogs(context.users ?? [], config));
  await step("audit-logs", () => seedOrGetAuditLogs(context.users ?? [], context.invoices ?? [], config));
  await step("user-permission-overrides", () => seedOrGetUserPermissionOverrides(context.users ?? [], config));
}
