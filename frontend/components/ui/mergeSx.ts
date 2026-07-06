import type { SxProps, Theme } from "@mui/material/styles";

export function mergeSx(...styles: Array<SxProps<Theme> | undefined>): SxProps<Theme> {
  const defined = styles.filter((style): style is SxProps<Theme> => style != null);
  if (defined.length === 0) {
    return {};
  }
  if (defined.length === 1) {
    return defined[0];
  }

  return defined as unknown as SxProps<Theme>;
}
