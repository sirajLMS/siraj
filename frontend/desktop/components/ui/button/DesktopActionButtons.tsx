"use client";

import { Button, type ButtonProps } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export function DesktopPrimaryPageAction({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={mergeSx(
        theme => ({
          borderRadius: theme.layout.radius.button,
          typography: "labelMd",
          letterSpacing: "0.1em",
        }),
        sx
      )}
    />
  );
}

export function DesktopFilterButton({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="outlined"
      {...props}
      sx={mergeSx(
        theme => ({
          borderColor: theme.palette.border.light,
          color: theme.palette.primary.main,
          "&:hover": {
            backgroundColor: theme.palette.action.selected,
            borderColor: theme.palette.primary.dark,
          },
        }),
        sx
      )}
    />
  );
}

export function DesktopExportButton({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={mergeSx(
        theme => ({
          borderColor: theme.palette.border.main,
          color: theme.palette.onPrimary,
          backgroundColor: theme.palette.primary.main,
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }),
        sx
      )}
    />
  );
}
