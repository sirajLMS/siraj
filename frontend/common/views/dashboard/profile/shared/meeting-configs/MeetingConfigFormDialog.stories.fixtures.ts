import type { MockLink } from "@apollo/client/testing";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createUserMeetingConfigMutationDocument,
  generateMeetingUrlMutationDocument,
  meetingProvidersQueryDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

const zoomProvider = {
  id: "prov-zoom-1",
  slug: "zoom",
  name: { en: "Zoom", ar: "Zoom" },
  description: null,
  instructions: { en: "Connect Zoom then save." },
  urlAllowlist: ["zoom.us", "zoom.com"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  providerKind: "oauth",
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  fieldSchema: {
    requiresMeetingUrl: false,
    supportsAutoGeneration: true,
    supportsUsername: false,
    supportsPassword: true,
    supportsTenantId: false,
  },
};

const manualProvider = {
  id: "prov-manual-1",
  slug: "manual",
  name: { en: "Manual URL", ar: "Manual URL" },
  description: null,
  instructions: null,
  urlAllowlist: [],
  urlExample: "https://example.com/j/...",
  logoUrl: null,
  providerKind: "manual",
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: false,
  },
};

/** Matches any variables — used for mutation mocks that don't need exact inputs. */
const matchAny = () => true;

export const emptyMocks: MockLink.MockedResponse[] = [
  {
    request: { query: meetingProvidersQueryDocument, variables: { activeOnly: true } },
    result: { data: { meetingProviders: [] } },
  },
];

export const populatedMocks: MockLink.MockedResponse[] = [
  {
    request: { query: meetingProvidersQueryDocument, variables: { activeOnly: true } },
    result: {
      data: {
        meetingProviders: [zoomProvider, manualProvider],
      },
    },
  },
  {
    request: { query: createUserMeetingConfigMutationDocument, variables: matchAny },
    maxUsageCount: Infinity,
    result: {
      data: {
        createUserMeetingConfig: {
          id: "new-1",
          userId: "user-1",
          providerId: "prov-zoom-1",
          label: "Personal Room",
          isDefault: true,
          hasSecret: false,
          oauthTokenExpiresAt: null,
          providerMetadata: null,
          createdAt: "2026-08-15T10:00:00Z",
          updatedAt: "2026-08-15T10:00:00Z",
          details: { meetingUrl: "https://zoom.us/j/123", username: null, tenantId: null },
          provider: zoomProvider,
        },
      },
    },
  },
  {
    request: { query: updateUserMeetingConfigMutationDocument, variables: matchAny },
    maxUsageCount: Infinity,
    result: {
      data: {
        updateUserMeetingConfig: {
          id: "edit-1",
          userId: "user-1",
          providerId: "prov-zoom-1",
          label: "Personal Room",
          isDefault: true,
          hasSecret: true,
          oauthTokenExpiresAt: null,
          providerMetadata: null,
          createdAt: "2026-08-15T10:00:00Z",
          updatedAt: "2026-08-15T10:00:00Z",
          details: {
            id: "meeting-config-details",
            meetingUrl: "https://zoom.us/j/456",
            username: null,
            tenantId: null,
          },
          provider: zoomProvider,
        },
      },
    },
  },
  {
    request: { query: generateMeetingUrlMutationDocument, variables: matchAny },
    maxUsageCount: Infinity,
    result: {
      data: { generateMeetingUrl: { joinUrl: "https://zoom.us/j/777" } },
    },
  },
];

export const editConfig: UserMeetingConfigFieldsFragment = {
  id: "edit-1",
  userId: "user-1",
  providerId: "prov-zoom-1",
  label: "Personal Room",
  isDefault: true,
  hasSecret: false,
  oauthTokenExpiresAt: null,
  providerMetadata: null,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-10T00:00:00Z",
  details: { id: "meeting-config-details", meetingUrl: "https://zoom.us/j/456", username: null, tenantId: null },
  provider: zoomProvider,
};
