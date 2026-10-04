"use client";

import { Menu, MenuItem, Typography } from "@mui/material";
import type { SimulatableGroup } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import type { CommonLabels } from "@/shared/locale";

export function GroupSimulationMenu({
  anchorEl,
  open,
  onClose,
  groupsLoading,
  simulatableGroups,
  simulationLoading,
  onSelectGroup,
  tCommon,
}: Readonly<{
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  groupsLoading: boolean;
  simulatableGroups: ReadonlyArray<SimulatableGroup>;
  simulationLoading: boolean;
  onSelectGroup: (slug: string) => void;
  tCommon: CommonLabels;
}>) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: theme => ({
            ml: -1,
            minWidth: 220,
            maxHeight: 320,
            boxShadow: theme.palette.shadow.card,
            border: `1px solid ${theme.palette.outlineVariant}`,
            borderRadius: 2,
          }),
        },
      }}
    >
      {groupsLoading ? (
        <MenuItem disabled>
          <Typography variant="bodyMd">{tCommon.loading}</Typography>
        </MenuItem>
      ) : (
        simulatableGroups.map(group => (
          <MenuItem key={group.slug} disabled={simulationLoading} onClick={() => onSelectGroup(group.slug ?? "")}>
            <Typography variant="bodyMd">{group.name}</Typography>
          </MenuItem>
        ))
      )}
    </Menu>
  );
}
