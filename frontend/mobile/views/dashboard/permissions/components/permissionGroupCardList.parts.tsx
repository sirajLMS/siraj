"use client";

import { Box, Typography } from "@mui/material";
import type { PermissionGroupsQuery_permissionGroups as PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";
import { GroupCardActionsMenu } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupCardActionsMenu.parts";

interface GroupCardProps {
  readonly labels: BasePermissionGroupListProps["labels"];
  readonly group: PermissionGroup;
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly rowMenuAnchor: RowMenuAnchor;
}

export function GroupCardMobile({
  labels,
  group,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  rowMenuAnchor,
}: Readonly<GroupCardProps>) {
  const t = labels;
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
          <GroupCardActionsMenu
            labels={labels}
            group={group}
            onEditGroup={onEditGroup}
            onDeleteGroup={onDeleteGroup}
            onAssignGroup={onAssignGroup}
            rowMenuAnchor={rowMenuAnchor}
          />
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
            category="groupType"
            status={group.isSystem ? "system" : "custom"}
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
