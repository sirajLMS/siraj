"use client";

import { StudentAutocomplete, type StudentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  mobileUserSelectSlotProps,
  mobileUserSelectSx,
} from "@/frontend/mobile/components/ui/input/userSelect/userSelect.mobile.styles";

export function StudentAutocompleteMobile(props: StudentAutocompleteProps) {
  return (
    <StudentAutocomplete
      {...props}
      size={props.size ?? "medium"}
      sx={props.sx ?? mobileUserSelectSx}
      slotProps={props.slotProps ?? mobileUserSelectSlotProps}
    />
  );
}
