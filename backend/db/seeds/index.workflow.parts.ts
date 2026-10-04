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
} from "@/backend/db/seeds/billing";
import {
  seedOrGetDstMigrationEntries,
  seedOrGetDstMigrationRuns,
  seedOrGetSubjectResources,
} from "@/backend/db/seeds/classes";
import { seedOrGetComplaintResponses, seedOrGetComplaints } from "@/backend/db/seeds/complaints";
import type { RunStep, SeedContext } from "@/backend/db/seeds/index.core.parts";
import type { SeedConfig } from "@/backend/db/seeds/lib";
import {
  seedOrGetNotificationDeliveries,
  seedOrGetUserNotificationPreferences,
} from "@/backend/db/seeds/notifications";
import { seedOrGetSuggestions } from "@/backend/db/seeds/parents";
import { seedOrGetLearningResources, seedOrGetSiteContent } from "@/backend/db/seeds/storage";
import { seedOrGetStudentProgress, seedOrGetStudentStatusHistory } from "@/backend/db/seeds/students";
import {
  seedOrGetLeaveQuotaUsage,
  seedOrGetLeaveRequests,
  seedOrGetTeacherAvailabilityWindows,
  seedOrGetTeacherPayments,
  seedOrGetTeacherRecurringUnavailability,
  seedOrGetTeacherVacationRequests,
} from "@/backend/db/seeds/teachers";
import { seedOrGetUserDeviceTokens } from "@/backend/db/seeds/users";

export async function seedTeacherScheduleWindows(
  context: SeedContext,
  step: RunStep,
  config: SeedConfig
): Promise<void> {
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

export async function seedLeaveRequests(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function seedStudentProgress(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("student-progress", () => seedOrGetStudentProgress(context.classInstances ?? [], config));
}

export async function seedStudentStatusHistory(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("student-status-history", () =>
    seedOrGetStudentStatusHistory(context.students ?? [], context.users ?? [], config)
  );
}

export async function seedDstMigrations(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  const dstRuns = await step("dst-migration-runs", () => seedOrGetDstMigrationRuns(context.users ?? [], config));
  if (dstRuns) {
    await step("dst-migration-entries", () => seedOrGetDstMigrationEntries(dstRuns, context.classes ?? []));
  }
}

export async function seedTeacherPayments(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  await step("teacher-payments", () => seedOrGetTeacherPayments(context.teachers ?? [], context.users ?? [], config));
}

export async function runBillingSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function runCommunicationsSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
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

export async function runAuditLogSeeds(context: SeedContext, step: RunStep, config: SeedConfig): Promise<void> {
  if (!config.enableAuditLogs) return;

  await step("admin-audit-logs", () => seedOrGetAdminAuditLogs(context.users ?? [], config));
  await step("audit-logs", () => seedOrGetAuditLogs(context.users ?? [], context.invoices ?? [], config));
  await step("user-permission-overrides", () => seedOrGetUserPermissionOverrides(context.users ?? [], config));
}
