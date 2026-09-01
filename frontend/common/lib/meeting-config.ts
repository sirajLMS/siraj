import type {
  MeetingProviderFieldsFragment,
  MeetingProviderFieldsFragment_fieldSchema,
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
