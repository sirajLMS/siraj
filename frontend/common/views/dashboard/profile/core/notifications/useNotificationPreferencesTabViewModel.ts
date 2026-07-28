"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  NotificationChannel,
  type NotificationEventType,
  type NotificationPreferenceInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildDefaultPreferences,
  buildPreferenceMap,
  buildPreferenceMatrixRows,
  getNotificationEventTypesForRole,
  NOTIFICATION_CHANNELS,
  type NotificationPreferencesTabVariantProps,
  type NotificationPrefRow,
  preferenceKey,
  resolveNotificationPreferenceRole,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

type PendingChange = NotificationPreferenceInput;

export type NotificationPreferencesTabViewModel = NotificationPreferencesTabVariantProps;

export function useNotificationPreferencesTabViewModel(
  props: Readonly<NotificationPreferencesTabProps>
): NotificationPreferencesTabViewModel {
  const { isActive } = props;
  const labels = useAppTranslation(Translation.Profile.Notifications);
  const viewerRole = useUserStore(state => state.role);

  const preferenceRole = useMemo(() => resolveNotificationPreferenceRole({ role: viewerRole }), [viewerRole]);
  const eventTypes = useMemo(() => getNotificationEventTypesForRole(preferenceRole), [preferenceRole]);

  const [localPreferences, setLocalPreferences] = useState<NotificationPrefRow[]>(() =>
    buildDefaultPreferences(eventTypes)
  );
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>(NotificationChannel.Email);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const previousChannelIndexRef = useRef<number>(0);

  const { data, loading, error } = useQuery(notificationPreferencesQueryDocument, {
    skip: !isActive,
    fetchPolicy: "cache-and-network",
  });

  const [updatePreferences, { loading: saving }] = useMutation(updateNotificationPreferencesMutationDocument);

  useEffect(() => {
    if (data?.notificationPreferences) {
      setLocalPreferences(data.notificationPreferences);
      pendingChangesRef.current.clear();
      return;
    }
    setLocalPreferences(buildDefaultPreferences(eventTypes));
  }, [data?.notificationPreferences, eventTypes]);

  const preferenceMap = useMemo(() => buildPreferenceMap(localPreferences), [localPreferences]);
  const matrixRows = useMemo(() => buildPreferenceMatrixRows(preferenceMap, eventTypes), [preferenceMap, eventTypes]);

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
      setSnackbarMessage(labels.saved);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (saveError) {
      logger.error("Failed to save notification preferences", { error: saveError });
      setSnackbarMessage(labels.errorSaving);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [labels, updatePreferences]);

  const debouncedSave = useDebouncedCallback(() => {
    void flushPendingChanges();
  }, 500);

  const handleToggle = useCallback(
    (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => {
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

  const handleChannelChange = useCallback((channel: NotificationChannel, direction: "left" | "right") => {
    const nextIndex = NOTIFICATION_CHANNELS.indexOf(channel);
    previousChannelIndexRef.current = nextIndex;
    setSlideDirection(direction);
    setActiveChannel(channel);
  }, []);

  return {
    labels,
    preferences: localPreferences,
    preferenceMap,
    matrixRows,
    eventTypes,
    onToggle: handleToggle,
    disabled: saving,
    loading,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onSnackbarClose: handleSnackbarClose,
    errorLoading: Boolean(error),
    activeChannel,
    slideDirection,
    onChannelChange: handleChannelChange,
  };
}
