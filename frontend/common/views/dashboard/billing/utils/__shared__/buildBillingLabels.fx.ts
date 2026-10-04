import type { BillingLabels } from "@/shared/locale";

export function buildFxAndCurrencyLabels(t: BillingLabels) {
  return {
    exchangeRates: t.exchangeRates,
    fxStaleBanner: {
      adminBody: t.fxStaleBanner.adminBody,
      userBody: t.fxStaleBanner.userBody,
      adminCta: t.fxStaleBanner.adminCta,
      userCta: t.fxStaleBanner.userCta,
    },
    displayCurrencyHint: {
      title: t.displayCurrencyHint.title,
      body: t.displayCurrencyHint.body,
      cta: t.displayCurrencyHint.cta,
      dismiss: t.displayCurrencyHint.dismiss,
      subject: {
        title: t.displayCurrencyHint.subject.title,
        body: t.displayCurrencyHint.subject.body,
        cta: t.displayCurrencyHint.subject.cta,
        dismiss: t.displayCurrencyHint.subject.dismiss,
      },
    },
    fxConversionNote: t.fxConversionNote,
    fxConversionNoteSubject: t.fxConversionNoteSubject,
    adminBillingFxNote: t.adminBillingFxNote,
    displayCurrencyMixed: t.displayCurrencyMixed,
    currencyHedges: t.currencyHedges,
    supportedCurrencies: t.supportedCurrencies,
  };
}
