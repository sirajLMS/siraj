"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type React from "react";
import {
  TagInputShared,
  type TagInputSharedProps,
} from "@/frontend/common/components/ui/input/tagInput/TagInputShared";

export type TagInputProps = TagInputSharedProps;

const DESKTOP_INPUT_SX_EXT: SxProps<Theme> = {
  margin: 0.5,
  flexGrow: 1,
};

export const TagInputDesktop: React.FC<TagInputProps> = (props: TagInputProps): React.ReactNode => {
  return <TagInputShared {...props} inputSxExt={DESKTOP_INPUT_SX_EXT} />;
};
