"use client";

import { Box, Checkbox, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { AddPermissionBulkBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionBulkBar.mobile";
import { AddPermissionFilterBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionFilterBar.mobile";
import { useAppTranslation } from "@/shared/locale";

const StyledTabContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

interface AddPermissionsTabMobileProps {
  readonly filteredAvailablePermissions: readonly Permission[];
  readonly selectedAddPermissionIds: readonly string[];
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly addCategories: readonly string[];
  readonly onAssignPermissions: () => void;
  readonly onPermissionToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
  readonly loading?: boolean;
}

interface PermissionCardProps {
  readonly permission: Permission;
  readonly checked: boolean;
  readonly onToggle: (id: string, checked: boolean) => void;
}

function AddPermissionCardMobile({ permission, checked, onToggle }: Readonly<PermissionCardProps>) {
  const id = permission.id ?? "";
  return (
    <MobileBaseCard
      sx={theme => ({
        p: 2,
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
    </MobileBaseCard>
  );
}

export function AddPermissionsTabMobile({
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
}: Readonly<AddPermissionsTabMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

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
        {filteredAvailablePermissions.length === 0 && !loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.noPermissionsFound}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {filteredAvailablePermissions.map(permission => {
              const id = permission.id ?? "";
              const checked = selectedAddPermissionIds.includes(id);
              return (
                <AddPermissionCardMobile
                  key={id}
                  permission={permission}
                  checked={checked}
                  onToggle={onPermissionToggle}
                />
              );
            })}
          </Box>
        )}
      </MobileSectionPanel>
    </StyledTabContainer>
  );
}
