"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  NotificationChannel,
  type NotificationEventType,
  type NotificationPreferenceInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  NotificationPreferencesTabVariantProps,
  NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import {
  buildDefaultPreferences,
  buildPreferenceMap,
  buildPreferenceMatrixRows,
  CHANNEL_ORDER,
  getNotificationEventTypesForRole,
  preferenceKey,
  resolveNotificationPreferenceRole,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

type PendingChange = NotificationPreferenceInput;
type PendingChangeArray = NotificationPreferenceInput[];

export type NotificationPreferencesTabViewModel = NotificationPreferencesTabVariantProps;

function useInitialPreferences(eventTypes: readonly NotificationEventType[]) {
  return useState<NotificationPrefRow[]>(() => buildDefaultPreferences(CHANNEL_ORDER, eventTypes));
}

function usePreferenceSync(
  data: Operations.NotificationPreferencesQuery | undefined,
  eventTypes: readonly NotificationEventType[],
  setLocalPreferences: React.Dispatch<React.SetStateAction<NotificationPrefRow[]>>,
  pendingChangesRef: React.MutableRefObject<Map<string, PendingChange>>
) {
  useEffect(() => {
    if (data?.notificationPreferences) {
      setLocalPreferences(data.notificationPreferences);
      pendingChangesRef.current.clear();
      return;
    }
    setLocalPreferences(buildDefaultPreferences(CHANNEL_ORDER, eventTypes));
  }, [data?.notificationPreferences, eventTypes, setLocalPreferences, pendingChangesRef]);
}

function useDerivedState(localPreferences: NotificationPrefRow[], eventTypes: readonly NotificationEventType[]) {
  const preferenceMap = useMemo(() => buildPreferenceMap(localPreferences), [localPreferences]);
  const matrixRows = useMemo(
    () => buildPreferenceMatrixRows(preferenceMap, eventTypes, CHANNEL_ORDER),
    [preferenceMap, eventTypes]
  );
  return { preferenceMap, matrixRows };
}

function useFlushPendingChanges(
  labels: ProfileNotificationsLabels,
  updatePreferences: ReturnType<
    typeof useMutation<
      Operations.UpdateNotificationPreferencesMutation,
      Operations.UpdateNotificationPreferencesMutationVariables
    >
  >[0],
  pendingChangesRef: React.MutableRefObject<Map<string, PendingChange>>,
  setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>,
  setSnackbarSeverity: React.Dispatch<React.SetStateAction<"success" | "error">>,
  setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  return useCallback(async () => {
    const pending = Array.from(pendingChangesRef.current.values());
    if (pending.length === 0) {
      return;
    }

    try {
      await updatePreferences({
        variables: { input: pending as PendingChangeArray },
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
  }, [labels, updatePreferences, pendingChangesRef, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);
}

function useHandleToggle(
  debouncedSave: () => void,
  pendingChangesRef: React.MutableRefObject<Map<string, PendingChange>>,
  setLocalPreferences: React.Dispatch<React.SetStateAction<NotificationPrefRow[]>>
) {
  return useCallback(
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
    [debouncedSave, pendingChangesRef, setLocalPreferences]
  );
}

function useHandleSnackbarClose(setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  return useCallback(() => {
    setSnackbarOpen(false);
  }, [setSnackbarOpen]);
}

function useHandleChannelChange(
  previousChannelIndexRef: React.MutableRefObject<number>,
  setSlideDirection: React.Dispatch<React.SetStateAction<"left" | "right">>,
  setActiveChannel: React.Dispatch<React.SetStateAction<NotificationChannel>>
) {
  return useCallback(
    (channel: NotificationChannel, direction: "left" | "right") => {
      const nextIndex = CHANNEL_ORDER.indexOf(channel);
      previousChannelIndexRef.current = nextIndex;
      setSlideDirection(direction);
      setActiveChannel(channel);
    },
    [previousChannelIndexRef, setSlideDirection, setActiveChannel]
  );
}

export function useNotificationPreferencesTabViewModel(
  props: Readonly<NotificationPreferencesTabProps>
): NotificationPreferencesTabViewModel {
  const { isActive } = props;
  const labels = useAppTranslation(Translation.Profile.Notifications);
  const viewerRole = useUserStore(state => state.role);

  const preferenceRole = useMemo(() => resolveNotificationPreferenceRole({ role: viewerRole }), [viewerRole]);
  const eventTypes = useMemo(() => getNotificationEventTypesForRole(preferenceRole), [preferenceRole]);

  const [localPreferences, setLocalPreferences] = useInitialPreferences(eventTypes);
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

  const [updatePreferencesRaw, { loading: saving }] = useMutation(updateNotificationPreferencesMutationDocument);
  const updatePreferences = updatePreferencesRaw as ReturnType<
    typeof useMutation<
      Operations.UpdateNotificationPreferencesMutation,
      Operations.UpdateNotificationPreferencesMutationVariables
    >
  >[0];

  usePreferenceSync(data, eventTypes, setLocalPreferences, pendingChangesRef);

  const { preferenceMap, matrixRows } = useDerivedState(localPreferences, eventTypes);

  const flushPendingChanges = useFlushPendingChanges(
    labels,
    updatePreferences,
    pendingChangesRef,
    setSnackbarMessage,
    setSnackbarSeverity,
    setSnackbarOpen
  );

  const debouncedSave = useDebouncedCallback(() => {
    void flushPendingChanges();
  }, 500);

  const handleToggle = useHandleToggle(debouncedSave, pendingChangesRef, setLocalPreferences);
  const handleSnackbarClose = useHandleSnackbarClose(setSnackbarOpen);
  const handleChannelChange = useHandleChannelChange(previousChannelIndexRef, setSlideDirection, setActiveChannel);

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
