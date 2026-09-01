import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";

type CurrencyHedgesShellLabels = Pick<CurrencyHedgesLabels, "pageTitle" | "pageSubtitle" | "empty">;

export type CurrencyHedgesColumnLabels = CurrencyHedgesLabels["columns"];

export type CurrencyHedgesActionLabels = Pick<CurrencyHedgesLabels, "addHedge" | "editHedge" | "deleteHedge">;

export interface CurrencyHedgesLabelsBySection {
  readonly shell: CurrencyHedgesShellLabels;
  readonly columns: CurrencyHedgesColumnLabels;
  readonly actions: CurrencyHedgesActionLabels;
}
