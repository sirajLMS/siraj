"use client";

import { useQuery } from "@apollo/client/react";
import { CreditCardOutlined, ReceiptOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
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
import { alpha, type Theme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { myPaymentsLedgerQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function formatMethodLabel(method: string | null): string {
  if (!method) return "—";
  return method
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PaymentRow {
  id: string;
  studentId: string | null;
  studentName: string | null;
  creditsPurchased: number;
  /** Credit hours granted by hour-package purchases; null for class-credit rows. */
  creditHours: number | null;
  amount: string;
  currency: string;
  packageName: string | null;
  /** True processing gateway (card/none/…) — kept for reference. */
  paymentGateway: string;
  /** How the money moved (Cash / Online Account / …) — what parents recognize. */
  paymentMethodType: string | null;
  paymentDate: string;
}

function PaymentTable({ rows }: Readonly<{ rows: readonly PaymentRow[] }>) {
  return (
    <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow
            sx={theme => ({ bgcolor: theme.palette.action.hover, borderBottom: `2px solid ${theme.palette.divider}` })}
          >
            <HeaderCell label="Student" />
            <HeaderCell label="Credits" align="center" />
            <HeaderCell label="Amount" align="right" />
            <HeaderCell label="Package" />
            <HeaderCell label="Method" />
            <HeaderCell label="Date" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <PaymentRowCells key={row.id} row={row} zebra={idx % 2 === 1} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const headerCellSx = (theme: Theme) => ({
  fontWeight: 700,
  color: theme.palette.text.primary,
  py: 1.5,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

function HeaderCell({ label, align }: Readonly<{ label: string; align?: "left" | "center" | "right" }>) {
  return (
    <TableCell sx={headerCellSx} align={align}>
      {label}
    </TableCell>
  );
}

function PaymentRowCells({ row, zebra }: Readonly<{ row: PaymentRow; zebra: boolean }>) {
  return (
    <TableRow
      sx={theme => ({
        transition: theme.transitions.create("background-color"),
        bgcolor: zebra ? alpha(theme.palette.action.hover, 0.4) : "transparent",
        "&:hover": { bgcolor: theme.palette.action.hover },
      })}
    >
      <TableCell sx={{ py: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.studentName ?? "—"}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ py: 1.5 }}>
        {row.creditHours != null ? (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`+${row.creditHours.toFixed(2)} h`}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          />
        ) : (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={row.creditsPurchased ? `+${row.creditsPurchased}` : "—"}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          />
        )}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5 }}>
        <Typography
          variant="body2"
          sx={theme => ({ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: theme.palette.text.primary })}
        >
          {row.amount} {row.currency}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Chip size="small" variant="outlined" label={row.packageName ?? "—"} sx={{ borderRadius: 2 }} />
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <CreditCardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
          <Typography variant="caption">{formatMethodLabel(row.paymentMethodType)}</Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Typography
          variant="caption"
          sx={theme => ({ color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" })}
        >
          {new Date(row.paymentDate).toLocaleDateString("en", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function ChildHourBalanceCard(props: Readonly<{ studentId: string; name: string }>) {
  const { studentId, name } = props;
  const router = useRouter();
  const { data, loading } = useQuery(studentCreditHourBalanceQueryDocument, {
    variables: { studentId },
    fetchPolicy: "cache-and-network",
  });
  const balance = data?.studentCreditHourBalance;
  const remaining = balance?.creditHoursRemaining != null ? Number(balance.creditHoursRemaining) : null;
  const low = balance?.lowHoursThreshold != null && remaining != null && remaining <= balance.lowHoursThreshold;
  return (
    <Card
      variant="outlined"
      sx={theme => ({
        borderRadius: 3,
        minWidth: 220,
        flex: "0 0 auto",
        borderColor: low ? theme.palette.warning.main : theme.palette.divider,
      })}
    >
      <CardContent sx={{ display: "grid", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={theme => ({ color: theme.palette.text.secondary, textTransform: "uppercase", letterSpacing: "0.04em" })}
        >
          {name}
        </Typography>
        {loading ? (
          <CircularProgress size={20} sx={{ my: 1 }} />
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {remaining != null ? `${remaining.toFixed(2)} h` : "—"}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={theme => ({ color: low ? theme.palette.warning.main : theme.palette.text.secondary })}
        >
          {low ? "Low balance — consider a top-up" : "Credit-hours balance"}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => router.push("/billing/invoices")}
          sx={{ mt: 1, alignSelf: "flex-start" }}
        >
          Top up
        </Button>
      </CardContent>
    </Card>
  );
}

function ChildrenHourBalanceStrip(props: Readonly<{ rows: readonly PaymentRow[] }>) {
  const children = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of props.rows) {
      if (row.studentId && !seen.has(row.studentId)) seen.set(row.studentId, row.studentName ?? "Student");
    }
    return [...seen].map(([studentId, name]) => ({ studentId, name }));
  }, [props.rows]);
  if (children.length === 0) return null;
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
      {children.map(child => (
        <ChildHourBalanceCard key={child.studentId} studentId={child.studentId} name={child.name} />
      ))}
    </Stack>
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
      studentId: p.studentId ?? null,
      studentName: p.studentName ?? null,
      creditsPurchased: p.creditsPurchased ?? 0,
      creditHours: p.creditHours ?? null,
      amount: p.amount ?? "0",
      currency: p.currency ?? "",
      packageName: p.packageName ?? null,
      paymentGateway: p.paymentGateway ?? "",
      paymentMethodType: p.paymentMethodType ?? null,
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
      <ChildrenHourBalanceStrip rows={rows} />
      <PaymentListBody rows={rows} loading={loading} />
    </DesktopPageContainer>
  );
}
