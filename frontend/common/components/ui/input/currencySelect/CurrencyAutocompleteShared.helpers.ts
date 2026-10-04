import { createFilterOptions } from "@mui/material/Autocomplete";
import type * as React from "react";
import { getCurrencyOptionRowLabel } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.utils";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export const currencyFilterOptions = createFilterOptions<CurrencyOption>({
  matchFrom: "any",
  stringify: option => `${option.code as string} ${option.symbol} ${getCurrencyOptionRowLabel(option, "en")}`,
});

export function resolveCurrencyOptions(
  allOptions: readonly CurrencyOption[],
  allowedCodes: readonly CurrencyCode[] | undefined,
  excludedCodes: readonly CurrencyCode[] | undefined,
  catalogLoaded: boolean,
  currency: CurrencyOption | null | undefined
): readonly CurrencyOption[] {
  if (!catalogLoaded && currency) {
    const selected = allOptions.find(opt => opt.code === currency.code);
    return selected ? [selected] : [];
  }
  let filtered: readonly CurrencyOption[] = allOptions;
  if (allowedCodes && allowedCodes.length > 0) {
    filtered = filtered.filter(option => allowedCodes.includes(option.code));
  }
  if (excludedCodes && excludedCodes.length > 0) {
    filtered = filtered.filter(option => !excludedCodes.includes(option.code) || option.code === currency?.code);
  }
  return filtered;
}

export function buildAutocompleteSx(
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties {
  return {
    ...style,
    ...(listAttached && {
      "& .MuiOutlinedInput-root": {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        ...(isOpen && {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }),
      },
    }),
  };
}
