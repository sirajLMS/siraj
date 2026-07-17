"use client";

import { useQuery } from "@apollo/client/react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { exchangeRateHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import type { ExchangeRateRow } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRatesLabels } from "@/shared/locale";

const HISTORY_DAY_OPTIONS = [7, 30, 90] as const;

export interface ExchangeRateHistorySectionMobileProps {
  readonly labels: ExchangeRatesLabels;
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
}

export function ExchangeRateHistorySectionMobile({
  labels,
  availablePairs,
}: Readonly<ExchangeRateHistorySectionMobileProps>) {
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
        <Typography sx={theme => ({ color: theme.palette.text.secondary })} variant="bodyMd">
          {labels.history.subtitle}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {labels.history.maxDays(maxDays)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="fx-history-from-mobile">{labels.rateTable.fromCurrency}</InputLabel>
          <Select
            labelId="fx-history-from-mobile"
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
          <InputLabel id="fx-history-to-mobile">{labels.rateTable.toCurrency}</InputLabel>
          <Select
            labelId="fx-history-to-mobile"
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
          <InputLabel id="fx-history-days-mobile">{labels.history.daysLabel}</InputLabel>
          <Select
            labelId="fx-history-days-mobile"
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

      <Box>
        {loading ? (
          <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 1 })}>{labels.history.empty}</Typography>
        ) : rows.length === 0 ? (
          <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 1 })}>{labels.history.empty}</Typography>
        ) : (
          rows.map(row => (
            <Box
              key={row.id}
              sx={{
                py: 1.5,
                borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {row.fromCurrency} → {row.toCurrency}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{row.rate}</Typography>
              </Box>
              <Typography variant="bodyMd" color="textSecondary">
                {row.source ?? "—"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatExchangeRateTimestamp(row.effectiveDate)}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
