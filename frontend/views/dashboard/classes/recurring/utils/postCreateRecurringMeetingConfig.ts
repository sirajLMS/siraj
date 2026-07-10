import { useApolloClient } from "@apollo/client/react";
import type {
  MeetingProviderFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/graphql/generated/gql/operations";
import { createClassMeetingConfigMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/utils/logger";

export type RecurringMeetingConfigFormState = {
  readonly useTeacherDefault: boolean;
  readonly selectedConfig: UserMeetingConfigFieldsFragment | null;
  readonly newProvider: MeetingProviderFieldsFragment | null;
  readonly newMeetingUrl: string;
  readonly newLabel: string;
};

export const emptyRecurringMeetingConfigState = (): RecurringMeetingConfigFormState => ({
  useTeacherDefault: true,
  selectedConfig: null,
  newProvider: null,
  newMeetingUrl: "",
  newLabel: "",
});

export async function postCreateRecurringMeetingConfig(
  client: ReturnType<typeof useApolloClient>,
  recurringScheduleId: string,
  state: RecurringMeetingConfigFormState
): Promise<{ success: boolean }> {
  if (state.useTeacherDefault) {
    return { success: true };
  }

  const sourceConfig = state.selectedConfig;
  const providerId = sourceConfig?.providerId ?? state.newProvider?.id;
  const meetingUrl = sourceConfig?.details?.meetingUrl?.trim() ?? state.newMeetingUrl.trim();
  const label = sourceConfig?.label?.trim() || state.newLabel.trim() || null;

  if (!providerId || !meetingUrl) {
    return { success: true };
  }

  try {
    await client.mutate({
      mutation: createClassMeetingConfigMutationDocument,
      variables: {
        input: {
          recurringScheduleId,
          classInstanceId: null,
          providerId,
          label,
          isDefault: true,
          password: null,
          details: {
            meetingUrl,
            username: sourceConfig?.details?.username ?? null,
            tenantId: sourceConfig?.details?.tenantId ?? null,
          },
        },
      },
    });
    return { success: true };
  } catch (err) {
    logger.warn("Recurring class created but meeting config failed", { err });
    return { success: false };
  }
}
