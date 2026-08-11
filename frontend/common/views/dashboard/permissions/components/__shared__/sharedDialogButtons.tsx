"use client";

import { Button } from "@mui/material";

export function SharedDialogCancelButton({
  label,
  disabled,
  onClick,
}: Readonly<{ label: string; disabled: boolean; onClick: () => void }>) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      type="button"
      variant="text"
      sx={theme => ({
        color: theme.palette.text.secondary,
        fontWeight: 700,
        borderRadius: 1.5,
      })}
    >
      {label}
    </Button>
  );
}
