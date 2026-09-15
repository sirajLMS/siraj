"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { CarryoverBalanceQuery_carryoverBalance } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Row snapshot the confirm dialogs operate on. Grid rows satisfy this shape
 * directly; `linkedSessionCount` stays optional because the list selection does
 * not expose it yet, so hosts pass it only when it is known ahead of time.
 */
export type CarryoverConfirmRow = Pick<
  CarryoverBalanceQuery_carryoverBalance,
  "id" | "teacherName" | "payable" | "teacherCurrency" | "paymentDate" | "expenseId"
> & {
  readonly linkedSessionCount?: number | null;
};

export interface CarryoverConfirmScaffoldProps {
  readonly open: boolean;
  /** In-flight mutation; locks Escape/backdrop close and both actions. */
  readonly busy: boolean;
  readonly title: string;
  readonly body?: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  /** Disable the confirm action independently of loading state (e.g. guard conditions). */
  readonly confirmDisabled?: boolean;
  /** Accessible label for the close action (if host exposes one). */
  readonly closeAriaLabel?: string;
  /** Label/value detail blocks (the target summary, audit note, guard banner). */
  readonly children?: ReactNode;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

/**
 * Carryover confirm dialog contract collapsed onto the shared
 * `BaseDeleteDialog` scaffold: title / body / cancel / confirm with the detail
 * list rendered through the children slot.
 */
export function CarryoverConfirmScaffold({
  open,
  busy,
  title,
  body = "",
  cancelLabel,
  confirmLabel,
  confirmDisabled,
  closeAriaLabel,
  children,
  onClose,
  onConfirm,
}: Readonly<CarryoverConfirmScaffoldProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      isLoading={busy}
      title={title}
      body={body}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      confirmDisabled={confirmDisabled}
      closeAriaLabel={closeAriaLabel}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {children}
    </BaseDeleteDialog>
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
