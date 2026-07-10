"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Snackbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
  preferenceKey,
} from "@/frontend/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesChannelTabs } from "@/frontend/views/dashboard/profile/core/notifications/PreferencesChannelTabs";
import { PreferencesMatrix } from "@/frontend/views/dashboard/profile/core/notifications/PreferencesMatrix";

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

export function NotificationPreferencesTab({ isActive }: NotificationPreferencesTabProps) {
  const t = useTranslations("profile.notifications");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
      setSnackbarMessage(t("saved"));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (saveError) {
      logger.error("Failed to save notification preferences", { error: saveError });
      setSnackbarMessage(t("errorSaving"));
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

  if (error) {
    return <Typography sx={{ typography: "bodyMd", color: theme.palette.error.main }}>{t("errorLoading")}</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography sx={{ typography: "titleLg", mb: 1 }}>{t("title")}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme.palette.text.secondary }}>{t("description")}</Typography>
      </Box>

      {isMobile ? (
        <PreferencesChannelTabs
          preferences={localPreferences}
          onToggle={handleToggle}
          disabled={saving}
          loading={loading}
        />
      ) : (
        <PreferencesMatrix preferences={localPreferences} onToggle={handleToggle} disabled={saving} loading={loading} />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
