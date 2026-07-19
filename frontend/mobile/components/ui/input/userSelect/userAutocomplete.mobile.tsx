"use client";

import { UserAutocomplete, type UserAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  mobileUserSelectSlotProps,
  mobileUserSelectSx,
} from "@/frontend/mobile/components/ui/input/userSelect/userSelect.mobile.styles";

export function UserAutocompleteMobile(props: UserAutocompleteProps) {
  return (
    <UserAutocomplete
      {...props}
      size={props.size ?? "medium"}
      sx={props.sx ?? mobileUserSelectSx}
      slotProps={props.slotProps ?? mobileUserSelectSlotProps}
    />
  );
}
