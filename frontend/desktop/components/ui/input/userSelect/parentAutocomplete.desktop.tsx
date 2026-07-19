"use client";

import { ParentAutocomplete, type ParentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  desktopUserSelectSlotProps,
  desktopUserSelectSx,
} from "@/frontend/desktop/components/ui/input/userSelect/userSelect.desktop.styles";

export function ParentAutocompleteDesktop(props: ParentAutocompleteProps) {
  return (
    <ParentAutocomplete
      {...props}
      size={props.size ?? "small"}
      sx={props.sx ?? desktopUserSelectSx}
      slotProps={props.slotProps ?? desktopUserSelectSlotProps}
    />
  );
}
