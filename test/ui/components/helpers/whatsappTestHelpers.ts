import {
  WhatsappAccountPurpose,
  WhatsappLimitTier,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncStatus,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  WhatsappAccountRow,
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
  WhatsappTemplateRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Factory for a single mock account row matching `WhatsappAccountRow`. */
export function makeAccountRow(
  id: string,
  displayPhone = "+1234567890",
  displayName = `Account ${id}`
): WhatsappAccountRow {
  return {
    id,
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    displayPhoneNumber: displayPhone,
    displayName: { en: displayName },
    isActive: true,
    isTestNumber: false,
    metaStatus: null,
    purpose: WhatsappAccountPurpose.General,
    onboardingMode: WhatsappOnboardingMode.CloudApi,
    syncStatus: WhatsappSyncStatus.NotStarted,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    qualityRating: WhatsappQualityRating.Green,
    portfolioMessagingLimitTier: WhatsappLimitTier.Tier_1K,
    throughputLevel: "STANDARD",
    maxPhoneNumbersPerBusiness: "25",
    lastWebhookAt: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

/** Factory for a mock template row. */
export function makeTemplateRow(id: string, name = `Template ${id}`): WhatsappTemplateRow {
  return {
    id,
    name,
    language: "en_US",
    category: WhatsappTemplateCategory.Marketing,
    status: WhatsappTemplateStatus.Approved,
    lastSyncedAt: "2025-01-01T00:00:00Z",
  };
}

/** Factory for a mock audit entry. */
export function makeAuditEntry(id: string, action: "optIn" | "optOut" = "optIn"): WhatsappOptInAuditEntry {
  return {
    id,
    date: "2025-01-15T10:00:00Z",
    action,
    changedBy: "admin@example.com",
  };
}

/** Factory for a mock admin user opt-in state. */
export function makeAdminUser(id: string, userName = `User ${id}`, optedIn = true): WhatsappOptInUserState {
  return {
    id,
    userName,
    optedIn,
    optedInAt: optedIn ? "2025-01-10T08:00:00Z" : null,
  };
}

/** Type guard for a record of unknown values. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Extract the first argument of the first call to a mock function as a record. */
export function firstCallArgRecord(mockFn: { mock: { calls: readonly unknown[][] } }): Record<string, unknown> {
  const firstArg = mockFn.mock.calls[0]?.[0];
  return isRecord(firstArg) ? firstArg : {};
}

/** Extract the first argument of the first call to a mock function as a string. */
export function firstCallArgString(mockFn: { mock: { calls: readonly unknown[][] } }): string {
  const firstArg = mockFn.mock.calls[0]?.[0];
  return typeof firstArg === "string" ? firstArg : "";
}

/** Extract the argument at the given index of the first call to a mock function as a string. */
export function firstCallArgStringAt(mockFn: { mock: { calls: readonly unknown[][] } }, index: number): string {
  const arg = mockFn.mock.calls[0]?.[index];
  return typeof arg === "string" ? arg : "";
}

/** Extract the first argument of the first call to a mock function as a boolean. */
export function firstCallArgBoolean(mockFn: { mock: { calls: readonly unknown[][] } }): boolean {
  const firstArg = mockFn.mock.calls[0]?.[0];
  return typeof firstArg === "boolean" ? firstArg : false;
}
