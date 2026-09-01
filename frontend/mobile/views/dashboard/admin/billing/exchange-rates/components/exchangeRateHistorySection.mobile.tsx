"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { formatExchangeRateTimestamp } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import type { ExchangeRateHistoryProps } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/types";
import {
  currencyCodeToOption,
  currencyOptionToCode,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/utils";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { CurrencySelectMobile } from "@/frontend/mobile/components/ui/input/currencySelect";

export function ExchangeRateHistorySectionMobile({ labels, historyViewModel }: Readonly<ExchangeRateHistoryProps>) {
  const { fromCurrency, toCurrency, maxDays, rows, loading, fromOptions, toOptions, dayOptions } = historyViewModel;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography sx={theme => ({ color: theme.palette.text.secondary })} variant="bodyMd">
          {labels.history.subtitle}
        </Typography>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.history.maxDays(maxDays)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <CurrencySelectMobile
          label={labels.rateTable.fromCurrency}
          currency={currencyCodeToOption(fromCurrency)}
          setCurrencyAction={option => historyViewModel.onFromCurrencyChange(currencyOptionToCode(option))}
          allowedCodes={fromOptions}
          fullWidth
        />

        <CurrencySelectMobile
          label={labels.rateTable.toCurrency}
          currency={currencyCodeToOption(toCurrency)}
          setCurrencyAction={option => historyViewModel.onToCurrencyChange(currencyOptionToCode(option))}
          allowedCodes={toOptions}
          fullWidth
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="fx-history-days-mobile">{labels.history.daysLabel}</InputLabel>
          <Select
            labelId="fx-history-days-mobile"
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

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.history.empty}
        getKey={row => row.id}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={row => (
          <MobileCardListItem variant="edge-to-edge">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {row.fromCurrency} → {row.toCurrency}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{row.rate}</Typography>
              </Box>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.source ?? "—"}
              </Typography>
              <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                {formatExchangeRateTimestamp(row.effectiveDate)}
              </Typography>
            </Box>
          </MobileCardListItem>
        )}
      />
    </Box>
  );
}
