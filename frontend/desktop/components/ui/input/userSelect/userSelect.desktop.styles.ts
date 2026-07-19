import type { SxProps, Theme } from "@mui/material/styles";
import type { AudienceAutocompleteSlotProps } from "@/frontend/common/components/ui/input/userSelect/types";

export const desktopUserSelectSx: SxProps<Theme> = {
  minWidth: 200,
};

export const desktopUserSelectSlotProps: AudienceAutocompleteSlotProps = {
  popper: {
    placement: "bottom-start",
  },
};
