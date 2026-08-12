import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";

export const BoxPrefixInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    readonly sx?: SxProps<Theme>;
    readonly ref?: React.Ref<HTMLInputElement>;
  }
> = ({ sx, ref, ...props }): React.ReactNode => <Box component="input" ref={ref} sx={sx} {...(props as object)} />;
