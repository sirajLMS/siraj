"use client";

import { Switch, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  buildPreferenceMap,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
} from "@/frontend/views/dashboard/profile/core/notifications/notificationPreferenceTypes";

type PreferencesMatrixProps = {
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
};

interface PreferenceMatrixRow {
  readonly id: string;
  readonly eventType: NotificationEventType;
  readonly enabledMap: Record<string, boolean>;
}

interface ChannelCellProps {
  readonly row: PreferenceMatrixRow;
  readonly channel: NotificationChannel;
  readonly disabled: boolean;
  readonly channelLabel: string;
  readonly eventLabel: string;
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
}

function ChannelSwitchCell({ row, channel, disabled, channelLabel, eventLabel, onToggle }: Readonly<ChannelCellProps>) {
  const enabled = row.enabledMap[channel] ?? true;
  const ariaLabel = `${channelLabel} — ${eventLabel}`;

  return (
    <Switch
      checked={enabled}
      disabled={disabled}
      slotProps={{
        input: {
          "aria-label": ariaLabel,
        },
      }}
      onChange={(_, checked) => {
        onToggle(channel, row.eventType, checked);
      }}
    />
  );
}

interface EventTypeCellProps {
  readonly label: string;
}

function EventTypeCell({ label }: Readonly<EventTypeCellProps>) {
  return <Typography sx={{ fontWeight: 600, typography: "bodyMd" }}>{label}</Typography>;
}

export function PreferencesMatrix({
  preferences,
  onToggle,
  disabled = false,
  loading = false,
}: Readonly<PreferencesMatrixProps>) {
  const t = useTranslations("profile.notifications");
  const preferenceMap = buildPreferenceMap(preferences);

  const rows = useMemo<PreferenceMatrixRow[]>(() => {
    return NOTIFICATION_EVENT_TYPES.map(eventType => {
      const enabledMap: Record<string, boolean> = {};
      for (const channel of NOTIFICATION_CHANNELS) {
        const pref = preferenceMap.get(`${channel}:${eventType}`);
        enabledMap[channel] = pref?.enabled ?? true;
      }
      return { id: eventType, eventType, enabledMap };
    });
  }, [preferenceMap]);

  const columns = useMemo<GridColDef<PreferenceMatrixRow>[]>(() => {
    const channelColumns: GridColDef<PreferenceMatrixRow>[] = NOTIFICATION_CHANNELS.map(channel => ({
      field: channel,
      headerName: t(`channels.${channel}`),
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: params => {
        const row = params.row as PreferenceMatrixRow;
        return (
          <ChannelSwitchCell
            row={row}
            channel={channel}
            disabled={disabled}
            channelLabel={t(`channels.${channel}`)}
            eventLabel={t(`events.${row.eventType}`)}
            onToggle={onToggle}
          />
        );
      },
    }));

    return [
      {
        field: "eventType",
        headerName: "",
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: params => {
          const row = params.row as PreferenceMatrixRow;
          return <EventTypeCell label={t(`events.${row.eventType}`)} />;
        },
      },
      ...channelColumns,
    ];
  }, [t, disabled, onToggle]);

  return (
    <AppDataGrid<PreferenceMatrixRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      loading={loading && preferences.length === 0}
      hideFooter
      autoHeight
      ariaLabel={t("title")}
    />
  );
}
