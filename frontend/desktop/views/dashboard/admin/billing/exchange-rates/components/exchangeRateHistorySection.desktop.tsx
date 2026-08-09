"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useMemo } from "react";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import { buildExchangeRateColumns } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRateHistoryProps } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/types";
import { DesktopAppDataGrid, desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui";

export function ExchangeRateHistorySectionDesktop({ labels, historyViewModel }: Readonly<ExchangeRateHistoryProps>) {
  const { fromCurrency, toCurrency, maxDays, rows, loading, fromOptions, toOptions, dayOptions } = historyViewModel;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ ...desktopSectionContentInsetSx, display: "flex", flexDirection: "column", gap: 2, pb: 0 }}>
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
            <InputLabel id="fx-history-to-desktop">{labels.rateTable.toCurrency}</InputLabel>
            <Select
              labelId="fx-history-to-desktop"
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
            <InputLabel id="fx-history-days-desktop">{labels.history.daysLabel}</InputLabel>
            <Select
              labelId="fx-history-days-desktop"
              label={labels.history.daysLabel}
              value={maxDays}
              onChange={event => historyViewModel.onMaxDaysChange(event.target.value as (typeof dayOptions)[number])}
            >
              {dayOptions.map(days => (
                <MenuItem key={days} value={days}>
                  {labels.history.maxDays(days)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={labels.history.empty}
        autoHeight
        disableColumnMenu
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
