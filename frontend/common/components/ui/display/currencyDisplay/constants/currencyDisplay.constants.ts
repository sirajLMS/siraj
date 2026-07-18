// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/currencyDisplay/currencyDisplay.constants.ts — byte-identical twins consolidated to a single common module)
export const CurrencyDisplayPart = {
  Flag: "flag",
  Label: "label",
  Symbol: "symbol",
  Code: "code",
} as const;

export type CurrencyDisplayPartValue = (typeof CurrencyDisplayPart)[keyof typeof CurrencyDisplayPart];

/** Fixed render order regardless of the order in `parts`. */
export const CURRENCY_DISPLAY_PART_ORDER: readonly CurrencyDisplayPartValue[] = [
  CurrencyDisplayPart.Flag,
  CurrencyDisplayPart.Label,
  CurrencyDisplayPart.Symbol,
  CurrencyDisplayPart.Code,
];

export const DEFAULT_CURRENCY_DISPLAY_PARTS: readonly CurrencyDisplayPartValue[] = [
  CurrencyDisplayPart.Flag,
  CurrencyDisplayPart.Symbol,
];

function resolveCurrencyDisplayParts(parts?: readonly CurrencyDisplayPartValue[]): Set<CurrencyDisplayPartValue> {
  const resolved = parts && parts.length > 0 ? parts : DEFAULT_CURRENCY_DISPLAY_PARTS;
  return new Set(resolved);
}

export { resolveCurrencyDisplayParts };
