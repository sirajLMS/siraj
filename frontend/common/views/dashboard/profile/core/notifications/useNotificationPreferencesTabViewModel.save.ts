"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import { updateNotificationPreferencesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES_BY_CATEGORY,
  type NotificationEventCategory,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { preferenceKey } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import type { PendingChange } from "@/frontend/common/views/dashboard/profile/core/notifications/useNotificationPreferencesTabViewModel.hooks";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export function useNotificationSave(
  labels: ProfileNotificationsLabels,
  clearPendingChanges: () => void,
  getPendingChanges: () => PendingChange[]
) {
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [updatePreferences, { loading: saving }] = useMutation(updateNotificationPreferencesMutationDocument);

  const flushPendingChanges = useCallback(async () => {
    const pending = getPendingChanges();
    if (pending.length === 0) {
      return;
    }

    try {
      await updatePreferences({
        variables: { input: pending },
      });
      clearPendingChanges();
      setSnackbarState({
        open: true,
        message: labels.saved,
        severity: "success",
      });
    } catch (saveError) {
      logger.error("Failed to save notification preferences", { error: saveError });
      setSnackbarState({
        open: true,
        message: labels.errorSaving,
        severity: "error",
      });
    }
  }, [clearPendingChanges, getPendingChanges, labels, updatePreferences]);

  const debouncedSave = useDebouncedCallback(() => {
    void flushPendingChanges();
  }, 500);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    saving,
    snackbarOpen: snackbarState.open,
    snackbarMessage: snackbarState.message,
    snackbarSeverity: snackbarState.severity,
    handleSnackbarClose,
    debouncedSave,
  };
}

export function useNotificationPreferenceHandlers(
  updatePreferenceEnabled: (key: string, enabled: boolean) => void,
  updateCategoryPreferences: (categoryEventTypes: readonly NotificationEventType[], enabled: boolean) => void,
  addPendingChange: (key: string, change: PendingChange) => void,
  debouncedSave: () => void
) {
  const handleToggle = useCallback(
    (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => {
      const key = preferenceKey(channel, eventType);
      updatePreferenceEnabled(key, enabled);
      addPendingChange(key, { channel, eventType, enabled });
      debouncedSave();
    },
    [addPendingChange, debouncedSave, updatePreferenceEnabled]
  );

  const handleCategoryToggle = useCallback(
    (category: NotificationEventCategory, enabled: boolean) => {
      const catEventTypes = NOTIFICATION_EVENT_TYPES_BY_CATEGORY[category] ?? [];
      updateCategoryPreferences(catEventTypes, enabled);

      for (const channel of NOTIFICATION_CHANNELS) {
        for (const eventType of catEventTypes) {
          const key = preferenceKey(channel, eventType);
          addPendingChange(key, { channel, eventType, enabled });
        }
      }
      debouncedSave();
    },
    [addPendingChange, debouncedSave, updateCategoryPreferences]
  );

  return { handleToggle, handleCategoryToggle };
}
