"use client";

import { TeacherAutocomplete, type TeacherAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  mobileUserSelectSlotProps,
  mobileUserSelectSx,
} from "@/frontend/mobile/components/ui/input/userSelect/userSelect.mobile.styles";

export function TeacherAutocompleteMobile(props: TeacherAutocompleteProps) {
  return (
    <TeacherAutocomplete
      {...props}
      size={props.size ?? "medium"}
      sx={props.sx ?? mobileUserSelectSx}
      slotProps={props.slotProps ?? mobileUserSelectSlotProps}
    />
  );
}
