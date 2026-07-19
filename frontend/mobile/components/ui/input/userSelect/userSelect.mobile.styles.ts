import type { SxProps, Theme } from "@mui/material/styles";
import type { AudienceAutocompleteSlotProps } from "@/frontend/common/components/ui/input/userSelect/types";

export const mobileUserSelectSx: SxProps<Theme> = {
  width: "100%",
};

export const mobileUserSelectSlotProps: AudienceAutocompleteSlotProps = {
  popper: {
    placement: "bottom-start",
  },
};
