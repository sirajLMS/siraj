import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import type { PermissionGroupsQuery_permissionGroups as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";

interface RowActionsProps {
  readonly labels: BasePermissionGroupListProps["labels"];
  readonly group: PermissionGroup;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly rowMenuAnchor: RowMenuAnchor;
}

export function RowActionsDesktop({
  labels,
  group,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  rowMenuAnchor,
}: Readonly<RowActionsProps>) {
  const t = labels;
  const { anchorEl, openMenu, closeMenu } = rowMenuAnchor;
  const open = Boolean(anchorEl);

  const handleAction = (callback: (id: string) => void) => {
    closeMenu();
    if (group.id) {
      callback(group.id);
    }
  };

  return (
    <>
      <IconButton
        id={`group-actions-btn-${group.id}`}
        onClick={openMenu}
        size="small"
        aria-label={t.columnActions}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        <MenuItem onClick={() => handleAction(onAssignGroup)} id={`group-action-assign-${group.id}`}>
          <PersonAddOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionAssign}
        </MenuItem>
        <MenuItem onClick={() => handleAction(onEditGroup)} id={`group-action-edit-${group.id}`}>
          <EditOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionEdit}
        </MenuItem>
        <MenuItem
          onClick={() => handleAction(onDeleteGroup)}
          disabled={group.isSystem ?? false}
          id={`group-action-delete-${group.id}`}
          sx={theme => ({
            color: group.isSystem ? theme.palette.text.disabled : theme.palette.error.main,
          })}
        >
          <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
          {t.actionDelete}
        </MenuItem>
      </Menu>
    </>
  );
}
