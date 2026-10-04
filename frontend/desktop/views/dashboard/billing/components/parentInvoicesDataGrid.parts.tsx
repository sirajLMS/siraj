"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { ParentInvoicesDataGridDesktopLabels } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui";

const StyledFeeTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

type InvoiceRowCellProps = Readonly<{
  row: ParentInvoiceRow;
  labels: ParentInvoicesDataGridDesktopLabels;
}>;

export function InvoicePaidDateCell({ row, labels }: InvoiceRowCellProps) {
  return (
    <Box>
      <Typography variant="bodyMd">{row.paidDate}</Typography>
      {row.status === InvoiceStatus.Paid && row.hasPaymentProof ? (
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.hasPaymentProofHint}
        </Typography>
      ) : null}
    </Box>
  );
}

export function InvoiceFeeCell({ row }: Readonly<Pick<InvoiceRowCellProps, "row">>) {
  return <StyledFeeTypography variant="bodyMd">{row.fee}</StyledFeeTypography>;
}

export function InvoiceStatusCell({ row, labels }: InvoiceRowCellProps) {
  return (
    <DesktopStatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status] ?? row.status} />
  );
}
