import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";

export const zoomProvider: MeetingProviderFieldsFragment = {
  id: "provider-zoom",
  slug: "zoom",
  name: { en: "Zoom", ar: "زوم" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
  },
  providerKind: "manual",
};

export const fullFieldsProvider: MeetingProviderFieldsFragment = {
  id: "provider-teams",
  slug: "microsoft_teams",
  name: { en: "Microsoft Teams", ar: "مايكروسوفت Teams" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.teams.microsoft.com"],
  urlExample: "https://teams.microsoft.com/l/meetup-join/example",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: true,
  },
  providerKind: "manual",
};

export const autoGenProvider: MeetingProviderFieldsFragment = {
  id: "provider-zoom-auto",
  slug: "zoom",
  name: { en: "Zoom (Auto)", ar: "زوم (تلقائي)" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: false,
    supportsAutoGeneration: true,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
  },
  providerKind: "zoom",
};
