import { PersonRemoveOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { PermissionGroupDetailFieldsFragment_assignedUsers } from "@/frontend/common/graphql/generated/gql/graphql";
import { StyledRemoveButton } from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared.styles";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import type { AssignedUsersListSlotProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTabShared.types";

interface AssignedUsersRowActionsCellProps {
  readonly row: PermissionGroupDetailFieldsFragment_assignedUsers;
  readonly group: AssignedUsersTabProps["group"];
  readonly onRevokeUser: (userId: string) => void;
  readonly labels: AssignedUsersListSlotProps["labels"];
}

export function AssignedUsersRowActionsCell({
  row,
  group,
  onRevokeUser,
  labels,
}: Readonly<AssignedUsersRowActionsCellProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
      {row.id ? (
        <ViewAsUserButton
          variant="link"
          targetUserId={row.id}
          targetUserName={row.name ?? row.email ?? ""}
          targetIsSuperAdmin={group.slug === "super_admin"}
        />
      ) : null}
      <StyledRemoveButton
        size="small"
        color="error"
        startIcon={<PersonRemoveOutlined fontSize="small" />}
        onClick={() => row.id && onRevokeUser(row.id)}
      >
        {labels.removeUser}
      </StyledRemoveButton>
    </Box>
  );
}
