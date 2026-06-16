import { ChatBubbleOutlineOutlined, MailOutlined, PhoneOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard, StatusBadge } from "@/frontend/components/ui";
import type { Manager } from "@/frontend/stores/managersStore";

interface ManagersCardListProps {
  managers: Manager[];
  total: number;
}

export function ManagersCardList({ managers, total }: Readonly<ManagersCardListProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const theme = useTheme();

  if (managers.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{t("noEntries")}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      {managers.map(manager => {
        const isStaff = manager.role === "staff";
        return (
          <BaseCard key={manager.id} sx={{ position: "relative" }}>
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 12, right: 12, color: theme.palette.text.secondary }}
              aria-label={t("actions.options")}
            >
              <SettingsOutlined fontSize="small" />
            </IconButton>

            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={manager.avatarUrl}
                  alt={manager.name}
                  sx={{
                    width: 64,
                    height: 64,
                    border: `2px solid ${theme.palette.surfaceContainerHighest}`,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: manager.status === "active" ? theme.palette.status.active : theme.palette.status.blocked,
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="titleLg" sx={{ color: theme.palette.text.primary, lineHeight: 1.2, mb: 1 }}>
                  {manager.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                  <Chip
                    label={t(`roles.${manager.role}`)}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                      height: 20,
                      bgcolor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
                      color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
                    }}
                  />
                  <StatusBadge
                    category="session"
                    status={manager.status === "active" ? "active" : "blocked"}
                    label={t(`status.${manager.status}`)}
                  />
                </Stack>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", color: theme.palette.text.secondary }}>
                <MailOutlined fontSize="small" sx={{ color: theme.palette.primaryContainer }} />
                <Typography variant="bodyMd">{manager.email}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", color: theme.palette.text.secondary }}>
                <ChatBubbleOutlineOutlined fontSize="small" sx={{ color: theme.palette.primaryContainer }} />
                <Typography variant="bodyMd">{manager.skypeId}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", color: theme.palette.text.secondary }}>
                <PhoneOutlined fontSize="small" sx={{ color: theme.palette.primaryContainer }} />
                <Typography variant="bodyMd">{manager.phone}</Typography>
              </Stack>
            </Stack>
          </BaseCard>
        );
      })}

      <Box sx={{ py: 2, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={{ color: theme.palette.text.secondary }}>
          {t("showingOf", { count: managers.length, total: total })}
        </Typography>
      </Box>
    </Stack>
  );
}
