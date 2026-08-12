"use client";

import { Button, type ButtonProps, type SxProps, type Theme } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

function makeButton(variant: ButtonProps["variant"], baseSx: SxProps<Theme>) {
  return function SxButton({ sx, ...props }: Readonly<ButtonProps>) {
    return <Button variant={variant} {...props} sx={mergeSx(baseSx, sx)} />;
  };
}

export const PrimaryPageAction = makeButton("contained", theme => ({
  borderRadius: theme.layout.radius.button,
  typography: "labelMd",
  letterSpacing: "0.1em",
}));

export const FilterButton = makeButton("outlined", theme => ({
  borderColor: theme.palette.border.light,
  color: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
}));

export const ExportButton = makeButton("contained", theme => ({
  borderColor: theme.palette.border.main,
  color: theme.palette.onPrimary,
  backgroundColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
}));
