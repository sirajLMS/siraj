"use client";

import { FormControlLabel, Switch, Typography } from "@mui/material";
import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NotificationChannelAccent } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferencesConstants";
import type {
  CategoryRow,
  NotificationEventCategory,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";

interface CategoryToggleRowProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly catRow: CategoryRow;
  readonly categoryLabel: string;
  readonly disabled: boolean;
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
}

export function CategoryToggleRow({
  activeChannel,
  activeAccent,
  catRow,
  categoryLabel,
  disabled,
  onCategoryToggle,
}: Readonly<CategoryToggleRowProps>) {
  return (
    <FormControlLabel
      key={`cat-${activeChannel}-${catRow.category}`}
      control={
        <Switch
          color={activeAccent}
          checked={catRow.anyEnabled}
          disabled={disabled}
          onChange={(_, checked) => {
            onCategoryToggle?.(catRow.category, checked);
          }}
        />
      }
      label={<Typography sx={{ typography: "labelMd", fontWeight: 700 }}>{categoryLabel}</Typography>}
      labelPlacement="start"
      sx={theme => ({
        mx: 0,
        px: 2,
        py: 1.5,
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: theme.palette.action.selected,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    />
  );
}

interface EventToggleRowProps {
  readonly activeChannel: NotificationChannel;
  readonly activeAccent: NotificationChannelAccent;
  readonly eventType: NotificationEventType;
  readonly enabled: boolean;
  readonly disabled: boolean;
  readonly index: number;
  readonly label: string;
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
}

export function EventToggleRow({
  activeChannel,
  activeAccent,
  eventType,
  enabled,
  disabled,
  index,
  label,
  onToggle,
}: Readonly<EventToggleRowProps>) {
  return (
    <FormControlLabel
      key={`${activeChannel}-${eventType}`}
      control={
        <Switch
          color={activeAccent}
          checked={enabled}
          disabled={disabled}
          onChange={(_, checked) => {
            onToggle(activeChannel, eventType, checked);
          }}
        />
      }
      label={<Typography sx={{ typography: "bodyMd" }}>{label}</Typography>}
      labelPlacement="start"
      sx={theme => ({
        mx: 0,
        px: 2,
        py: 1.75,
        pl: 4,
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: index % 2 === 1 ? theme.palette.action.hover : "transparent",
      })}
    />
  );
}
