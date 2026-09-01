import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies";

type SupportedCurrenciesShellLabels = Pick<
  SupportedCurrenciesLabels,
  "pageTitle" | "pageSubtitle" | "empty" | "footerNote"
>;

export type SupportedCurrenciesColumnLabels = Pick<
  SupportedCurrenciesLabels,
  "flag" | "code" | "symbol" | "name" | "country" | "active" | "actions"
>;

export type SupportedCurrenciesActionLabels = Pick<
  SupportedCurrenciesLabels,
  "activateLabel" | "editLabel" | "deactivateLabel"
>;

type SupportedCurrenciesDialogLabels = Pick<
  SupportedCurrenciesLabels,
  | "activateTitle"
  | "editTitle"
  | "deactivateConfirmTitle"
  | "deactivateConfirmBody"
  | "deactivateConfirmCancel"
  | "deactivateConfirmConfirm"
>;

type SupportedCurrenciesNotificationLabels = Pick<
  SupportedCurrenciesLabels,
  "saveSuccess" | "saveError" | "deactivateSuccess" | "deactivateError" | "currencyInUse"
>;

export interface SupportedCurrenciesLabelsBySection {
  readonly shell: SupportedCurrenciesShellLabels;
  readonly columns: SupportedCurrenciesColumnLabels;
  readonly actions: SupportedCurrenciesActionLabels;
  readonly dialogs: SupportedCurrenciesDialogLabels;
  readonly notifications: SupportedCurrenciesNotificationLabels;
}
