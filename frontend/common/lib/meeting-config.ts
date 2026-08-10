import type {
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { extractMeetingId, isUrlAllowedByProvider } from "@/shared/lib/meeting-config";

// Re-export shared utilities so frontend consumers keep a single import path.
export { extractMeetingId, isUrlAllowedByProvider };

type MeetingProviderFieldVisibility = {
  readonly fieldSchema: MeetingProviderFieldSchema | MeetingProviderFieldsFragment["fieldSchema"];
};

export function getVisibleMeetingConfigFields(provider: MeetingProviderFieldVisibility): {
  showUsername: boolean;
  showPassword: boolean;
  showTenantId: boolean;
} {
  return {
    showUsername: provider.fieldSchema?.supportsUsername === true,
    showPassword: provider.fieldSchema?.supportsPassword === true,
    showTenantId: provider.fieldSchema?.supportsTenantId === true,
  };
}

export function getMeetingJoinUrlFromDetails(details: MeetingConfigDetails): string {
  return details.meetingUrl ?? "";
}
