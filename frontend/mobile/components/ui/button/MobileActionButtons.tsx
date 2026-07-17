"use client";

import { Button, type ButtonProps } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export function MobilePrimaryPageAction({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="contained"
      size="large"
      {...props}
      sx={mergeSx(
        theme => ({
          borderRadius: theme.layout.radius.button,
          typography: "labelMd",
          letterSpacing: "0.1em",
          minHeight: 44,
          py: 1.5,
          width: "100%",
        }),
        sx
      )}
    />
  );
}

export function MobileFilterButton({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="outlined"
      size="large"
      {...props}
      sx={mergeSx(
        theme => ({
          borderColor: theme.palette.border.light,
          color: theme.palette.primary.main,
          minHeight: 44,
          width: "100%",
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

export function MobileExportButton({ sx, ...props }: Readonly<ButtonProps>) {
  return (
    <Button
      variant="contained"
      size="large"
      {...props}
      sx={mergeSx(
        theme => ({
          borderColor: theme.palette.border.main,
          color: theme.palette.onPrimary,
          backgroundColor: theme.palette.primary.main,
          minHeight: 44,
          width: "100%",
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }),
        sx
      )}
    />
  );
}
