"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  NotificationChannel,
  type NotificationEventType,
  type NotificationPreferenceInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildCategoryRows,
  type NotificationPrefRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import {
  buildDefaultPreferences,
  buildPreferenceMap,
  buildPreferenceMatrixRows,
  CHANNEL_ORDER,
  preferenceKey,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";

export type PendingChange = NotificationPreferenceInput;

export function usePendingChanges() {
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

export function usePreferenceState(eventTypes: readonly NotificationEventType[]) {
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

export function useDerivedPreferences(
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

export function useChannelNavigation() {
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
