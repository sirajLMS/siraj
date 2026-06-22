import { Box, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Main container for the filter bar.
 * Provides flex layout with wrapping, spacing, and bottom border separator.
 */
const StyledFilterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.layout.cardPadding,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

/**
 * Groups filter controls (Select dropdowns) together horizontally.
 */
const StyledInputGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface ManagersFilterBarProps {
  roleFilter: "all" | "admin" | "staff";
  statusFilter: "all" | "active" | "offline";
  onRoleFilterChange: (role: "all" | "admin" | "staff") => void;
  onStatusFilterChange: (status: "all" | "active" | "offline") => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersFilterBar Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Filter bar for the Managers directory page.
 *
 * Renders role and status filter dropdowns within a SectionPanel.
 *
 * @param roleFilter - Current role filter value ("all" | "admin" | "staff")
 * @param statusFilter - Current status filter value ("all" | "active" | "offline")
 * @param onRoleFilterChange - Callback when role filter changes
 * @param onStatusFilterChange - Callback when status filter changes
 */
export function ManagersFilterBar({
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: Readonly<ManagersFilterBarProps>) {
  const t = useTranslations("dashboard.managersDirectory.filters");

  return (
    <StyledFilterContainer>
      {/* Filter dropdowns grouped together */}
      <StyledInputGroup>
        <Select
          size="small"
          value={roleFilter}
          onChange={e => {
            onRoleFilterChange(e.target.value);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">{t("allRoleTypes")}</MenuItem>
          <MenuItem value="admin">{t("admin")}</MenuItem>
          <MenuItem value="staff">{t("staff")}</MenuItem>
        </Select>

        <Select
          size="small"
          value={statusFilter}
          onChange={e => {
            onStatusFilterChange(e.target.value);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">{t("statusAll")}</MenuItem>
          <MenuItem value="active">{t("active")}</MenuItem>
          <MenuItem value="offline">{t("inactive")}</MenuItem>
        </Select>
      </StyledInputGroup>

      {/* Grid vs List view toggle can be added here if needed, but AppDataGrid / CardList handle responsive layout natively */}
    </StyledFilterContainer>
  );
}
