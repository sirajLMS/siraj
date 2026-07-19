"use client";

import { StaffAutocomplete, type StaffAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  mobileUserSelectSlotProps,
  mobileUserSelectSx,
} from "@/frontend/mobile/components/ui/input/userSelect/userSelect.mobile.styles";

export function StaffAutocompleteMobile(props: StaffAutocompleteProps) {
  return (
    <StaffAutocomplete
      {...props}
      size={props.size ?? "medium"}
      sx={props.sx ?? mobileUserSelectSx}
      slotProps={props.slotProps ?? mobileUserSelectSlotProps}
    />
  );
}
