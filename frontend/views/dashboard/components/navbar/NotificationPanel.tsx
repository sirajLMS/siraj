"use client";

import { useQuery } from "@apollo/client/react";
import { ErrorOutlined, InfoOutlined, NotificationsOutlined, WarningOutlined } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { notificationAlertsQueryDocument } from "@/frontend/graphql/sharedDocuments/notification-alerts.documents";
import { UnpaidInvoicesSection } from "./UnpaidInvoicesSection";

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
  const t = useTranslations("dashboard.notifications");
  const { data, loading, error } = useQuery(notificationAlertsQueryDocument);

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
        <Typography variant="body2" color="error">
          {t("errorLoading")}
        </Typography>
      </Box>
    );
  }

  const alerts = data?.notificationAlerts?.alerts ?? [];

  return (
    <Box sx={{ width: 360, maxHeight: 480, overflowY: "auto" }}>
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t("title")}
        </Typography>
        {data?.notificationAlerts?.unreadCount !== undefined &&
          data.notificationAlerts.unreadCount !== null &&
          data.notificationAlerts.unreadCount > 0 && (
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
              {data.notificationAlerts.unreadCount}
            </Typography>
          )}
      </Box>

      <Divider />

      <RequirePermission permissions={[AppPermission.BillingViewUnpaidInvoices]}>
        <UnpaidInvoicesSection />
        <Divider />
      </RequirePermission>

      {alerts.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <NotificationsOutlined sx={{ fontSize: 40, opacity: 0.4 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("noAlerts")}
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
