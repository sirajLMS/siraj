"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { notificationPreferencesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import {
  getNotificationEventTypesForRole,
  resolveNotificationPreferenceRole,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import {
  useChannelNavigation,
  useDerivedPreferences,
  usePendingChanges,
  usePreferenceState,
} from "@/frontend/common/views/dashboard/profile/core/notifications/useNotificationPreferencesTabViewModel.hooks";
import {
  useNotificationPreferenceHandlers,
  useNotificationSave,
} from "@/frontend/common/views/dashboard/profile/core/notifications/useNotificationPreferencesTabViewModel.save";
import { Translation, useAppTranslation } from "@/shared/locale";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

export type NotificationPreferencesTabViewModel = NotificationPreferencesTabVariantProps;

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
