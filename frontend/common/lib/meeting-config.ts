import type {
  MeetingProviderFieldsFragment,
  MeetingProviderFieldsFragment_fieldSchema,
  UserMeetingConfigFieldsFragment_details,
} from "@/frontend/common/graphql/generated/gql/graphql";

type MeetingProviderFieldVisibility = {
  readonly fieldSchema: MeetingProviderFieldsFragment_fieldSchema | MeetingProviderFieldsFragment["fieldSchema"];
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

export function getMeetingJoinUrlFromDetails(details: UserMeetingConfigFieldsFragment_details): string {
  return details.meetingUrl ?? "";
}
