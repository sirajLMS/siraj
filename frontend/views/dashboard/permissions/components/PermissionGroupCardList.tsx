"use client";

import { DeleteOutlined, EditOutlined, MoreVertOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BaseCard, StatusBadge } from "@/frontend/components/ui";
import type { PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

export interface PermissionGroupCardListProps {
  readonly groups: readonly PermissionGroup[];
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

interface GroupCardProps {
  readonly group: PermissionGroup;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

function GroupCard({ group, onEditGroup, onDeleteGroup, onAssignGroup }: Readonly<GroupCardProps>) {
  const t = useTranslations("dashboard.permissions");
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
    <BaseCard
      sx={theme => ({
        p: 2,
        boxShadow: theme.palette.shadow?.card ?? theme.shadows[1],
      })}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Header: Title/Name & Actions Menu */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {group.name}
            </Typography>
            <Typography
              variant="bodyMd"
              sx={theme => ({
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.75rem",
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
                {t("actionAssign")}
              </MenuItem>
              <MenuItem
                onClick={() => handleAction(onEditGroup)}
                disabled={group.isSystem ?? false}
                id={`group-card-action-edit-${group.id}`}
              >
                <EditOutlined fontSize="small" sx={{ mr: 1 }} />
                {t("actionEdit")}
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
                {t("actionDelete")}
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Description */}
        {group.description && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {group.description}
          </Typography>
        )}

        {/* Footer: Badge (System/Custom) and permissions count */}
        <Box
          sx={theme => ({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1.5,
            borderTop: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
          })}
        >
          <StatusBadge
            category="session"
            status={group.isSystem ? "active" : "pending"}
            label={group.isSystem ? t("systemBadge") : t("customBadge")}
          />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {permissionsCount} {t("columnPermissionsCount")}
          </Typography>
        </Box>
      </Box>
    </BaseCard>
  );
}

export function PermissionGroupCardList({
  groups,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
}: Readonly<PermissionGroupCardListProps>) {
  const t = useTranslations("dashboard.permissions");

  if (groups.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("noPermissionsFound")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {groups.map(group => (
        <GroupCard
          key={group.id ?? group.slug ?? ""}
          group={group}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignGroup={onAssignGroup}
        />
      ))}
    </Box>
  );
}
