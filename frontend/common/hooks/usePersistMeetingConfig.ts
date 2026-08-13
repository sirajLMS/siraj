import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { createUserMeetingConfigMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/common/utils/logger";

interface MeetingConfigFormData {
  readonly meetingProvider?: { readonly id: string | null } | null;
  readonly meetingUrl?: string | null;
  readonly meetingLabel?: string | null;
}

/**
 * Shared hook that persists a user meeting config via Apollo mutation.
 *
 * Eliminates the duplicated `persistMeetingConfig` / `createMeetingConfig`
 * function that existed in both `useCreateParentOnboarding` and
 * `useCreateTeacherOnboarding`.
 *
 * Returns:
 *   • `persistMeetingConfig` — async fn to call after entity creation
 *   • `meetingConfigWarning` — boolean state, true when the mutation failed
 *   • `clearMeetingConfigWarning` — resets the warning
 */
export function usePersistMeetingConfig() {
  const client = useApolloClient();
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);

  const persistMeetingConfig = async (
    formData: MeetingConfigFormData,
    userId: string,
    entityName: string
  ): Promise<void> => {
    if (!formData.meetingProvider?.id || !formData.meetingUrl?.trim()) {
      return;
    }
    try {
      await client.mutate({
        mutation: createUserMeetingConfigMutationDocument,
        variables: {
          input: {
            userId,
            providerId: formData.meetingProvider.id,
            label: formData.meetingLabel?.trim() ?? null,
            isDefault: true,
            password: null,
            details: {
              meetingUrl: formData.meetingUrl.trim(),
              username: null,
              tenantId: null,
            },
          },
        },
      });
    } catch (meetingErr) {
      logger.warn(`${entityName} created but meeting config failed`, { meetingErr });
      setMeetingConfigWarning(true);
    }
  };

  return {
    persistMeetingConfig,
    meetingConfigWarning,
    clearMeetingConfigWarning: () => setMeetingConfigWarning(false),
  };
}
