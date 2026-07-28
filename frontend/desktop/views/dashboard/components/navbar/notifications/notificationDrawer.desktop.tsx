"use client";

import { CloseOutlined, DoneAllOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, Drawer, IconButton, List, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { NotificationDrawerEmptyState } from "@/frontend/common/views/dashboard/components/navbar/notifications/emptyState";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";

const DRAWER_WIDTH_PX = 420;

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
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
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

export function NotificationDrawerDesktop({ vm }: Readonly<NotificationDrawerProps>) {
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
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{
        paper: {
          sx: {
            width: DRAWER_WIDTH_PX,
            maxWidth: "100vw",
          },
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
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : null}

          {error ? (
            <Typography
              variant="body2"
              sx={{ color: (theme: Theme) => theme.palette.error.main, textAlign: "center", py: 4, px: 2 }}
            >
              {errorLoadingMessage}
            </Typography>
          ) : null}

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
