"use client";

import {
  Box,
  Paper,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import {
  buildPreferenceMap,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
} from "./notificationPreferenceTypes";

type PreferencesMatrixProps = {
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (
    channel: Types.NotificationChannel,
    eventType: Types.NotificationEventType,
    enabled: boolean
  ) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
};

function MatrixSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Skeleton variant="rounded" height={48} />
      {["row-a", "row-b", "row-c", "row-d"].map(id => (
        <Skeleton key={id} variant="rounded" height={56} />
      ))}
    </Box>
  );
}

export function PreferencesMatrix({
  preferences,
  onToggle,
  disabled = false,
  loading = false,
}: PreferencesMatrixProps) {
  const t = useTranslations("profile.notifications");
  const preferenceMap = buildPreferenceMap(preferences);

  if (loading && preferences.length === 0) {
    return <MatrixSkeleton />;
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={theme => ({
        borderRadius: 2,
        borderColor: theme.palette.divider,
      })}
    >
      <Table size="small" aria-label={t("title")}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, minWidth: 160 }} />
            {NOTIFICATION_EVENT_TYPES.map(eventType => (
              <TableCell key={eventType} align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                <Typography sx={{ typography: "labelSm" }}>{t(`events.${eventType}`)}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {NOTIFICATION_CHANNELS.map(channel => (
            <TableRow key={channel}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                <Typography sx={{ typography: "bodyMd" }}>{t(`channels.${channel}`)}</Typography>
              </TableCell>
              {NOTIFICATION_EVENT_TYPES.map(eventType => {
                const pref = preferenceMap.get(`${channel}:${eventType}`);
                const enabled = pref?.enabled ?? true;
                const channelLabel = t(`channels.${channel}`);
                const eventLabel = t(`events.${eventType}`);
                const ariaLabel = `${channelLabel} — ${eventLabel}`;

                return (
                  <TableCell key={`${channel}-${eventType}`} align="center">
                    <Switch
                      checked={enabled}
                      disabled={disabled}
                      slotProps={{
                        input: {
                          "aria-label": ariaLabel,
                        },
                      }}
                      onChange={(_, checked) => {
                        onToggle(channel, eventType, checked);
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
