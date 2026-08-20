import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type * as React from "react";

const StyledInput = styled("input", { name: "BoxPrefixInput" })();

export const BoxPrefixInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    readonly sx?: SxProps<Theme>;
    readonly ref?: React.Ref<HTMLInputElement>;
  }
> = ({ sx, ref, ...props }): React.ReactNode => <StyledInput ref={ref} sx={sx} {...props} />;
