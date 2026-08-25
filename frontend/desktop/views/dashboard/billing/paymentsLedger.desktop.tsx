"use client";

import { useQuery } from "@apollo/client/react";
import { CreditCardOutlined, ReceiptOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { myPaymentsLedgerQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function formatGatewayLabel(gateway: string): string {
  if (!gateway) return "—";
  return gateway
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PaymentRow {
  id: string;
  studentName: string | null;
  creditsPurchased: number;
  amount: string;
  currency: string;
  packageName: string | null;
  paymentGateway: string;
  paymentDate: string;
}

function PaymentTable({ rows }: Readonly<{ rows: readonly PaymentRow[] }>) {
  return (
    <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow sx={theme => ({ bgcolor: theme.palette.action.hover })}>
            <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              Credits
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Amount
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Package</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Gateway</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow
              key={row.id}
              sx={theme => ({
                transition: "background-color 0.2s",
                "&:hover": { bgcolor: theme.palette.action.hover },
              })}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.studentName ?? "—"}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  label={`+${row.creditsPurchased}`}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.amount} {row.currency}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  variant="outlined"
                  label={row.packageName ? row.packageName.charAt(0) + row.packageName.slice(1).toLowerCase() : "—"}
                  sx={{ borderRadius: 2 }}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <CreditCardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
                  <Typography variant="caption">{formatGatewayLabel(row.paymentGateway)}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {new Date(row.paymentDate).toLocaleDateString("en", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PaymentListBody({ rows, loading }: Readonly<{ rows: readonly PaymentRow[]; loading: boolean }>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (rows.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed", borderRadius: 3 }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <ReceiptOutlined sx={theme => ({ fontSize: 48, color: theme.palette.text.disabled, mb: 1 })} />
          <Typography variant="h6" sx={theme => ({ color: theme.palette.text.secondary })}>
            No payments yet
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled, mt: 0.5 })}>
            Your payment history will appear here once you make a purchase.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return <PaymentTable rows={rows} />;
}

export function PaymentsLedgerContainer() {
  const { data, loading, error } = useQuery(myPaymentsLedgerQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const rows: readonly PaymentRow[] =
    data?.myPaymentsLedger?.map(p => ({
      id: p.id ?? "",
      studentName: p.studentName ?? null,
      creditsPurchased: p.creditsPurchased ?? 0,
      amount: p.amount ?? "0",
      currency: p.currency ?? "",
      packageName: p.packageName ?? null,
      paymentGateway: p.paymentGateway ?? "",
      paymentDate: p.paymentDate ?? "",
    })) ?? [];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title="Payments Ledger" subtitle="Your payment history and purchased credits" />
      {error && !data ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load payments.
        </Alert>
      ) : null}
      <PaymentListBody rows={rows} loading={loading} />
    </DesktopPageContainer>
  );
}
