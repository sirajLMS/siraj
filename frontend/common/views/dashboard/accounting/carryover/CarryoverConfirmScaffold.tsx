"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { CarryoverBalanceQuery_carryoverBalance } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Row snapshot the confirm dialogs operate on. Grid rows satisfy this shape
 * directly; `linkedSessionCount` stays optional because the list selection does
 * not expose it yet, so hosts pass it only when it is known ahead of time.
 */
export type CarryoverConfirmRow = Pick<
  CarryoverBalanceQuery_carryoverBalance,
  "id" | "teacherName" | "payable" | "teacherCurrency" | "paymentDate"
> & {
  readonly linkedSessionCount?: number | null;
};

const TITLE_ICON_SX = (theme: Theme) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  flexShrink: 0,
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.error.main,
});

const CANCEL_BUTTON_SX = (theme: Theme) => ({
  color: theme.palette.text.secondary,
  fontWeight: 700,
  borderRadius: 1.5,
});

const CONFIRM_BUTTON_SX = (theme: Theme) => ({
  fontWeight: 700,
  borderRadius: 1.5,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
  "&:hover": { backgroundColor: theme.palette.error.dark },
});

export interface CarryoverConfirmScaffoldProps {
  readonly open: boolean;
  /** In-flight mutation; locks Escape/backdrop close and both actions. */
  readonly busy: boolean;
  readonly title: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly closeAriaLabel: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function CarryoverConfirmScaffold({
  open,
  busy,
  title,
  cancelLabel,
  confirmLabel,
  closeAriaLabel,
  children,
  onClose,
  onConfirm,
}: Readonly<CarryoverConfirmScaffoldProps>) {
  return (
    <Dialog {...DialogPresets.confirm} open={open} onClose={busy ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={TITLE_ICON_SX} aria-hidden>
          <WarningAmberOutlined fontSize="small" />
        </Box>
        <Typography component="span" variant="titleLg" sx={{ flex: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton aria-label={closeAriaLabel} onClick={onClose} disabled={busy} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} disabled={busy} sx={CANCEL_BUTTON_SX}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={busy} aria-busy={busy} sx={CONFIRM_BUTTON_SX}>
          {busy ? <CircularProgress size={20} sx={theme => ({ color: theme.palette.onError })} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export interface CarryoverConfirmDetail {
  readonly label: string;
  readonly value: string;
}

export interface CarryoverConfirmDetailsProps {
  readonly details: readonly CarryoverConfirmDetail[];
}

/** Label/value summary box restating which carryover the confirmation targets. */
export function CarryoverConfirmDetails({ details }: Readonly<CarryoverConfirmDetailsProps>) {
  return (
    <Box
      component="dl"
      sx={theme => ({
        m: 0,
        p: 2,
        display: "grid",
        gap: 1,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainerLow,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      {details.map(detail => (
        <Box
          key={detail.label}
          sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}
        >
          <Typography component="dt" variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {detail.label}
          </Typography>
          <Typography component="dd" variant="bodyMd" sx={{ m: 0, fontWeight: 600 }}>
            {detail.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
