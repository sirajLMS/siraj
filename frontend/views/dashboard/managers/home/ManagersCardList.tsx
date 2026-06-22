import { ChatBubbleOutlineOutlined, MailOutlined, PhoneOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { BaseCard, StatusBadge } from "@/frontend/components/ui";
import type { Manager } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Empty state container shown when no managers match the filters.
 */
const StyledEmptyStateBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

/**
 * Wrapper for the card list with consistent padding.
 */
const StyledCardListWrapper = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
}));

/**
 * Individual manager card with relative positioning for absolute children.
 */
const StyledManagerCard = styled(BaseCard)({
  position: "relative",
});

/**
 * Settings icon button positioned absolutely in card corner.
 */
const StyledCardIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: 12,
  right: 12,
  color: theme.palette.text.secondary,
}));

/**
 * Avatar with border matching surface container color.
 */
const StyledProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  border: `2px solid ${theme.palette.surfaceContainerHighest}`,
}));

/**
 * Small status indicator dot positioned on avatar corner.
 */
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

/**
 * Role chip with compact sizing for mobile card layout.
 */
const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "isStaff",
})<{ isStaff: boolean }>(({ theme, isStaff }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "10px",
  height: 20,
  backgroundColor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
  color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
}));

/**
 * Contact item row with icon and text.
 */
const StyledContactItemBox = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  color: theme.palette.text.secondary,
}));

/**
 * Footer showing pagination info.
 */
const StyledCardListFooter = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface ManagersCardListProps {
  managers: Manager[];
  total: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersCardList Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Mobile card list for displaying managers on small screens (< md).
 *
 * Each card shows:
 * - Profile avatar with status indicator
 * - Name, role chip, and status badge
 * - Contact info (email, skype, phone)
 * - Settings action button
 *
 * @param managers - Array of manager records to display
 * @param total - Total count for pagination display
 */
export function ManagersCardList({ managers, total }: Readonly<ManagersCardListProps>) {
  const t = useTranslations("dashboard.managersDirectory");

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
        return (
          <StyledManagerCard key={manager.id}>
            {/* Card actions (top-right) */}
            <StyledCardIconButton size="small" aria-label={t("actions.options")}>
              <SettingsOutlined fontSize="small" />
            </StyledCardIconButton>

            {/* Profile section: Avatar + Name + Badges */}
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 3 }}>
              <Box sx={{ position: "relative" }}>
                <StyledProfileAvatar src={manager.avatarUrl} alt={manager.name} />
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

            {/* Contact information rows */}
            <Stack spacing={1.5}>
              <StyledContactItemBox direction="row" spacing={1.5}>
                <MailOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
                <Typography variant="bodyMd">{manager.email}</Typography>
              </StyledContactItemBox>
              <StyledContactItemBox direction="row" spacing={1.5}>
                <ChatBubbleOutlineOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
                <Typography variant="bodyMd">{manager.skypeId}</Typography>
              </StyledContactItemBox>
              <StyledContactItemBox direction="row" spacing={1.5}>
                <PhoneOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
                <Typography variant="bodyMd">{manager.phone}</Typography>
              </StyledContactItemBox>
            </Stack>
          </StyledManagerCard>
        );
      })}

      {/* Footer with pagination info */}
      <StyledCardListFooter>
        <Typography variant="bodyMd">{t("showingOf", { count: managers.length, total: total })}</Typography>
      </StyledCardListFooter>
    </StyledCardListWrapper>
  );
}
