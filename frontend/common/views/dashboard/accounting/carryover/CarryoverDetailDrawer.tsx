"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, Drawer, useTheme } from "@mui/material";
import { useState } from "react";
import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { carryoverBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  FOOTER_SX,
  PAPER_SX,
  SCROLL_BODY_SX,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.constants";
import {
  DrawerBody,
  DrawerHeader,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.parts";
import { LinkedSessionsSection } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.sessions";
import { UnpayCarryoverDialog } from "@/frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, DashboardBillingPayroll, Translation } from "@/shared/locale/namespaces";

export interface CarryoverDetailDrawerProps {
  /** Carryover balance id to drill into; the detail query only runs while open. */
  readonly carryoverId: string;
  /** Whether the drawer is visible. */
  readonly open: boolean;
  /** Close request raised by the close button, Escape, or backdrop click. */
  readonly onClose: () => void;
}

/**
 * Right-side drill-down for a single carryover balance: the full record fields,
 * its paid/disabled chips, and the linked sessions table with per-session
 * snapshot amounts and current calculation statuses, all fetched on open.
 * Paid balances expose a pinned footer with the same unpay confirm flow the
 * list row menu uses.
 */
export function CarryoverDetailDrawer({ carryoverId, open, onClose }: Readonly<CarryoverDetailDrawerProps>) {
  const theme = useTheme();
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const commonLabels = useAppTranslation(Translation.Common);
  const statusLabels: Record<CalculationStatus, string> = payrollLabels.status;
  const { data, loading, error, refetch } = useQuery(carryoverBalanceQueryDocument, {
    variables: { id: carryoverId },
    fetchPolicy: "cache-and-network",
    skip: !open,
  });
  const balance = data?.carryoverBalance ?? null;
  // Until the detail resolves there is no name to interpolate, so fall back to
  // the generic page title instead of the template's trailing empty slot.
  const teacherName = balance?.teacherName ?? "";
  const title = teacherName === "" ? labels.title : labels.drawer.title(teacherName);
  const [unpayOpen, setUnpayOpen] = useState(false);
  const canUnpay = balance !== null && (balance.isPaid ?? false);
  const handleUnpayDone = () => {
    void refetch();
  };

  return (
    <Drawer
      anchor={theme.direction === "rtl" ? "left" : "right"}
      open={open}
      onClose={onClose}
      aria-label={title}
      slotProps={{ paper: { sx: PAPER_SX } }}
      sx={drawerTheme => ({ zIndex: drawerTheme.zIndex.drawer + 2 })}
    >
      <DrawerHeader
        balance={balance}
        title={title}
        labels={labels}
        closeLabel={commonLabels.ariaClose}
        onClose={onClose}
      />
      <Box sx={SCROLL_BODY_SX}>
        <DrawerBody
          balance={balance}
          loading={loading}
          hasError={Boolean(error)}
          labels={labels}
          commonLabels={commonLabels}
        />
        {balance !== null ? (
          <LinkedSessionsSection
            carryoverId={carryoverId}
            open={open}
            linkedSessionCount={balance.linkedSessionCount}
            labels={labels}
            commonLabels={commonLabels}
            statusLabels={statusLabels}
          />
        ) : null}
      </Box>
      {canUnpay ? (
        <>
          <Box sx={FOOTER_SX}>
            <Button variant="outlined" color="error" onClick={() => setUnpayOpen(true)}>
              {labels.action.unpay}
            </Button>
          </Box>
          <UnpayCarryoverDialog
            open={unpayOpen}
            row={balance}
            onClose={() => setUnpayOpen(false)}
            onDone={handleUnpayDone}
          />
        </>
      ) : null}
    </Drawer>
  );
}
