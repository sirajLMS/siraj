import type { SxProps, Theme } from "@mui/material/styles";

export function mergeSx(base: SxProps<Theme>, extra?: SxProps<Theme>): SxProps<Theme> {
  if (!extra) {
    return base;
  }

  return [base, extra] as unknown as SxProps<Theme>;
}
