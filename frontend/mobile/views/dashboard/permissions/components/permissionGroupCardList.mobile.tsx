"use client";

import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { useState } from "react";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";
import { useAppTranslation } from "@/shared/locale";

interface GroupCardProps {
  readonly group: PermissionGroup;
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

function GroupCardMobile({ group, onViewGroup, onEditGroup, onDeleteGroup, onAssignGroup }: Readonly<GroupCardProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (callback: (id: string) => void) => {
    handleClose();
    if (group.id) {
      callback(group.id);
    }
  };

  const permissionsCount = group.permissionIds?.length ?? 0;

  return (
    <MobileBaseCard
      sx={theme => ({
        p: 2,
        boxShadow: theme.palette.shadow.card,
      })}
    >
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
                fontFamily: "JetBrains Mono, monospace",
                color: theme.palette.text.secondary,
              })}
            >
              {group.slug}
            </Typography>
          </Box>
          <Box>
            <IconButton id={`group-card-actions-btn-${group.id}`} onClick={handleClick} size="small">
              <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem onClick={() => handleAction(onAssignGroup)} id={`group-card-action-assign-${group.id}`}>
                <PersonAddOutlined fontSize="small" sx={{ mr: 1 }} />
                {t.actionAssign}
              </MenuItem>
              <MenuItem
                onClick={() => handleAction(onEditGroup)}
                disabled={group.isSystem ?? false}
                id={`group-card-action-edit-${group.id}`}
              >
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
    </MobileBaseCard>
  );
}

export function PermissionGroupCardListMobile({
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
}: Readonly<BasePermissionGroupListProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  if (groups.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noPermissionsFound}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {groups.map(group => (
        <GroupCardMobile
          key={group.id ?? group.slug ?? ""}
          group={group}
          onViewGroup={onViewGroup}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignGroup={onAssignGroup}
        />
      ))}
    </Box>
  );
}
