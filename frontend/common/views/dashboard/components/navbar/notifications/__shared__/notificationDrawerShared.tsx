"use client";

import { CloseOutlined, DoneAllOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, Button, Divider, Drawer, IconButton, List, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { NotificationDrawerEmptyState } from "@/frontend/common/views/dashboard/components/navbar/notifications/emptyState";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";

export interface NotificationDrawerSharedOptions {
  readonly anchor: "right" | "left" | "top" | "bottom";
  readonly paperSx: SxProps<Theme>;
}

function DrawerHeader({
  title,
  subtitle,
  managePreferencesLabel,
  onClose,
  onManagePreferences,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly managePreferencesLabel: string;
  readonly onClose: () => void;
  readonly onManagePreferences: () => void;
}) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="titleLg" sx={{ color: (theme: Theme) => theme.palette.primary.main }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: (theme: Theme) => theme.palette.text.secondary }}>
          {subtitle}
        </Typography>
      </Box>
      <IconButton aria-label={managePreferencesLabel} onClick={onManagePreferences} size="small">
        <SettingsOutlined />
      </IconButton>
      <IconButton aria-label={title} onClick={onClose} size="small">
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

export function NotificationDrawerShared({
  vm,
  options,
}: Readonly<NotificationDrawerProps & { readonly options: NotificationDrawerSharedOptions }>) {
  const {
    labels,
    errorLoadingMessage,
    drawerOpen,
    closeDrawer,
    alerts,
    unreadCount,
    loading,
    error,
    markAllRead,
    handleManagePreferences,
  } = vm;

  return (
    <Drawer
      anchor={options.anchor}
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{
        paper: {
          sx: options.paperSx,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHeader
          title={labels.drawerTitle}
          subtitle={labels.unreadCount(unreadCount)}
          managePreferencesLabel={labels.managePreferences}
          onClose={closeDrawer}
          onManagePreferences={handleManagePreferences}
        />

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loading ? <LoadingState size={32} embedded /> : null}

          {error ? <ErrorState embedded message={errorLoadingMessage} /> : null}

          {!loading && !error && alerts.length === 0 ? (
            <NotificationDrawerEmptyState emptyMessage={labels.noNotifications} />
          ) : null}

          {!loading && !error && alerts.length > 0 ? (
            <List disablePadding>
              {alerts.map(alert => (
                <NotificationDrawerRow key={alert.id ?? `alert-${alert.deliveryId}`} alert={alert} vm={vm} />
              ))}
            </List>
          ) : null}
        </Box>

        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DoneAllOutlined />}
            disabled={unreadCount === 0 || loading}
            onClick={() => {
              void markAllRead();
            }}
          >
            {labels.markAllRead}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
