"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type React from "react";
import {
  TagInputShared,
  type TagInputSharedProps,
} from "@/frontend/common/components/ui/input/tagInput/TagInputShared";

export type TagInputProps = TagInputSharedProps;

const MOBILE_CHIP_SX_EXT: SxProps<Theme> = {
  minHeight: 36,
  fontSize: 14,
};

const MOBILE_LABEL_SX_EXT: SxProps<Theme> = {
  fontSize: "0.95rem",
};

const MOBILE_INPUT_SX_EXT: SxProps<Theme> = {
  margin: 0.5,
  flexGrow: 1,
  padding: 0.75,
  minHeight: "36px",
};

const MOBILE_CHIP_EDIT_INPUT_SX_EXT: SxProps<Theme> = (theme: Theme) => ({
  fontSize: 15,
  padding: theme.spacing(0.5, 0.75),
  minWidth: "80px",
  minHeight: "32px",
});

export const TagInputMobile: React.FC<TagInputProps> = (props: TagInputProps): React.ReactNode => {
  return (
    <TagInputShared
      {...props}
      chipSize="medium"
      chipSxExt={MOBILE_CHIP_SX_EXT}
      labelSxExt={MOBILE_LABEL_SX_EXT}
      inputSxExt={MOBILE_INPUT_SX_EXT}
      chipEditInputSxExt={MOBILE_CHIP_EDIT_INPUT_SX_EXT}
    />
  );
};
