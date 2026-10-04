import {
  type WhatsappAccountsQuery,
  type WhatsappAccountTemplatesQuery,
  WhatsappLimitTier,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncStatus,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const REGULAR_ACCOUNT_ID = "acc-regular";
export const TEST_ACCOUNT_ID = "acc-test";
export const CONVERSATION_ID = "conv-1";
export const REGISTRY_PHONE = ["1", "555", "010", "0123"].join("");

export type WhatsappAccountMockRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];
type WhatsappTemplateMockRow = NonNullable<WhatsappAccountTemplatesQuery["whatsappAccountTemplates"]>[number];

function makeAccount(id: string, overrides: Partial<WhatsappAccountMockRow> = {}): WhatsappAccountMockRow {
  return {
    id,
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    displayPhoneNumber: ["966", "55", "123", "4567"].join(""),
    displayName: { en: `Number ${id}` },
    isActive: true,
    isTestNumber: false,
    metaStatus: "CONNECTED",
    purpose: null,
    onboardingMode: WhatsappOnboardingMode.CloudApi,
    syncStatus: WhatsappSyncStatus.Complete,
    syncPhase: null,
    syncProgress: null,
    syncDeadlineAt: null,
    syncFailureReason: null,
    qualityRating: WhatsappQualityRating.Green,
    portfolioMessagingLimitTier: WhatsappLimitTier.Tier_1K,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    lastWebhookAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function conversationRow(id: string, accountId: string) {
  return {
    __typename: "WhatsappConversation",
    id,
    accountId,
    waId: "966501234567",
    userId: null,
    username: null,
    displayName: "Layla Hassan",
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "Reminder: class moved to 16:00.",
    accountPurpose: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  };
}

export function messageRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    __typename: "WhatsappMessage",
    id,
    conversationId: CONVERSATION_ID,
    accountId: REGULAR_ACCOUNT_ID,
    wamid: null,
    direction: WhatsappMessageDirection.Inbound,
    type: "text",
    content: "Salam, can we move the class?",
    status: "delivered",
    mediaPlaceholder: false,
    mediaId: null,
    mediaMime: null,
    mediaSha256: null,
    phase: null,
    chunkOrder: null,
    sentAt: new Date().toISOString(),
    editedAt: null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function recipientRow(id: string) {
  return {
    __typename: "WhatsappTestRecipient",
    id,
    accountId: TEST_ACCOUNT_ID,
    phoneNumber: REGISTRY_PHONE,
    status: WhatsappTestRecipientStatus.Pending,
    note: null,
    lastCheckedAt: null,
    lastErrorCode: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

export function templateRow(id: string, name: string, paramsCount: number): WhatsappTemplateMockRow {
  return {
    id,
    name,
    language: "en_US",
    status: WhatsappTemplateStatus.Approved,
    category: WhatsappTemplateCategory.Utility,
    bodyText: "Hello, this is a reminder.",
    bodyParamsCount: paramsCount,
    lastSyncedAt: "2026-09-01T00:00:00.000Z",
  };
}

export const regularAccount = makeAccount(REGULAR_ACCOUNT_ID);
export const testAccount = makeAccount(TEST_ACCOUNT_ID, { isTestNumber: true, displayName: { en: "Test number" } });
