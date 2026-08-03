"use client";

import { Box, Switch, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { NotificationChannel, type NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  CategoryRow,
  NotificationEventCategory,
  PreferenceMatrixRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

interface PreferencesMatrixDesktopViewProps {
  readonly labels: ProfileNotificationsLabels;
  // Pre-shaped matrix rows lifted out of the desktop tier — data-shaping
  // belongs in the ViewModel. The tier view only consumes them.
  readonly matrixRows: readonly PreferenceMatrixRow[];
  /** Category grouping rows — one per category for master mute toggles above the grid. */
  readonly categoryRows?: readonly CategoryRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
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

export function PreferencesMatrixDesktopView({
  labels,
  matrixRows,
  categoryRows,
  onToggle,
  onCategoryToggle,
  disabled = false,
  loading = false,
}: Readonly<PreferencesMatrixDesktopViewProps>) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoize the columns array so the DataGrid keeps stable column identity across prop-driven row updates; MUI X DataGrid re-runs row-height calc and virtualization when the columns reference changes, so an inline array would force re-layout on every parent re-render. Memo keys (`labels`, `disabled`, `onToggle`) all come from container props; inline cells would rebuild the render tree each render.
  const columns = useMemo<GridColDef<PreferenceMatrixRow>[]>(() => {
    const eventLabels = labels.events as Record<string, string>;
    const getEventLabel = (eventType: NotificationEventType): string => eventLabels[eventType] ?? eventType;

    const channelColumns: GridColDef<PreferenceMatrixRow>[] = Object.values(NotificationChannel).map(channel => ({
      field: channel,
      headerName: labels.channels[channel],
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
            channelLabel={labels.channels[channel]}
            eventLabel={getEventLabel(row.eventType)}
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
          return <EventTypeCell label={getEventLabel(row.eventType)} />;
        },
      },
      ...channelColumns,
    ];
  }, [labels, disabled, onToggle]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Category-level master toggles */}
      {categoryRows?.length ? (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          {categoryRows.map(catRow => {
            const categoryLabel = labels.categories?.[catRow.category] ?? catRow.category;
            return (
              <Box key={catRow.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Switch
                  checked={catRow.anyEnabled}
                  disabled={disabled}
                  onChange={(_, checked) => {
                    onCategoryToggle?.(catRow.category, checked);
                  }}
                  slotProps={{
                    input: { "aria-label": categoryLabel },
                  }}
                />
                <Typography sx={{ typography: "labelMd", fontWeight: 600 }}>{categoryLabel}</Typography>
              </Box>
            );
          })}
        </Box>
      ) : null}
      <DesktopAppDataGrid<PreferenceMatrixRow>
        rows={matrixRows}
        columns={columns}
        getRowId={row => row.id}
        loading={loading && matrixRows.length === 0}
        paginationOptions={false}
        autoHeight
        ariaLabel={labels.title}
      />
    </Box>
  );
}
