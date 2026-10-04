import {
  type seedOrGetCurrencyExchangeRates,
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
  seedOrGetGroupClassEnrollments,
  seedOrGetGroupClasses,
  seedOrGetRecurringScheduleDays,
} from "@/backend/db/seeds/classes";
import { findAdminUserOrFallback, type SeedConfig } from "@/backend/db/seeds/lib";
import { seedOrGetCreditTransactions, seedOrGetLessonReports, seedOrGetTeacherDues } from "@/backend/db/seeds/lms";
import {
  seedOrGetClassMeetingConfigs,
  seedOrGetMeetingProviders,
  seedOrGetUserMeetingConfigs,
} from "@/backend/db/seeds/meeting";
import { seedOrGetParents } from "@/backend/db/seeds/parents";
import { seedOrGetSystemSettings, seedOrGetTimezones } from "@/backend/db/seeds/shared";
import { seedOrGetStudents } from "@/backend/db/seeds/students";
import { seedOrGetTeacherImportantNotes, seedOrGetTeachers } from "@/backend/db/seeds/teachers";
import { seedOrGetUsers } from "@/backend/db/seeds/users";
import { seedOrGetWhatsappConfig } from "@/backend/db/seeds/whatsapp";
import { ReferenceDataService, WhatsappConfigService } from "@/backend/services";
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

export type RunStep = <T>(name: string, fn: () => Promise<T>) => Promise<T | undefined>;

export async function seedSystemSettings(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.systemSettings) {
    const settings = await step("system-settings", () => seedOrGetSystemSettings());
    if (settings) context.systemSettings = settings;
  }
}

export async function seedTimezones(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.timezones) {
    const timezones = await step("timezones", () => seedOrGetTimezones());
    if (timezones) context.timezones = timezones;
  }
}

export async function seedReferenceData(_context: SeedContext, step: RunStep): Promise<void> {
  await step("supported-currencies", () => seedOrGetSupportedCurrencies());
  await step("supported-mobile-wallets", () => seedOrGetSupportedMobileWallets());
  await step("supported-payment-links", () => seedOrGetSupportedPaymentLinks());
  await step("supported-online-accounts", () => seedOrGetSupportedOnlineAccounts());
  await step("meeting-providers", () => seedOrGetMeetingProviders());
}

export async function seedBooksAndCategories(_context: SeedContext, step: RunStep): Promise<void> {
  await step("books", () => seedOrGetBooks());
  await step("class-categories", () => seedOrGetClassCategories());
  await step("class-subjects", () => seedOrGetClassSubjects());
}

export async function seedPermissionGroups(context: SeedContext, step: RunStep): Promise<void> {
  if (!context.permissionGroups) {
    const groups = await step("permission-groups", () => ReferenceDataService.listPermissionGroups());
    if (groups) context.permissionGroups = groups;
  }
}

export async function seedUsersAndActor(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function seedWhatsappConfig(context: SeedContext, step: RunStep): Promise<void> {
  await step("whatsapp-config", () =>
    seedOrGetWhatsappConfig({
      actorUserId: context.actorUserId,
      // Look-before-create: once a whatsapp_configs row exists it is
      // authoritative, so a re-run must not re-persist the env payload (that
      // would silently revert admin-saved credentials). A failing existence
      // check makes the seeder stand down (fail safe).
      hasExisting: () => WhatsappConfigService.hasStoredConfiguration(),
      // Carry-over resolution through the service's env resolution (DB
      // override first, then process.env) so the seeded row matches what the
      // enforcement paths resolve — not a raw process.env snapshot.
      resolveEnvValues: () => WhatsappConfigService.resolveEnvCarryOver(),
      persist: input =>
        WhatsappConfigService.saveConfiguration(input, {
          actorUserId: context.actorUserId,
          // Bootstrap carry-over only: the row and the process environment
          // hold the same values here, so writing `env::` overrides would
          // just add redundant plaintext copies of the secrets. The UI save
          // path keeps the write-through that makes rotation enforcement-
          // visible. See WhatsappConfigService.saveConfiguration.
          propagateEnvConfigOverrides: false,
        }),
    })
  );
}

export async function seedTeachersAndParents(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function seedUserConfigs(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("user-payment-methods", () => seedOrGetUserPaymentMethods(context.users ?? [], config));
  await step("user-meeting-configs", () => seedOrGetUserMeetingConfigs(context.teachers ?? [], config));
  await step("teacher-important-notes", () =>
    seedOrGetTeacherImportantNotes(context.teachers ?? [], context.users ?? [], config)
  );
}

export async function seedStudentsAndCredits(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function runScheduleSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function seedClassInstanceArtifacts(
  context: SeedContext,
  step: RunStep,
  config: SeedConfig
): Promise<void> {
  await step("class-meeting-configs", () => seedOrGetClassMeetingConfigs(context.classInstances ?? [], config));
  await step("class-performance", () => seedOrGetClassPerformance(context.classInstances ?? [], config));
  await step("class-status-events", () =>
    seedOrGetClassStatusEvents(context.classInstances ?? [], context.teachers ?? [], config)
  );
}

export async function runLmsWorkflowSeeds(context: SeedContext, step: RunStep, config?: SeedConfig): Promise<void> {
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

export async function runGroupClassSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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
