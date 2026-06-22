import { MailOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { Manager } from "@/frontend/stores/mockManagersStore";

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Avatar for manager profile in data grid rows.
 * Fixed dimensions for consistent row height.
 */
const StyledManagerAvatar = styled(Avatar)({
  width: 40,
  height: 40,
});

/**
 * Manager name typography with bold weight and primary color.
 */
const StyledManagerNameTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

/**
 * Role chip with conditional styling based on staff/admin role.
 */
const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "isStaff",
})<{ isStaff: boolean }>(({ theme, isStaff }) => ({
  fontWeight: 700,
  textTransform: "uppercase",
  backgroundColor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
  color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
}));

/**
 * Container wrapper for the data grid.
 */
const StyledDataGridWrapper = styled(Box)({
  width: "100%",
});

/**
 * Footer section displaying pagination info with border-top separator.
 */
const StyledDataGridFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.border.light}`,
  backgroundColor: theme.palette.background.default,
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface ManagersDataGridProps {
  managers: Manager[];
  total: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersDataGrid Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Desktop data grid for displaying managers in tabular format.
 *
 * Columns: Hash, Manager (with avatar/status), Contact, Skype, Phone, Role, Options
 *
 * @param managers - Array of manager records to display
 * @param total - Total count for pagination display
 */
export function ManagersDataGrid({ managers, total }: Readonly<ManagersDataGridProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  const columns = useMemo<GridColDef<Manager>[]>(
    () => [
      {
        field: "id",
        headerName: t("table.hash"),
        width: 80,
        valueGetter: (_, row) => row.id.replace("MGR-", ""),
      },
      {
        field: "manager",
        headerName: t("table.manager"),
        flex: 1.5,
        minWidth: 250,
        renderCell: params => (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
            <StyledManagerAvatar src={params.row.avatarUrl} alt={params.row.name} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <StyledManagerNameTypography variant="bodyMd">{params.row.name}</StyledManagerNameTypography>
              <StatusBadge
                category="session"
                status={params.row.status === "active" ? "active" : "blocked"}
                label={t(`status.${params.row.status}`)}
              />
            </Box>
          </Stack>
        ),
      },
      {
        field: "email",
        headerName: t("table.contactDetails"),
        flex: 1.5,
        minWidth: 200,
        renderCell: params => (
          <Stack
            direction="row"
            spacing={1}
            sx={theme => ({ alignItems: "center", height: "100%", color: theme.palette.text.secondary })}
          >
            <MailOutlined fontSize="small" sx={theme => ({ color: theme.palette.primaryContainer })} />
            <Typography variant="bodyMd">{params.row.email}</Typography>
          </Stack>
        ),
      },
      {
        field: "skypeId",
        headerName: t("table.skypeId"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "phone",
        headerName: t("table.phone"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "role",
        headerName: t("table.roleType"),
        width: 120,
        renderCell: params => {
          const isStaff = params.row.role === "staff";
          return <StyledRoleChip label={t(`roles.${params.row.role}`)} size="small" isStaff={isStaff} />;
        },
      },
      {
        field: "options",
        headerName: t("table.options"),
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: () => (
          <IconButton size="small" aria-label={t("actions.options")}>
            <SettingsOutlined fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [t]
  );

  return (
    <StyledDataGridWrapper>
      <AppDataGrid rows={managers} columns={columns} emptyMessage={t("noEntries")} autoHeight rowHeight={80} />
      <StyledDataGridFooter>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("showingOf", { count: managers.length, total: total })}
        </Typography>
      </StyledDataGridFooter>
    </StyledDataGridWrapper>
  );
}
