"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRateHistoryProps } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/types";

export function ExchangeRateHistorySectionMobile({ labels, historyViewModel }: Readonly<ExchangeRateHistoryProps>) {
  const { fromCurrency, toCurrency, maxDays, rows, loading, fromOptions, toOptions, dayOptions } = historyViewModel;

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
                historyViewModel.onFromCurrencyChange(parsed);
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
                historyViewModel.onToCurrencyChange(parsed);
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
            onChange={event =>
              historyViewModel.onMaxDaysChange(Number(event.target.value) as (typeof dayOptions)[number])
            }
          >
            {dayOptions.map(days => (
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
