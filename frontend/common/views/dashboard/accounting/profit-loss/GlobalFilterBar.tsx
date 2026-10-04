"use client";

import { Box } from "@mui/material";
import { format, isValid } from "date-fns";
import { useCallback, useMemo } from "react";
import type { FxWarning } from "@/backend/types";
import { CurrencySelect } from "@/frontend/common/components/ui";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { FilterBarShellShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/filterBarShellShared";
import {
  EMPTY_FX_WARNINGS,
  MONTH_FORMAT,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.constants";
import { parseMonth } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.helpers";
import {
  useFilterDeepLink,
  useUrlSearchParamSync,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.hooks";
import { FxWarningChip } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.parts";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";

interface GlobalFilterBarProps {
  /** Currency pairs the report excluded for missing FX rates; chip hidden while empty. */
  readonly fxWarnings?: readonly FxWarning[];
}

/**
 * Global filter bar of the profit & loss dashboard: accounting-month picker
 * (year-month precision), target-currency picker fed by the platform's
 * currency catalog, and the FX-exclusion warning chip. Month + currency live
 * in the persisted filter store (the query, tabs, pager, and CSV exports all
 * read the same state) and are mirrored into the URL for sharing.
 */
export function GlobalFilterBar({ fxWarnings = EMPTY_FX_WARNINGS }: Readonly<GlobalFilterBarProps>) {
  const t = useAppTranslation(DashboardAccountingProfitLoss);

  const month = useProfitLossFilterStore(state => state.month);
  const currency = useProfitLossFilterStore(state => state.currency);
  const setMonth = useProfitLossFilterStore(state => state.setMonth);
  const setCurrency = useProfitLossFilterStore(state => state.setCurrency);

  useFilterDeepLink({ month, currency, setMonth, setCurrency });
  useUrlSearchParamSync({ month, currency });

  const handleMonthChange = useCallback(
    (next: Date | null) => {
      if (next === null || !isValid(next)) return;
      setMonth(format(next, MONTH_FORMAT));
    },
    [setMonth]
  );

  const currencyOption = useMemo<CurrencyOption | null>(() => getCurrencyByCode(currency) ?? null, [currency]);
  const handleCurrencyChange = useCallback((option: CurrencyOption) => setCurrency(option.code), [setCurrency]);

  return (
    <FilterBarShellShared
      content={
        <>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 180 } }}>
            <AppDatePicker
              label={t.filter.month}
              value={parseMonth(month)}
              onChange={handleMonthChange}
              views={["year", "month"]}
              openTo="month"
              format={MONTH_FORMAT}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  slotProps: {
                    htmlInput: { "aria-label": t.filter.month, autoComplete: "off" },
                  },
                },
              }}
            />
          </Box>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 200 } }}>
            <CurrencySelect
              label={t.filter.currency}
              currency={currencyOption}
              setCurrencyAction={handleCurrencyChange}
              fullWidth
            />
          </Box>
          {fxWarnings.length > 0 ? <FxWarningChip warnings={fxWarnings} /> : null}
        </>
      }
      actions={null}
    />
  );
}
