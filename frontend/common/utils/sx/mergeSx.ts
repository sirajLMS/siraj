import type { SxProps, Theme } from "@mui/material/styles";

export function mergeSx(...styles: Array<SxProps<Theme> | undefined>): SxProps<Theme> {
  const defined = styles.filter((style): style is SxProps<Theme> => style != null);
  let result: SxProps<Theme>;
  if (defined.length === 0) {
    result = {};
  } else if (defined.length === 1) {
    result = defined[0];
  } else {
    result = defined as unknown as SxProps<Theme>;
  }
  return result;
}
