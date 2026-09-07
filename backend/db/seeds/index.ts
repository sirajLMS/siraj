import { seedOrGetAdminAuditLogs, seedOrGetAuditLogs } from "@/backend/db/seeds/audit";
import { seedOrGetUserPermissionOverrides } from "@/backend/db/seeds/auth";
import {
  seedOrGetCurrencyExchangeAuditLogs,
  seedOrGetCurrencyExchangeRates,
  seedOrGetCurrencyHedges,
  seedOrGetInvoiceCoverageMonths,
  seedOrGetInvoicePaymentSubmissions,
  seedOrGetInvoices,
  seedOrGetPackagePlans,
  seedOrGetPayments,
  seedOrGetQuotas,
  seedOrGetSupportedCurrencies,
  seedOrGetSupportedMobileWallets,
  seedOrGetSupportedOnlineAccounts,
  seedOrGetSupportedPaymentLinks,
  seedOrGetUserPaymentMethods,
} from "@/backend/db/seeds/billing";
import { seedOrGetBooks } from "@/backend/db/seeds/books";
import {
  seedOrGetClassCategories,
  seedOrGetClassCommunications,
  seedOrGetClasses,
  seedOrGetClassInstances,
  seedOrGetClassPerformance,
  seedOrGetClassStatusEvents,
  seedOrGetClassSubjects,
  seedOrGetDstMigrationEntries,
  seedOrGetDstMigrationRuns,
  seedOrGetGroupClassEnrollments,
  seedOrGetGroupClasses,
  seedOrGetRecurringScheduleDays,
  seedOrGetSubjectResources,
} from "@/backend/db/seeds/classes";
import { seedOrGetComplaintResponses, seedOrGetComplaints } from "@/backend/db/seeds/complaints";
import {
  findAdminUserOrFallback,
  loadSeedConfig,
  logFailedSeedSteps,
  runSeedStep,
  type SeedConfig,
  type SeedStepResult,
} from "@/backend/db/seeds/lib";
import { seedOrGetCreditTransactions, seedOrGetLessonReports, seedOrGetTeacherDues } from "@/backend/db/seeds/lms";
import {
  seedOrGetClassMeetingConfigs,
  seedOrGetMeetingProviders,
  seedOrGetUserMeetingConfigs,
} from "@/backend/db/seeds/meeting";
import {
  seedOrGetNotificationDeliveries,
  seedOrGetUserNotificationPreferences,
} from "@/backend/db/seeds/notifications";
import { seedOrGetParents, seedOrGetSuggestions } from "@/backend/db/seeds/parents";
import { seedOrGetSystemSettings, seedOrGetTimezones, verifySeedCoverage } from "@/backend/db/seeds/shared";
import { seedOrGetLearningResources, seedOrGetSiteContent } from "@/backend/db/seeds/storage";
import {
  seedOrGetStudentProgress,
  seedOrGetStudentStatusHistory,
  seedOrGetStudents,
} from "@/backend/db/seeds/students";
import {
  seedOrGetLeaveQuotaUsage,
  seedOrGetLeaveRequests,
  seedOrGetTeacherAvailabilityWindows,
  seedOrGetTeacherImportantNotes,
  seedOrGetTeacherPayments,
  seedOrGetTeacherRecurringUnavailability,
  seedOrGetTeachers,
  seedOrGetTeacherVacationRequests,
} from "@/backend/db/seeds/teachers";
import { seedOrGetUserDeviceTokens, seedOrGetUsers } from "@/backend/db/seeds/users";
import { seedOrGetWhatsappConfig } from "@/backend/db/seeds/whatsapp";
import { logger } from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services";
import type {
  ClassInstanceSelectType,
  CreditTransactionReturnType,
  GroupWithPermissionIds,
  InvoiceSelectType,
  LessonReportReturnType,
  PackagePlanSelectType,
  ParentSelectType,
  RecurringScheduleDaySelectType,
  RecurringScheduleSelectType,
  StudentSelectType,
  SystemSettingSelectType,
  TeacherDueReturnType,
  TeacherSelectType,
  TimezoneSelectType,
  UserSelectType,
} from "@/backend/types";

export type SeedContext = {
  actorUserId?: string;
  config?: SeedConfig;
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneSelectType[];
  packagePlans?: PackagePlanSelectType[];
  permissionGroups?: GroupWithPermissionIds[];
  users?: UserSelectType[];
  teachers?: TeacherSelectType[];
  parents?: ParentSelectType[];
  students?: StudentSelectType[];
  classes?: RecurringScheduleSelectType[];
  recurringScheduleDays?: RecurringScheduleDaySelectType[];
  classInstances?: ClassInstanceSelectType[];
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
  await seedWhatsappConfig(context, step);
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

async function seedWhatsappConfig(context: SeedContext, step: RunStep): Promise<void> {
  await step("whatsapp-config", () => seedOrGetWhatsappConfig({ actorUserId: context.actorUserId }));
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

  await step("teacher-availability-windows", () =>
    seedOrGetTeacherAvailabilityWindows(teachers, users, timezones, config)
  );
  await step("teacher-recurring-unavailability", () =>
    seedOrGetTeacherRecurringUnavailability(teachers, users, timezones, config)
  );
  await step("teacher-vacation-requests", () => seedOrGetTeacherVacationRequests(teachers, users, timezones, config));
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

  const packagePlans = await step("package-plans", () => seedOrGetPackagePlans());
  if (packagePlans) context.packagePlans = packagePlans;

  const invoices = await step("invoices", () =>
    seedOrGetInvoices(context.parents ?? [], context.students ?? [], context.users ?? [], config)
  );
  if (invoices) context.invoices = invoices;

  await step("invoice-coverage-months", () => seedOrGetInvoiceCoverageMonths(context.invoices ?? [], config));
  await step("invoice-payment-submissions", () =>
    seedOrGetInvoicePaymentSubmissions(context.invoices ?? [], context.parents ?? [], context.users ?? [], config)
  );
  await step("payments", () => seedOrGetPayments(context.invoices ?? [], config));
  await step("quotas", () => seedOrGetQuotas(context.students ?? [], context.teachers ?? [], context.actorUserId));
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
