type TranslateFn = (key: string, values?: Record<string, string>) => string;

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
  tConverted: TranslateFn,
  tErrors: TranslateFn,
  tConvertedTotal?: TranslateFn
): FxDisplayMessages {
  const totalT = tConvertedTotal ?? tConverted;
  return {
    convertedAmount: values => tConverted("convertedAmount", values),
    convertedTotalApprox: values => totalT("convertedTotalApprox", values),
    displayCurrencyNotSet: values => tErrors("displayCurrencyNotSet", values),
    displayCurrencyStale: values => tErrors("displayCurrencyStale", values),
    displayCurrencyMixed: values => tErrors("displayCurrencyMixed", values),
  };
}
