"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import type { SingleGroupViewSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared";
import type { SubTabKey } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";
import type { PermissionsLabels } from "@/shared/locale";

export function GroupSubTabs({
  t,
  activeSubTab,
  onSubTabChange,
  permissionsCount,
  assignedUsersCount,
  options,
}: {
  readonly t: PermissionsLabels;
  readonly activeSubTab: SubTabKey;
  readonly onSubTabChange: (value: SubTabKey) => void;
  readonly permissionsCount: number;
  readonly assignedUsersCount: number;
  readonly options: SingleGroupViewSharedOptions;
}) {
  return (
    <Box sx={theme => ({ borderBottom: `1px solid ${theme.palette.divider}` })}>
      <Tabs
        value={activeSubTab}
        onChange={(_, val: SubTabKey) => onSubTabChange(val)}
        textColor="primary"
        indicatorColor="primary"
        variant={options.tabsVariant}
        scrollButtons={options.scrollButtons}
      >
        <Tab
          value="current"
          label={`${t.currentPermissions} (${permissionsCount})`}
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
        <Tab value="add" label={t.addPermissions} sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab
          value="users"
          label={`${t.assignedUsers} (${assignedUsersCount})`}
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
      </Tabs>
    </Box>
  );
}

export function GroupLoadingIndicator() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress color="primary" />
    </Box>
  );
}
