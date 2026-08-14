import { Box, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ManagerRoleFilter, ManagerStatusFilter } from "@/frontend/common/types/shared.types";
import type { StaffDirectoryLabels } from "@/shared/locale";

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

interface ManagersFilterBarProps {
  readonly labels: StaffDirectoryLabels["filters"];
  roleFilter: ManagerRoleFilter;
  statusFilter: ManagerStatusFilter;
  onRoleFilterChange: (role: ManagerRoleFilter) => void;
  onStatusFilterChange: (status: ManagerStatusFilter) => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersFilterBar Component
 * ──────────────────────────────────────────────────────────────────────────── */

export function ManagersFilterBar({
  labels: t,
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: Readonly<ManagersFilterBarProps>) {
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
          <MenuItem value="all">{t.allRoleTypes}</MenuItem>
          <MenuItem value="admin">{t.admin}</MenuItem>
          <MenuItem value="manager">{t.manager}</MenuItem>
          <MenuItem value="supervisor">{t.supervisor}</MenuItem>
        </Select>

        <Select
          size="small"
          value={statusFilter}
          onChange={e => {
            onStatusFilterChange(e.target.value);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">{t.statusAll}</MenuItem>
          <MenuItem value="active">{t.active}</MenuItem>
          <MenuItem value="offline">{t.inactive}</MenuItem>
        </Select>
      </StyledInputGroup>

      {/* Grid vs List view toggle can be added here if needed, but AppDataGrid / CardList handle responsive layout natively */}
    </StyledFilterContainer>
  );
}
