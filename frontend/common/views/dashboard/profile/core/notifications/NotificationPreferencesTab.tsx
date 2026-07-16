"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { logger } from "@/frontend/common/utils/logger";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
  preferenceKey,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { NotificationPreferencesTabDesktop } from "@/frontend/desktop/views/dashboard/profile/core/notifications/notificationPreferencesTab.desktop";
import { NotificationPreferencesTabMobile } from "@/frontend/mobile/views/dashboard/profile/core/notifications/notificationPreferencesTab.mobile";
import { useAppTranslation } from "@/shared/locale/client";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

type PendingChange = Types.NotificationPreferenceInput;

function buildDefaultPreferences(): NotificationPrefRow[] {
  return NOTIFICATION_CHANNELS.flatMap(channel =>
    NOTIFICATION_EVENT_TYPES.map(eventType => ({
      id: preferenceKey(channel, eventType),
      channel,
      eventType,
      enabled: true,
    }))
  );
}

export function NotificationPreferencesTab({ isActive }: Readonly<NotificationPreferencesTabProps>) {
  const t = useAppTranslation().profileTranslations.notifications;
  const [localPreferences, setLocalPreferences] = useState<NotificationPrefRow[]>(buildDefaultPreferences);
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const { data, loading, error } = useQuery(notificationPreferencesQueryDocument, {
    skip: !isActive,
    fetchPolicy: "cache-and-network",
  });

  const [updatePreferences, { loading: saving }] = useMutation(updateNotificationPreferencesMutationDocument);

  useEffect(() => {
    if (data?.notificationPreferences) {
      setLocalPreferences(data.notificationPreferences);
      pendingChangesRef.current.clear();
    }
  }, [data?.notificationPreferences]);

  const flushPendingChanges = useCallback(async () => {
    const pending = Array.from(pendingChangesRef.current.values());
    if (pending.length === 0) {
      return;
    }

    try {
      await updatePreferences({
        variables: { input: pending },
      });
      pendingChangesRef.current.clear();
      setSnackbarMessage(t.saved);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (saveError) {
      logger.error("Failed to save notification preferences", { error: saveError });
      setSnackbarMessage(t.errorSaving);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [t, updatePreferences]);

  const debouncedSave = useDebouncedCallback(() => {
    void flushPendingChanges();
  }, 500);

  const handleToggle = useCallback(
    (channel: Types.NotificationChannel, eventType: Types.NotificationEventType, enabled: boolean) => {
      const key = preferenceKey(channel, eventType);

      setLocalPreferences(current =>
        current.map(pref =>
          pref.channel && pref.eventType && preferenceKey(pref.channel, pref.eventType) === key
            ? { ...pref, enabled }
            : pref
        )
      );

      pendingChangesRef.current.set(key, { channel, eventType, enabled });
      debouncedSave();
    },
    [debouncedSave]
  );

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const { isMobile } = useViewport();

  const variantProps = {
    preferences: localPreferences,
    onToggle: handleToggle,
    disabled: saving,
    loading,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onSnackbarClose: handleSnackbarClose,
    errorLoading: Boolean(error),
  };

  return isMobile ? (
    <NotificationPreferencesTabMobile {...variantProps} />
  ) : (
    <NotificationPreferencesTabDesktop {...variantProps} />
  );
}
