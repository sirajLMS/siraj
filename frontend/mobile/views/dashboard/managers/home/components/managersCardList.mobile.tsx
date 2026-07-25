"use client";

import { MailOutlined, PhoneOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ManagerRowActions } from "@/frontend/common/views/dashboard/managers/home/ManagerRowActions";
import type { Manager, ManagerRole } from "@/frontend/common/views/dashboard/managers/home/types";
import { MobileCardListItem, MobilePhoneDisplay, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { useAppTranslation } from "@/shared/locale";

const StyledCardActionsBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 12,
  right: 12,
  color: theme.palette.text.secondary,
}));

const StyledProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  border: `2px solid ${theme.palette.surfaceContainerHighest}`,
}));

const StyledStatusIndicator = styled(Box, {
  shouldForwardProp: prop => prop !== "status",
})<{ status: "active" | "blocked" }>(({ theme, status }) => ({
  position: "absolute",
  bottom: 0,
  right: 0,
  width: 14,
  height: 14,
  borderRadius: "50%",
  backgroundColor: status === "active" ? theme.palette.status.active : theme.palette.status.blocked,
  border: `2px solid ${theme.palette.background.paper}`,
}));

const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "role",
})<{ role: ManagerRole }>(({ theme, role }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: theme.typography.labelSm.fontSize,
  height: 20,
  backgroundColor:
    role === "admin"
      ? theme.palette.primaryContainer
      : role === "supervisor"
        ? theme.palette.tertiaryContainer
        : theme.palette.secondaryContainer,
  color:
    role === "admin"
      ? theme.palette.onPrimaryContainer
      : role === "supervisor"
        ? theme.palette.onTertiaryContainer
        : theme.palette.onSecondaryContainer,
}));

const StyledContactItemBox = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  color: theme.palette.text.secondary,
}));

// VARIANT JUSTIFICATION: mobile card list uses the shared base shape with no extra fields; aliased as a named type for tier call-site clarity (Class C variant per specs §4.3).
export interface ManagersCardListMobileProps {
  readonly managers: readonly Manager[];
  readonly paginationOptions: ListPaginationOptions;
}

export function ManagersCardListMobile({ managers, paginationOptions }: Readonly<ManagersCardListMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.managersDirectory;

  return (
    <Box sx={{ px: 2 }}>
      <MobileCardList
        rows={managers}
        getKey={manager => manager.userId}
        paginationOptions={paginationOptions}
        emptyMessage={t.noEntries}
        layout="edge-to-edge"
        renderItem={manager => {
          const avatarFallback = manager.avatarUrl ? undefined : manager.name.charAt(0).toUpperCase();
          return (
            <MobileCardListItem variant="edge-to-edge" sx={{ position: "relative" }}>
              <StyledCardActionsBox>
                <ManagerRowActions manager={manager} />
              </StyledCardActionsBox>

              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 3 }}>
                <Box sx={{ position: "relative" }}>
                  <StyledProfileAvatar src={manager.avatarUrl || undefined} alt={manager.name}>
                    {avatarFallback}
                  </StyledProfileAvatar>
                  <StyledStatusIndicator status={manager.status === "active" ? "active" : "blocked"} />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="titleLg"
                    sx={theme => ({ color: theme.palette.text.primary, lineHeight: 1.2, mb: 1 })}
                  >
                    {manager.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                    <StyledRoleChip label={t.roles[manager.role]} size="small" role={manager.role} />
                    <MobileStatusBadge
                      category="session"
                      status={manager.status === "active" ? "active" : "blocked"}
                      label={t.status[manager.status]}
                      size="small"
                    />
                  </Stack>
                </Box>
              </Stack>

              <Stack spacing={1.5}>
                <StyledContactItemBox direction="row" spacing={1.5}>
                  <MailOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
                  <Typography variant="bodyMd">{manager.email}</Typography>
                </StyledContactItemBox>
                <StyledContactItemBox direction="row" spacing={1.5}>
                  <PhoneOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
                  <MobilePhoneDisplay phone={manager.phone} typographyVariant="bodyMd" />
                </StyledContactItemBox>
              </Stack>
            </MobileCardListItem>
          );
        }}
      />
    </Box>
  );
}
