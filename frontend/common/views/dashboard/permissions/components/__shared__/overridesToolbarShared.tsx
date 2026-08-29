"use client";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  type ButtonGroupSelectorButton,
  type ButtonGroupSelectorOptions,
  ButtonGroupSelectorShared,
} from "@/frontend/common/components/ui/input";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { OverridesToolbarMode, OverridesToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";

export interface OverridesToolbarSharedOptions {
  readonly toolbarContainerSx: SxProps<Theme>;
  readonly textFieldSx: SxProps<Theme>;
}

const MODE_GROUP_OPTIONS: ButtonGroupSelectorOptions = {
  buttonGroupWidth: "auto",
  useFlexButton: true,
  buttonSx: { whiteSpace: "nowrap" },
};

export function OverridesToolbarShared({
  labels,
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  options,
}: Readonly<OverridesToolbarProps> & { readonly options: OverridesToolbarSharedOptions }) {
  const modeButtons: ReadonlyArray<ButtonGroupSelectorButton<OverridesToolbarMode>> = [
    { value: "effective", label: labels.effectivePermissions },
    { value: "edit", label: labels.editOverrides },
  ];

  const handleModeSelect = (value: OverridesToolbarMode | null) => {
    if (value !== null) {
      onModeChange(value);
    }
  };

  return (
    <Box sx={options.toolbarContainerSx}>
      <ButtonGroupSelectorShared<OverridesToolbarMode>
        selectedValue={mode}
        onSelect={handleModeSelect}
        buttons={modeButtons}
        title={labels.overridesTab}
        ariaLabel={labels.overridesTab}
        options={MODE_GROUP_OPTIONS}
      />
      <SearchBarField
        value={searchQuery}
        placeholder={labels.filterPermissions}
        onChange={onSearchChange}
        sx={options.textFieldSx}
      />
    </Box>
  );
}
