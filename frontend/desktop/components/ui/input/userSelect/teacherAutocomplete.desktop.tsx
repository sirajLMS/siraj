"use client";

import { TeacherAutocomplete, type TeacherAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  desktopUserSelectSlotProps,
  desktopUserSelectSx,
} from "@/frontend/desktop/components/ui/input/userSelect/userSelect.desktop.styles";

export function TeacherAutocompleteDesktop(props: TeacherAutocompleteProps) {
  return (
    <TeacherAutocomplete
      {...props}
      size={props.size ?? "small"}
      sx={props.sx ?? desktopUserSelectSx}
      slotProps={props.slotProps ?? desktopUserSelectSlotProps}
    />
  );
}
