import type { ButtonProps } from "@mui/material";
import type { Theme } from "@mui/material/styles";

export interface ClassSessionActionButtonSharedOptions {
  readonly buttonSize: ButtonProps["size"] | undefined;
  readonly buttonPx: number;
  readonly buttonPy: number;
  readonly buttonFontSize: string | undefined;
}

export function buildActionButtonBaseSx(theme: Theme, options: ClassSessionActionButtonSharedOptions) {
  return {
    ...theme.typography.labelUppercase,
    px: options.buttonPx,
    py: options.buttonPy,
    borderRadius: theme.layout.radius.button,
    fontSize: options.buttonFontSize,
  };
}
