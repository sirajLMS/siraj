"use client";

import { UserAutocomplete, type UserAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import {
  desktopUserSelectSlotProps,
  desktopUserSelectSx,
} from "@/frontend/desktop/components/ui/input/userSelect/userSelect.desktop.styles";

export function UserAutocompleteDesktop(props: UserAutocompleteProps) {
  return (
    <UserAutocomplete
      {...props}
      size={props.size ?? "small"}
      sx={props.sx ?? desktopUserSelectSx}
      slotProps={props.slotProps ?? desktopUserSelectSlotProps}
    />
  );
}
