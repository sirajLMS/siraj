import { Box, Checkbox, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { PermissionGroupDetailFieldsFragment_assignedUsers } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";
import { AssignedUsersRowActionsCell } from "@/frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.parts";

interface BuildAssignedUsersColumnsParams {
  readonly group: AssignedUsersTabProps["group"];
  readonly selectedAssignedUserIds: readonly string[];
  readonly onRevokeUser: (userId: string) => void;
  readonly onUserToggle: (id: string, checked: boolean) => void;
  readonly labels: AssignedUsersListSlotProps["labels"];
}

export function buildAssignedUsersColumns({
  group,
  selectedAssignedUserIds,
  onRevokeUser,
  onUserToggle,
  labels,
}: Readonly<BuildAssignedUsersColumnsParams>): GridColDef<PermissionGroupDetailFieldsFragment_assignedUsers>[] {
  return [
    {
      field: "checkbox",
      headerName: "",
      width: 50,
      sortable: false,
      renderCell: params => {
        const id = params.row.id ?? "";
        const checked = selectedAssignedUserIds.includes(id);
        return (
          <Checkbox
            checked={checked}
            onChange={e => onUserToggle(id, e.target.checked)}
            aria-label={params.row.name ?? params.row.email ?? ""}
            size="small"
          />
        );
      },
    },
    {
      field: "name",
      headerName: labels.columnName,
      flex: 1.5,
      minWidth: 200,
      renderCell: params => {
        const user = params.row;
        return (
          <Box sx={{ display: "flex", alignItems: "center", py: 1, height: "100%" }}>
            <DesktopPersonProfileLinkCell
              href={user.id ? profileHrefForUser(user.id) : undefined}
              name={user.name ?? ""}
              avatarSize={32}
              label={user.email ?? undefined}
              typographyVariant="bodyMd"
              fontWeight={600}
            />
          </Box>
        );
      },
    },
    {
      field: "assignedDate",
      headerName: labels.assignDate,
      flex: 1.2,
      minWidth: 150,
      renderCell: () => {
        const date = group.createdAt ? new Date(group.createdAt) : new Date();
        return (
          <Typography variant="bodyMd">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Typography>
        );
      },
    },
    {
      field: "assignedBy",
      headerName: labels.assignedBy,
      flex: 1,
      minWidth: 120,
      renderCell: () => (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.assignedBySystem}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 160,
      align: "right",
      sortable: false,
      renderCell: params => (
        <AssignedUsersRowActionsCell row={params.row} group={group} onRevokeUser={onRevokeUser} labels={labels} />
      ),
    },
  ];
}
