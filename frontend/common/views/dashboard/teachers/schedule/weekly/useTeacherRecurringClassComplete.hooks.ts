"use client";

import type { useApolloClient } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { postCreateRecurringMeetingConfig } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";

export type CreateRecurringClassResult = {
  readonly id?: string | null;
  readonly recurringScheduleId?: string | null;
  readonly classInstanceIds?: ReadonlyArray<string> | null;
  readonly classInstanceCount?: number | null;
};

// Owns the post-create flow: meeting-config side effect, success toast,
// refetch, and the dialog-close decision (kept open when the meeting config
// failed to save so the user can retry).
export function useCompleteSuccessfulCreate(args: {
  readonly client: ReturnType<typeof useApolloClient>;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly handleRefetch: () => Promise<void>;
  readonly closeDialog: () => void;
}) {
  const { client, formState, notifications, dialogLabels, handleRefetch, closeDialog } = args;
  return useCallback(
    async (result: CreateRecurringClassResult) => {
      if (!result) {
        return;
      }

      const recurringScheduleId = result.recurringScheduleId;
      const firstClassInstanceId = result.classInstanceIds?.[0] ?? null;
      let meetingConfigSaved = true;

      if (recurringScheduleId) {
        const meetingResult = await postCreateRecurringMeetingConfig(
          client,
          recurringScheduleId,
          formState.meetingConfig
        );
        meetingConfigSaved = meetingResult.success;
        if (!meetingResult.success) {
          formState.setMeetingConfigWarning(true);
          formState.setCreatedClassInstanceId(firstClassInstanceId);
        }
      }

      notifications.show(dialogLabels.success.description(result.classInstanceCount ?? 0), {
        severity: "success",
      });
      logger.info("Recurring class created successfully", { id: result.id });

      await handleRefetch();

      if (meetingConfigSaved) {
        closeDialog();
      }
    },
    [client, formState, notifications, dialogLabels, handleRefetch, closeDialog]
  );
}
