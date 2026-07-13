"use client";

import { MailOutlined, PhoneOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { BaseCard, PaginationControls, PhoneDisplay, StatusBadge } from "@/frontend/common/components/ui";
import { ManagerRowActions } from "@/frontend/views/dashboard/managers/home/ManagerRowActions";
import type { Manager } from "@/frontend/views/dashboard/managers/home/types";

const StyledEmptyStateBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

const StyledCardListWrapper = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledManagerCard = styled(BaseCard)({
  position: "relative",
});

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
  shouldForwardProp: prop => prop !== "isStaff",
})<{ isStaff: boolean }>(({ theme, isStaff }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: theme.typography.labelSm.fontSize,
  height: 20,
  backgroundColor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
  color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
}));

const StyledContactItemBox = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  color: theme.palette.text.secondary,
}));

interface ManagersCardListProps {
  managers: Manager[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export function ManagersCardList({
  managers,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ManagersCardListProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  if (managers.length === 0) {
    return (
      <StyledEmptyStateBox>
        <Typography>{t("noEntries")}</Typography>
      </StyledEmptyStateBox>
    );
  }

  return (
    <StyledCardListWrapper spacing={2}>
      {managers.map(manager => {
        const isStaff = manager.role === "staff";
        const avatarFallback = manager.avatarUrl ? undefined : manager.name.charAt(0).toUpperCase();
        return (
          <StyledManagerCard key={manager.userId}>
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
                  <StyledRoleChip label={t(`roles.${manager.role}`)} size="small" isStaff={isStaff} />
                  <StatusBadge
                    category="session"
                    status={manager.status === "active" ? "active" : "blocked"}
                    label={t(`status.${manager.status}`)}
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
                <PhoneDisplay phone={manager.phone} typographyVariant="bodyMd" />
              </StyledContactItemBox>
            </Stack>
          </StyledManagerCard>
        );
      })}

      {onPageChange && totalCount !== undefined ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </StyledCardListWrapper>
  );
}
