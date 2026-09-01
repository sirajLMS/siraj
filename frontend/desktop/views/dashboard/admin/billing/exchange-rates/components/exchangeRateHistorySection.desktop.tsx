"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useMemo } from "react";
import { buildExchangeRateColumns } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRateHistoryProps } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/types";
import {
  currencyCodeToOption,
  currencyOptionToCode,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/utils";
import { DesktopAppDataGrid, desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";

export function ExchangeRateHistorySectionDesktop({ labels, historyViewModel }: Readonly<ExchangeRateHistoryProps>) {
  const { fromCurrency, toCurrency, maxDays, rows, loading, fromOptions, toOptions, dayOptions } = historyViewModel;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const columns = useMemo(() => buildExchangeRateColumns(labels.rateTable), [labels.rateTable]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ ...desktopSectionContentInsetSx, display: "flex", flexDirection: "column", gap: 2, pb: 0 }}>
        <Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.history.subtitle}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.history.maxDays(maxDays)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ minWidth: 200 }}>
            <CurrencySelectDesktop
              label={labels.rateTable.fromCurrency}
              currency={currencyCodeToOption(fromCurrency)}
              setCurrencyAction={option => historyViewModel.onFromCurrencyChange(currencyOptionToCode(option))}
              allowedCodes={fromOptions}
              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <CurrencySelectDesktop
              label={labels.rateTable.toCurrency}
              currency={currencyCodeToOption(toCurrency)}
              setCurrencyAction={option => historyViewModel.onToCurrencyChange(currencyOptionToCode(option))}
              allowedCodes={toOptions}
              fullWidth
            />
          </Box>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="fx-history-days-desktop">{labels.history.daysLabel}</InputLabel>
            <Select
              labelId="fx-history-days-desktop"
              label={labels.history.daysLabel}
              value={maxDays}
              onChange={event => historyViewModel.onMaxDaysChange(event.target.value)}
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
