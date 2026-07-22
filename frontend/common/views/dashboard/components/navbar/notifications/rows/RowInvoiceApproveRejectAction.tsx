"use client";

import { Button, Stack } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";

export interface RowInvoiceApproveRejectActionProps {
  readonly deliveryId: string;
  readonly invoiceId: string;
  readonly onApprove: (deliveryId: string, invoiceId: string) => void;
  readonly onReject: (deliveryId: string, invoiceId: string) => void;
}

export function RowInvoiceApproveRejectAction({
  deliveryId,
  invoiceId,
  onApprove,
  onReject,
}: Readonly<RowInvoiceApproveRejectActionProps>) {
  const { approveInvoice: approveLabel, rejectInvoice: rejectLabel } = useAppTranslation().notificationsTranslations;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignSelf: "flex-start" }}>
      <Button
        size="small"
        variant="text"
        color="success"
        onClick={event => {
          event.stopPropagation();
          onApprove(deliveryId, invoiceId);
        }}
        sx={{ minWidth: 0, px: 0.5 }}
      >
        {approveLabel}
      </Button>
      <Button
        size="small"
        variant="text"
        color="error"
        onClick={event => {
          event.stopPropagation();
          onReject(deliveryId, invoiceId);
        }}
        sx={{ minWidth: 0, px: 0.5 }}
      >
        {rejectLabel}
      </Button>
    </Stack>
  );
}
