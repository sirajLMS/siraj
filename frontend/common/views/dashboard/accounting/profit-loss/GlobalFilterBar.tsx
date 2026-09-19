"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import type { FxWarning } from "@/backend/types";
import { CurrencySelect } from "@/frontend/common/components/ui";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { FilterBarShellShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/filterBarShellShared";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";

/** Wire + display format of the accounting-month filter (year-month only). */
const MONTH_FORMAT = "yyyy-MM";

/** URL search-parameter names the filter bar keeps in sync. */
const MONTH_PARAM = "month";
const CURRENCY_PARAM = "currency";

/** Stable empty default for the optional FX-warning list prop. */
const EMPTY_FX_WARNINGS: readonly FxWarning[] = [];

/** Parses the stored YYYY-MM month into a calendar date for the month picker. */
function parseMonth(month: string): Date | null {
  const parsed = parse(month, MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return null;
  return parsed;
}

function isMonthParam(value: string | null): value is string {
  return value !== null && isValid(parse(value, MONTH_FORMAT, new Date()));
}

/** One "ORIGINAL → TARGET (N rows)" tooltip entry per FX warning. */
function formatFxPair(warning: Readonly<FxWarning>): string {
  return `${warning.originalCurrency} → ${warning.targetCurrency} (${warning.rowCount})`;
}

function joinFxPairs(warnings: readonly FxWarning[]): string {
  return warnings.map(formatFxPair).join(" · ");
}

interface UrlSyncProps {
  readonly month: string;
  readonly currency: CurrencyCode;
}

/**
 * Mirrors the settled month + currency into the address bar
 * (`?month=YYYY-MM&currency=CODE`) without a server round-trip, so the
 * visible report is shareable and survives a refresh. Month changes restart
 * pagination on the store side, so this runs after the store setters.
 */
function useUrlSearchParamSync({ month, currency }: Readonly<UrlSyncProps>): void {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(MONTH_PARAM, month);
    params.set(CURRENCY_PARAM, currency);
    const query = params.toString();
    if (`?${query}` === window.location.search) return;
    router.replace(`?${query}`, { scroll: false });
  }, [router, searchParams, month, currency]);
}

interface DeepLinkProps {
  readonly month: string;
  readonly currency: CurrencyCode;
  readonly setMonth: (month: string) => void;
  readonly setCurrency: (currency: CurrencyCode) => void;
}

/**
 * Adopts a shared `?month=YYYY-MM&currency=CODE` link once on mount: a valid
 * month string seeds the picker and a supported ISO 4217 code seeds the
 * currency. Invalid or absent values leave the persisted defaults intact.
 */
function useFilterDeepLink({ month, currency, setMonth, setCurrency }: Readonly<DeepLinkProps>): void {
  const searchParams = useSearchParams();
  const urlMonth = searchParams?.get(MONTH_PARAM) ?? null;
  const urlCurrency = searchParams?.get(CURRENCY_PARAM) ?? null;

  useEffect(() => {
    if (isMonthParam(urlMonth) && urlMonth !== month) {
      setMonth(urlMonth);
    }
  }, [urlMonth, month, setMonth]);

  useEffect(() => {
    const option = urlCurrency === null ? undefined : getCurrencyByCode(urlCurrency);
    if (option && option.code !== currency) {
      setCurrency(option.code);
    }
  }, [urlCurrency, currency, setCurrency]);
}

interface FxWarningChipProps {
  readonly warnings: readonly FxWarning[];
}

/**
 * FX-rate warning chip: rendered only when the report excluded rows for
 * missing conversion rates. The tooltip enumerates the affected currency
 * pairs with their excluded row counts, so the aggregate discrepancy is
 * explainable without leaving the dashboard.
 */
function FxWarningChip({ warnings }: Readonly<FxWarningChipProps>) {
  const t = useAppTranslation(DashboardAccountingProfitLoss);
  const excludedRows = warnings.reduce((total, warning) => total + warning.rowCount, 0);
  const chipLabel = t.fx.chip(excludedRows);
  const tooltipTitle: ReactNode = (
    <Typography sx={{ fontSize: "0.75rem" }}>{t.fx.tooltip(joinFxPairs(warnings))}</Typography>
  );
  return (
    <Tooltip title={tooltipTitle}>
      <Chip
        size="small"
        color="warning"
        variant="outlined"
        icon={<WarningAmberOutlined fontSize="small" />}
        label={chipLabel}
        sx={{ height: "auto", alignSelf: "center", whiteSpace: "normal" }}
      />
    </Tooltip>
  );
}

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
