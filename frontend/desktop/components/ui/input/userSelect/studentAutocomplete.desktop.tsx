"use client";

import { StudentAutocomplete, type StudentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  desktopUserSelectSlotProps,
  desktopUserSelectSx,
} from "@/frontend/desktop/components/ui/input/userSelect/userSelect.desktop.styles";

export function StudentAutocompleteDesktop(props: StudentAutocompleteProps) {
  return (
    <StudentAutocomplete
      {...props}
      size={props.size ?? "small"}
      sx={props.sx ?? desktopUserSelectSx}
      slotProps={props.slotProps ?? desktopUserSelectSlotProps}
    />
  );
}
