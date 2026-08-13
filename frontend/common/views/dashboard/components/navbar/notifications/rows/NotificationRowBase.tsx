"use client";

import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { RowMarkReadAction } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/RowMarkReadAction";
import type { NotificationDrawerAlert } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

export interface NotificationRowBaseProps {
  readonly alert: NotificationDrawerAlert;
  readonly markReadLabel: string;
  readonly icon: ReactNode;
  readonly iconColor?: (theme: Theme) => string;
  readonly accentColor?: (theme: Theme) => string;
  readonly titleOverride?: ReactNode;
  readonly bodyOverride?: ReactNode;
  readonly secondaryActions?: ReactNode;
  readonly onMarkRead?: (deliveryId: string) => void;
  readonly onViewEntity?: (metadata: NotificationMetadata) => void;
}

export function NotificationRowBase({
  alert,
  markReadLabel,
  icon,
  iconColor,
  accentColor,
  titleOverride,
  bodyOverride,
  secondaryActions,
  onMarkRead,
  onViewEntity,
}: Readonly<NotificationRowBaseProps>) {
  const isUnread = alert.readAt == null;
  const resolvedAccent = accentColor ?? iconColor ?? (theme => theme.palette.primary.main);
  const resolvedIconColor = iconColor ?? resolvedAccent;
  const hasEntityNavigation = alert.metadata != null && onViewEntity != null;

  const handleRowClick = () => {
    if (hasEntityNavigation && alert.metadata) {
      onViewEntity(alert.metadata);
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <RequirePermission permissions={[AppPermission.NotificationViewAlerts]} fallback={null}>
          <RowMarkReadAction
            markReadLabel={markReadLabel}
            deliveryId={alert.deliveryId}
            readAt={alert.readAt}
            onMarkRead={onMarkRead}
          />
        </RequirePermission>
      }
    >
      <ListItemButton
        onClick={hasEntityNavigation ? handleRowClick : undefined}
        sx={theme => ({
          py: 1,
          opacity: isUnread ? 1 : 0.7,
          borderLeft: `4px solid ${resolvedAccent(theme)}`,
          alignItems: "flex-start",
        })}
      >
        <ListItemIcon
          sx={theme => ({
            minWidth: 36,
            mt: 0.25,
            color: resolvedIconColor(theme),
          })}
        >
          {icon}
        </ListItemIcon>

        <ListItemText
          primary={titleOverride ?? alert.title}
          secondary={
            <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {(bodyOverride ?? alert.body) ? (
                <Box
                  component="span"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {bodyOverride ?? alert.body}
                </Box>
              ) : null}
              {secondaryActions}
            </Box>
          }
          slotProps={{
            primary: {
              variant: "body2",
              sx: theme => ({
                fontWeight: isUnread ? 700 : 500,
                color: theme.palette.text.primary,
              }),
            },
            secondary: {
              variant: "caption",
              sx: theme => ({ color: theme.palette.text.secondary }),
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
