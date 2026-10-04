"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  CURRENCY_PARAM,
  MONTH_PARAM,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.constants";
import { isMonthParam } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.helpers";

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
export function useUrlSearchParamSync({ month, currency }: Readonly<UrlSyncProps>): void {
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
export function useFilterDeepLink({ month, currency, setMonth, setCurrency }: Readonly<DeepLinkProps>): void {
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
