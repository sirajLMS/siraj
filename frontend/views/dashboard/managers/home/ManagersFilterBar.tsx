import { Box, MenuItem, Select, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";

interface ManagersFilterBarProps {
  roleFilter: "all" | "admin" | "staff";
  statusFilter: "all" | "active" | "offline";
  onRoleFilterChange: (role: "all" | "admin" | "staff") => void;
  onStatusFilterChange: (status: "all" | "active" | "offline") => void;
}

export function ManagersFilterBar({
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: Readonly<ManagersFilterBarProps>) {
  const t = useTranslations("dashboard.managersDirectory.filters");
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        p: theme.layout.cardPadding,
        borderBottom: `1px solid ${theme.palette.border.light}`,
      }}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
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
      </Box>

      {/* Grid vs List view toggle can be added here if needed, but AppDataGrid / CardList handle responsive layout natively */}
      {/* <FilterButton /> */}
    </Box>
  );
}
