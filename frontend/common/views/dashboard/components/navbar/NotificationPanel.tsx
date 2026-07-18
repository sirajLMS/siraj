"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  DoneAllOutlined,
  ErrorOutlined,
  InfoOutlined,
  NotificationsOutlined,
  WarningOutlined,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  markNotificationsReadMutationDocument,
  notificationAlertsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";
import { logger } from "@/frontend/common/utils/logger";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { UnpaidInvoicesSection } from "@/frontend/common/views/dashboard/components/navbar/UnpaidInvoicesSection";
import { useAppTranslation } from "@/shared/locale/client";

function getSeverityColor(
  severity: string | null | undefined,
  theme: { palette: { error: { main: string }; warning: { main: string }; info: { main: string } } }
) {
  if (severity === "error") return theme.palette.error.main;
  if (severity === "warning") return theme.palette.warning.main;
  return theme.palette.info.main;
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "error":
      return <ErrorOutlined fontSize="small" />;
    case "warning":
      return <WarningOutlined fontSize="small" />;
    default:
      return <InfoOutlined fontSize="small" />;
  }
}

export function NotificationPanel() {
  const t = useAppTranslation().dashboardTranslations.coreNotifications;
  const { data, loading, error } = useQuery(notificationAlertsQueryDocument);

  const unreadCount = data?.notificationAlerts?.unreadCount ?? 0;

  const [markRead, { loading: markingRead }] = useMutation(markNotificationsReadMutationDocument, {
    refetchQueries: [{ query: notificationAlertsQueryDocument }],
    onCompleted: () => {
      logger.debug("NotificationPanel markNotificationsRead completed");
    },
    onError: err => {
      logger.warn("NotificationPanel markNotificationsRead failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.error.main })}>
          {t.errorLoading}
        </Typography>
      </Box>
    );
  }

  const alerts = data?.notificationAlerts?.alerts ?? [];
  const markReadDisabled = unreadCount === 0 || markingRead || loading;

  const handleMarkAllRead = async () => {
    try {
      await markRead();
    } catch (mutationError) {
      logger.warn("NotificationPanel markRead threw", {
        error: mutationError instanceof Error ? mutationError.message : String(mutationError),
      });
    }
  };

  return (
    <Box sx={{ width: 360, maxHeight: 480, overflowY: "auto" }}>
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              sx={theme => ({
                backgroundColor: theme.palette.error.main,
                color: theme.palette.onError,
                px: 1,
                py: 0.25,
                borderRadius: 1,
              })}
            >
              {unreadCount}
            </Typography>
          )}

          <Tooltip title={t.title}>
            <IconButton
              aria-label={t.title}
              disabled={markReadDisabled}
              onClick={handleMarkAllRead}
              size="small"
              sx={theme => ({ color: theme.palette.onSurface })}
            >
              <DoneAllOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      <DisplayCurrencyHint variant="compact" />

      <RequirePermission permissions={[AppPermission.BillingViewUnpaidInvoices]}>
        <UnpaidInvoicesSection />
        <Divider />
      </RequirePermission>

      {alerts.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <NotificationsOutlined sx={{ fontSize: 40, opacity: 0.4 }} />
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mt: 1 })}>
            {t.noAlerts}
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {alerts.map(alert => (
            <ListItem key={alert.id} disablePadding>
              <ListItemButton sx={{ py: 1 }}>
                <ListItemIcon
                  sx={theme => ({
                    minWidth: 36,
                    color: getSeverityColor(alert.severity, theme),
                  })}
                >
                  {getSeverityIcon(alert.severity ?? "info")}
                </ListItemIcon>
                <ListItemText
                  primary={alert.title}
                  secondary={alert.body ?? undefined}
                  slotProps={{
                    primary: { variant: "body2", sx: { fontWeight: 500 } },
                    secondary: {
                      variant: "caption",
                      sx: {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
