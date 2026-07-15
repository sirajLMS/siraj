import type { ErrorsLabels } from "@/shared/locale/types/errors";
export type FxDisplayMessages = {
  readonly convertedAmount: (values: {
    lockedAmount: string;
    lockedCurrency: string;
    convertedApprox: string;
    displayCurrency: string;
  }) => string;
  readonly convertedTotalApprox: (values: { convertedApprox: string; displayCurrency: string }) => string;
  readonly displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) => string;
};

export function buildFxDisplayMessages(
  tConverted: {
    convertedAmount: (
      lockedAmount: string,
      lockedCurrency: string,
      convertedApprox: string,
      displayCurrency: string
    ) => string;
  },
  tErrors: ErrorsLabels,
  tConvertedTotal: { convertedTotalApprox: (convertedApprox: string, displayCurrency: string) => string }
): FxDisplayMessages {
  return {
    convertedAmount: values =>
      tConverted.convertedAmount(
        values.lockedAmount,
        values.lockedCurrency,
        values.convertedApprox,
        values.displayCurrency
      ),
    convertedTotalApprox: values =>
      tConvertedTotal.convertedTotalApprox(values.convertedApprox, values.displayCurrency),
    displayCurrencyNotSet: values => tErrors.displayCurrencyNotSet(values),
    displayCurrencyStale: values => tErrors.displayCurrencyStale(values),
    displayCurrencyMixed: values => tErrors.displayCurrencyMixed(values),
  };
}
