"use client";

import { useQuery } from "@apollo/client/react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { exchangeRateHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import {
  buildExchangeRateColumns,
  type ExchangeRateRow,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRatesLabels } from "@/shared/locale";

const HISTORY_DAY_OPTIONS = [7, 30, 90] as const;

export interface ExchangeRateHistorySectionDesktopProps {
  readonly labels: ExchangeRatesLabels;
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
}

export function ExchangeRateHistorySectionDesktop({
  labels,
  availablePairs,
}: Readonly<ExchangeRateHistorySectionDesktopProps>) {
  const defaultPair = availablePairs[0] ?? { from: CurrencyCode.Usd, to: CurrencyCode.Sar };
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultPair.from);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(defaultPair.to);
  const [maxDays, setMaxDays] = useState<(typeof HISTORY_DAY_OPTIONS)[number]>(90);

  const { data, loading } = useQuery(exchangeRateHistoryQueryDocument, {
    variables: {
      from: fromCurrency,
      to: toCurrency,
      maxDays,
      paginationArgs: null,
    },
    fetchPolicy: "cache-and-network",
  });

  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);

  const rows: ExchangeRateRow[] = (data?.exchangeRateHistory?.rows ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate != null && rate.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: parseCurrencyCode(rate.fromCurrency) ?? fromCurrency,
      toCurrency: parseCurrencyCode(rate.toCurrency) ?? toCurrency,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));

  const fromOptions = useMemo(() => [...new Set(availablePairs.map(pair => pair.from))], [availablePairs]);
  const toOptions = useMemo(
    () => [...new Set(availablePairs.filter(pair => pair.from === fromCurrency).map(pair => pair.to))],
    [availablePairs, fromCurrency]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="bodyMd" color="textSecondary">
          {labels.history.subtitle}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {labels.history.maxDays(maxDays)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="fx-history-from-desktop">{labels.rateTable.fromCurrency}</InputLabel>
          <Select
            labelId="fx-history-from-desktop"
            label={labels.rateTable.fromCurrency}
            value={fromCurrency}
            onChange={event => {
              const parsed = parseCurrencyCode(event.target.value);
              if (parsed) {
                setFromCurrency(parsed);
              }
            }}
          >
            {fromOptions.map(currency => (
              <MenuItem key={currency} value={currency}>
                <CurrencyDisplay code={currency} parts={[CurrencyDisplayPart.Label, CurrencyDisplayPart.Code]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="fx-history-to-desktop">{labels.rateTable.toCurrency}</InputLabel>
          <Select
            labelId="fx-history-to-desktop"
            label={labels.rateTable.toCurrency}
            value={toCurrency}
            onChange={event => {
              const parsed = parseCurrencyCode(event.target.value);
              if (parsed) {
                setToCurrency(parsed);
              }
            }}
          >
            {(toOptions.length > 0 ? toOptions : [toCurrency]).map(currency => (
              <MenuItem key={currency} value={currency}>
                <CurrencyDisplay code={currency} parts={[CurrencyDisplayPart.Label, CurrencyDisplayPart.Code]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="fx-history-days-desktop">{labels.history.daysLabel}</InputLabel>
          <Select
            labelId="fx-history-days-desktop"
            label={labels.history.daysLabel}
            value={maxDays}
            onChange={event => setMaxDays(Number(event.target.value) as (typeof HISTORY_DAY_OPTIONS)[number])}
          >
            {HISTORY_DAY_OPTIONS.map(days => (
              <MenuItem key={days} value={days}>
                {labels.history.maxDays(days)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={labels.history.empty}
        autoHeight
        disableColumnMenu
      />
    </Box>
  );
}
