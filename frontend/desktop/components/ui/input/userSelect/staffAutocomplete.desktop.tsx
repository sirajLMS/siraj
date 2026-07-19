"use client";

import { StaffAutocomplete, type StaffAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  desktopUserSelectSlotProps,
  desktopUserSelectSx,
} from "@/frontend/desktop/components/ui/input/userSelect/userSelect.desktop.styles";

export function StaffAutocompleteDesktop(props: StaffAutocompleteProps) {
  return (
    <StaffAutocomplete
      {...props}
      size={props.size ?? "small"}
      sx={props.sx ?? desktopUserSelectSx}
      slotProps={props.slotProps ?? desktopUserSelectSlotProps}
    />
  );
}
