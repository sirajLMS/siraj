"use client";

import { Box, Checkbox, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AddPermissionsTabProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { AddPermissionBulkBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionBulkBar.mobile";
import { AddPermissionFilterBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionFilterBar.mobile";

const StyledTabContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

interface PermissionCardProps {
  readonly permission: Permission;
  readonly checked: boolean;
  readonly onToggle: (id: string, checked: boolean) => void;
}

function AddPermissionCardMobile({ permission, checked, onToggle }: Readonly<PermissionCardProps>) {
  const id = permission.id ?? "";
  return (
    <MobileCardListItem
      variant="edge-to-edge"
      sx={theme => ({
        backgroundColor: checked ? theme.palette.primaryContainer : undefined,
        borderColor: checked ? theme.palette.primary.main : undefined,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Checkbox size="small" checked={checked} onChange={e => onToggle(id, e.target.checked)} sx={{ pt: 0.5 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}>
          <Box
            sx={theme => ({
              fontFamily: "JetBrains Mono, monospace",
              typography: "labelMd",
              backgroundColor: theme.palette.surfaceVariant,
              color: theme.palette.onSurfaceVariant,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
              alignSelf: "flex-start",
            })}
          >
            {permission.key}
          </Box>
          {permission.category && (
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {permission.category}
            </Typography>
          )}
          {permission.description && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {permission.description}
            </Typography>
          )}
        </Box>
      </Box>
    </MobileCardListItem>
  );
}

export function AddPermissionsTabMobile({
  labels,
  filteredAvailablePermissions,
  selectedAddPermissionIds,
  searchQuery,
  selectedCategory,
  addCategories,
  onAssignPermissions,
  onPermissionToggle,
  onSearchChange,
  onCategoryChange,
  loading = false,
}: Readonly<AddPermissionsTabProps>) {
  const t = labels;

  return (
    <StyledTabContainer>
      <AddPermissionFilterBarMobile
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        addCategories={addCategories}
        t={t}
      />

      {selectedAddPermissionIds.length > 0 && (
        <AddPermissionBulkBarMobile
          selectedCount={selectedAddPermissionIds.length}
          onAssignPermissions={onAssignPermissions}
          t={t}
        />
      )}

      <MobileSectionPanel title={t.addPermissions}>
        <MobileCardList
          rows={filteredAvailablePermissions}
          loading={loading}
          emptyMessage={t.noPermissionsFound}
          getKey={permission => permission.id ?? ""}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={permission => {
            const id = permission.id ?? "";
            const checked = selectedAddPermissionIds.includes(id);
            return <AddPermissionCardMobile permission={permission} checked={checked} onToggle={onPermissionToggle} />;
          }}
        />
      </MobileSectionPanel>
    </StyledTabContainer>
  );
}
