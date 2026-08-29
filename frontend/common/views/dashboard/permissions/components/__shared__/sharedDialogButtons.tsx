"use client";

import { Button, type ButtonProps, CircularProgress, type SxProps, type Theme } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

const dialogPrimaryActionSx = (theme: Theme) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  fontWeight: 700,
  borderRadius: 1.5,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
});

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

interface SharedDialogPrimaryActionProps {
  readonly label: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onClick?: () => void;
  readonly type?: NonNullable<ButtonProps["type"]>;
  readonly form?: string;
  readonly sx?: SxProps<Theme>;
}

function SharedDialogPrimaryAction({
  label,
  disabled,
  loading,
  onClick,
  type = "button",
  form,
  sx,
}: Readonly<SharedDialogPrimaryActionProps>) {
  return (
    <PrimaryPageAction
      onClick={onClick}
      disabled={disabled}
      type={type}
      form={form}
      sx={mergeSx(dialogPrimaryActionSx, sx)}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : label}
    </PrimaryPageAction>
  );
}

export function SharedDialogSaveButton({
  label,
  disabled,
  loading,
  onClick,
}: Readonly<Pick<SharedDialogPrimaryActionProps, "label" | "disabled" | "loading" | "onClick">>) {
  return <SharedDialogPrimaryAction label={label} disabled={disabled} loading={loading} onClick={onClick} />;
}

export function SharedDialogAssignButton({
  label,
  disabled,
  type,
  form,
  onClick,
  sx,
}: Readonly<Pick<SharedDialogPrimaryActionProps, "label" | "disabled" | "type" | "form" | "onClick" | "sx">>) {
  return (
    <SharedDialogPrimaryAction label={label} disabled={disabled} type={type} form={form} onClick={onClick} sx={sx} />
  );
}
