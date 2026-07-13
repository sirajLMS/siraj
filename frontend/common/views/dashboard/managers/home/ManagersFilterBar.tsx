import { Box, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { ManagerRoleFilter, ManagerStatusFilter } from "@/frontend/common/views/dashboard/managers/home/types";

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

const StyledFilterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.layout.cardPadding,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

const StyledInputGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface ManagersFilterBarProps {
  roleFilter: ManagerRoleFilter;
  statusFilter: ManagerStatusFilter;
  onRoleFilterChange: (role: ManagerRoleFilter) => void;
  onStatusFilterChange: (status: ManagerStatusFilter) => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersFilterBar Component
 * ──────────────────────────────────────────────────────────────────────────── */

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
