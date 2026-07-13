import type { GridColDef } from "@mui/x-data-grid";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ExchangeRateRow = {
  readonly id: string;
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string | null;
  readonly effectiveDate: string;
};

export function formatExchangeRateTimestamp(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type RateTableLabels = {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: string;
  readonly source: string;
  readonly effectiveDate: string;
};

export function buildExchangeRateColumns(labels: RateTableLabels): GridColDef<ExchangeRateRow>[] {
  return [
    {
      field: "fromCurrency",
      headerName: labels.fromCurrency,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => (
        <CurrencyDisplay code={row.fromCurrency} parts={[CurrencyDisplayPart.Label, CurrencyDisplayPart.Symbol]} />
      ),
    },
    {
      field: "toCurrency",
      headerName: labels.toCurrency,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => (
        <CurrencyDisplay code={row.toCurrency} parts={[CurrencyDisplayPart.Label, CurrencyDisplayPart.Symbol]} />
      ),
    },
    {
      field: "rate",
      headerName: labels.rate,
      width: 120,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "source",
      headerName: labels.source,
      flex: 1,
      minWidth: 140,
      valueFormatter: value => value || "—",
    },
    {
      field: "effectiveDate",
      headerName: labels.effectiveDate,
      flex: 1.2,
      minWidth: 180,
      valueFormatter: value => formatExchangeRateTimestamp(String(value ?? "")),
    },
  ];
}
