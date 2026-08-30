"use client";

import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import type { PermissionGroupsQuery_permissionGroups as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";

interface GroupCardProps {
  readonly labels: BasePermissionGroupListProps["labels"];
  readonly group: PermissionGroup;
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly rowMenuAnchor: RowMenuAnchor;
}

function GroupCardMobile({
  labels,
  group,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  rowMenuAnchor,
}: Readonly<GroupCardProps>) {
  const t = labels;
  const { anchorEl, openMenu, closeMenu } = rowMenuAnchor;
  const open = Boolean(anchorEl);

  const handleAction = (callback: (id: string) => void) => {
    closeMenu();
    if (group.id) {
      callback(group.id);
    }
  };

  const permissionsCount = group.permissionIds?.length ?? 0;

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography
              variant="bodyMd"
              onClick={() => group.id && onViewGroup(group.id)}
              sx={theme => ({
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": {
                  color: theme.palette.primary.main,
                  textDecoration: "underline",
                },
              })}
            >
              <MobileLocalizedStringDisplay value={group.name} />
            </Typography>
            <Typography
              variant="labelMd"
              sx={theme => ({
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: theme.palette.text.secondary,
              })}
            >
              {group.slug}
            </Typography>
          </Box>
          <Box>
            <IconButton
              id={`group-card-actions-btn-${group.id}`}
              onClick={openMenu}
              size="small"
              aria-label="Actions"
              aria-haspopup="true"
              aria-expanded={open}
            >
              <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
              <MenuItem onClick={() => handleAction(onAssignGroup)} id={`group-card-action-assign-${group.id}`}>
                <PersonAddOutlined fontSize="small" sx={{ mr: 1 }} />
                {t.actionAssign}
              </MenuItem>
              <MenuItem onClick={() => handleAction(onEditGroup)} id={`group-card-action-edit-${group.id}`}>
                <EditOutlined fontSize="small" sx={{ mr: 1 }} />
                {t.actionEdit}
              </MenuItem>
              <MenuItem
                onClick={() => handleAction(onDeleteGroup)}
                disabled={group.isSystem ?? false}
                id={`group-card-action-delete-${group.id}`}
                sx={theme => ({
                  color: group.isSystem ? theme.palette.text.disabled : theme.palette.error.main,
                })}
              >
                <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
                {t.actionDelete}
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {group.description && (
          <MobileLocalizedStringDisplay
            value={group.description}
            typographyVariant="bodyMd"
            fallback={null}
            sx={theme => ({ color: theme.palette.text.secondary })}
          />
        )}

        <Box
          sx={theme => ({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1.5,
            borderTop: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
          })}
        >
          <MobileStatusBadge
            category="session"
            status={group.isSystem ? "active" : "pending"}
            label={group.isSystem ? t.systemBadge : t.customBadge}
          />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {permissionsCount} {t.columnPermissionsCount}
          </Typography>
        </Box>
      </Box>
    </MobileCardListItem>
  );
}

export function PermissionGroupCardListMobile({
  labels,
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  groupRowMenuAnchor,
}: Readonly<BasePermissionGroupListProps>) {
  const t = labels;

  return (
    <MobileCardList
      rows={groups}
      emptyMessage={t.noPermissionsFound}
      getKey={group => group.id ?? group.slug ?? ""}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={group => (
        <GroupCardMobile
          labels={labels}
          group={group}
          onViewGroup={onViewGroup}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignGroup={onAssignGroup}
          rowMenuAnchor={groupRowMenuAnchor}
        />
      )}
    />
  );
}
