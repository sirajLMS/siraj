"use client";

import { CloseOutlined, DoneAllOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, Drawer, IconButton, List, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { NotificationDrawerEmptyState } from "@/frontend/common/views/dashboard/components/navbar/notifications/emptyState";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";
import { useAppTranslation } from "@/shared/locale/client";

function DrawerHeader({
  title,
  subtitle,
  onClose,
  onManagePreferences,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly onClose: () => void;
  readonly onManagePreferences: () => void;
}) {
  const t = useAppTranslation().notificationsTranslations;

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
      <IconButton aria-label={t.managePreferences} onClick={onManagePreferences} size="small">
        <SettingsOutlined />
      </IconButton>
      <IconButton aria-label={title} onClick={onClose} size="small">
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

export function NotificationDrawerMobile({ vm }: Readonly<NotificationDrawerProps>) {
  const t = useAppTranslation().notificationsTranslations;
  const tCore = useAppTranslation().dashboardTranslations.coreNotifications;
  const { drawerOpen, closeDrawer, alerts, unreadCount, loading, error, markAllRead, handleManagePreferences } = vm;

  return (
    <Drawer
      anchor="bottom"
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: "100vw",
            height: "85vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHeader
          title={t.drawerTitle}
          subtitle={t.unreadCount(unreadCount)}
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
              {tCore.errorLoading}
            </Typography>
          ) : null}

          {!loading && !error && alerts.length === 0 ? <NotificationDrawerEmptyState /> : null}

          {!loading && !error && alerts.length > 0 ? (
            <List disablePadding>
              {alerts.map(alert => (
                <NotificationDrawerRow key={alert.id ?? `alert-${alert.deliveryId}`} alert={alert} vm={vm} />
              ))}
            </List>
          ) : null}
        </Box>

        <Divider />
        <Box sx={{ p: 2, pb: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DoneAllOutlined />}
            disabled={unreadCount === 0 || loading}
            onClick={() => {
              void markAllRead();
            }}
          >
            {t.markAllRead}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
