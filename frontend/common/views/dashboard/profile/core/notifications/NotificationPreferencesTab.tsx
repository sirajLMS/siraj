"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
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
import { useAppTranslation } from "@/shared/locale";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

type PendingChange = NotificationPreferenceInput;

const lazyViews = createLazyView<NotificationPreferencesTabVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/notifications/notificationPreferencesTab.mobile").then(
      m => ({
        default: m.NotificationPreferencesTabMobile,
      })
    ),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/notifications/notificationPreferencesTab.desktop").then(
      m => ({ default: m.NotificationPreferencesTabDesktop })
    )
);

export function NotificationPreferencesTab({ isActive }: Readonly<NotificationPreferencesTabProps>) {
  const t = useAppTranslation().profileTranslations.notifications;
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
  // NEW FOR PLAN v5: channel-tab selection state lifted from the mobile
  // tier so the mobile tier stays pure (no `useState` / `useRef`). The
  // desktop matrix variant simply ignores these props.
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

  // NEW FOR PLAN v5: pre-computed lookup map for the mobile tier so the
  // tier view stays render-only (no `buildPreferenceMap` call inside tier).
  const preferenceMap = useMemo(() => buildPreferenceMap(localPreferences), [localPreferences]);

  // NEW FOR PLAN v5: pre-shaped desktop matrix rows lifted out of the
  // desktop tier (specs.md §6.1 — ViewModel owns data shaping).
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

  // NEW FOR PLAN v5: handler lifted from the mobile tier; computes the
  // slide direction and updates the active channel state.
  const handleChannelChange = useCallback((channel: NotificationChannel, direction: "left" | "right") => {
    const nextIndex = NOTIFICATION_CHANNELS.indexOf(channel);
    previousChannelIndexRef.current = nextIndex;
    setSlideDirection(direction);
    setActiveChannel(channel);
  }, []);

  const variantProps: NotificationPreferencesTabVariantProps = {
    preferences: localPreferences,
    // NEW FOR PLAN v5: pre-computed lookup map for the mobile tier so it no
    // longer calls `buildPreferenceMap` inside the tier (specs.md §6.1).
    preferenceMap,
    // NEW FOR PLAN v5: pre-shaped desktop matrix rows lifted out of the
    // desktop tier (specs.md §6.1 — ViewModel owns data shaping).
    matrixRows,
    // Role-filtered event types — mobile should iterate these instead of
    // the full NOTIFICATION_EVENT_TYPES catalog.
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

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
