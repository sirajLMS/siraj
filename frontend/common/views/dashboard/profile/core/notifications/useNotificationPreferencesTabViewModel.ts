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
  buildCategoryRows,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES_BY_CATEGORY,
  type NotificationEventCategory,
  type NotificationPreferencesTabVariantProps,
  type NotificationPrefRow,
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

export type NotificationPreferencesTabViewModel = NotificationPreferencesTabVariantProps;

function usePendingChanges() {
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map());

  const addPendingChange = useCallback((key: string, change: PendingChange) => {
    pendingChangesRef.current.set(key, change);
  }, []);

  const clearPendingChanges = useCallback(() => {
    pendingChangesRef.current.clear();
  }, []);

  const getPendingChanges = useCallback(() => {
    return Array.from(pendingChangesRef.current.values());
  }, []);

  return { addPendingChange, clearPendingChanges, getPendingChanges };
}

function usePreferenceState(eventTypes: readonly NotificationEventType[]) {
  const [localPreferences, setLocalPreferences] = useState<NotificationPrefRow[]>(() =>
    buildDefaultPreferences(CHANNEL_ORDER, eventTypes)
  );

  const resetPreferences = useCallback(
    (preferences?: NotificationPrefRow[]) => {
      setLocalPreferences(preferences ?? buildDefaultPreferences(CHANNEL_ORDER, eventTypes));
    },
    [eventTypes]
  );

  const updatePreferenceEnabled = useCallback((key: string, enabled: boolean) => {
    setLocalPreferences(current =>
      current.map(pref =>
        pref.channel && pref.eventType && preferenceKey(pref.channel, pref.eventType) === key
          ? { ...pref, enabled }
          : pref
      )
    );
  }, []);

  const updateCategoryPreferences = useCallback(
    (categoryEventTypes: readonly NotificationEventType[], enabled: boolean) => {
      setLocalPreferences(current =>
        current.map(pref => {
          if (pref.eventType && categoryEventTypes.includes(pref.eventType)) {
            return { ...pref, enabled };
          }
          return pref;
        })
      );
    },
    []
  );

  return {
    localPreferences,
    resetPreferences,
    updatePreferenceEnabled,
    updateCategoryPreferences,
  };
}

function useDerivedPreferences(
  localPreferences: readonly NotificationPrefRow[],
  eventTypes: readonly NotificationEventType[]
) {
  const preferenceMap = useMemo(() => buildPreferenceMap(localPreferences), [localPreferences]);
  const matrixRows = useMemo(
    () => buildPreferenceMatrixRows(preferenceMap, eventTypes, CHANNEL_ORDER),
    [preferenceMap, eventTypes]
  );
  const categoryRows = useMemo(() => buildCategoryRows(eventTypes, preferenceMap), [eventTypes, preferenceMap]);
  return { preferenceMap, matrixRows, categoryRows };
}

function useNotificationSave(
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

function useChannelNavigation() {
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>(NotificationChannel.Email);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const previousChannelIndexRef = useRef<number>(0);

  const handleChannelChange = useCallback((channel: NotificationChannel, direction: "left" | "right") => {
    const nextIndex = CHANNEL_ORDER.indexOf(channel);
    previousChannelIndexRef.current = nextIndex;
    setSlideDirection(direction);
    setActiveChannel(channel);
  }, []);

  return {
    activeChannel,
    slideDirection,
    handleChannelChange,
  };
}

function useNotificationPreferenceHandlers(
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

export function useNotificationPreferencesTabViewModel(
  props: Readonly<NotificationPreferencesTabProps>
): NotificationPreferencesTabViewModel {
  const { isActive } = props;
  const labels = useAppTranslation(Translation.Profile.Notifications);
  const viewerRole = useUserStore(state => state.role);

  const preferenceRole = useMemo(() => resolveNotificationPreferenceRole({ role: viewerRole }), [viewerRole]);
  const eventTypes = useMemo(() => getNotificationEventTypesForRole(preferenceRole), [preferenceRole]);

  const { addPendingChange, clearPendingChanges, getPendingChanges } = usePendingChanges();
  const { localPreferences, resetPreferences, updatePreferenceEnabled, updateCategoryPreferences } =
    usePreferenceState(eventTypes);

  const { data, loading, error } = useQuery(notificationPreferencesQueryDocument, {
    skip: !isActive,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data?.notificationPreferences) {
      resetPreferences(data.notificationPreferences);
      clearPendingChanges();
      return;
    }
    resetPreferences();
  }, [data?.notificationPreferences, resetPreferences, clearPendingChanges]);

  const { preferenceMap, matrixRows, categoryRows } = useDerivedPreferences(localPreferences, eventTypes);

  const { saving, snackbarOpen, snackbarMessage, snackbarSeverity, handleSnackbarClose, debouncedSave } =
    useNotificationSave(labels, clearPendingChanges, getPendingChanges);

  const { handleToggle, handleCategoryToggle } = useNotificationPreferenceHandlers(
    updatePreferenceEnabled,
    updateCategoryPreferences,
    addPendingChange,
    debouncedSave
  );

  const { activeChannel, slideDirection, handleChannelChange } = useChannelNavigation();

  return {
    labels,
    preferences: localPreferences,
    preferenceMap,
    matrixRows,
    categoryRows,
    eventTypes,
    onToggle: handleToggle,
    onCategoryToggle: handleCategoryToggle,
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
