import { MailOutlined } from "@mui/icons-material";
import { Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { profileHrefForStaff } from "@/frontend/common/utils/profileHref";
import { ManagerRowActions } from "@/frontend/common/views/dashboard/staff/home/ManagerRowActions";
import type { Manager, ManagerRole } from "@/frontend/common/views/dashboard/staff/home/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPersonProfileLinkCell, DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display";
import type { StaffDirectoryLabels } from "@/shared/locale";

const StyledRoleChip = styled(Chip, {
  shouldForwardProp: prop => prop !== "role",
})<{ role: ManagerRole }>(({ theme, role }) => {
  // Use explicit, typed maps to avoid referencing local inferred types and to keep lookups simple
  const roleBackgroundMap: Record<ManagerRole, string> = {
    admin: theme.palette.primaryContainer,
    supervisor: theme.palette.tertiaryContainer,
    manager: theme.palette.secondaryContainer,
  };

  const roleColorMap: Record<ManagerRole, string> = {
    admin: theme.palette.onPrimaryContainer,
    supervisor: theme.palette.onTertiaryContainer,
    manager: theme.palette.onSecondaryContainer,
  };

  const roleBackgroundColor = roleBackgroundMap[role] ?? theme.palette.secondaryContainer;
  const roleColor = roleColorMap[role] ?? theme.palette.onSecondaryContainer;

  return {
    fontWeight: 700,
    textTransform: "uppercase",
    backgroundColor: roleBackgroundColor,
    color: roleColor,
  };
});

export function buildManagerColumns(labels: StaffDirectoryLabels): GridColDef<Manager>[] {
  const t = labels;
  return [
    {
      field: "manager",
      headerName: t.table.manager,
      flex: 1.5,
      minWidth: 250,
      renderCell: params => (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
          <DesktopPersonProfileLinkCell
            href={profileHrefForStaff({ userId: params.row.userId })}
            name={params.row.name}
            avatarUrl={params.row.avatarUrl}
            avatarSize={40}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: t.table.status,
      width: 140,
      renderCell: params => (
        <Stack direction="row" sx={{ alignItems: "center", height: "100%" }}>
          <DesktopStatusBadge
            category="session"
            status={params.row.status === "active" ? "active" : "blocked"}
            label={t.status[params.row.status]}
          />
        </Stack>
      ),
    },
    {
      field: "email",
      headerName: t.table.contactDetails,
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
      field: "phone",
      headerName: t.table.phone,
      flex: 1,
      minWidth: 150,
      renderCell: params => <DesktopPhoneDisplay phone={params.row.phone} typographyVariant="bodyMd" />,
    },
    {
      field: "role",
      headerName: t.table.roleType,
      width: 120,
      renderCell: params => <StyledRoleChip label={t.roles[params.row.role]} size="small" role={params.row.role} />,
    },
    {
      field: "options",
      headerName: t.table.options,
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: params => <ManagerRowActions labels={labels} manager={params.row} />,
    },
  ];
}
