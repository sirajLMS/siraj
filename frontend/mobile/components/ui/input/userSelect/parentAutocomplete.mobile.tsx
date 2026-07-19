"use client";

import { ParentAutocomplete, type ParentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  mobileUserSelectSlotProps,
  mobileUserSelectSx,
} from "@/frontend/mobile/components/ui/input/userSelect/userSelect.mobile.styles";

export function ParentAutocompleteMobile(props: ParentAutocompleteProps) {
  return (
    <ParentAutocomplete
      {...props}
      size={props.size ?? "medium"}
      sx={props.sx ?? mobileUserSelectSx}
      slotProps={props.slotProps ?? mobileUserSelectSlotProps}
    />
  );
}
