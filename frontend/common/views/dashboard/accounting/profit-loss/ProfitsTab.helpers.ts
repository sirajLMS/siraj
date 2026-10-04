import type { Theme } from "@mui/material";
import type { ProfitLossViewModel } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";

/** Placeholder rendered when the margin has no income base to divide by. */
export const MISSING_VALUE = "—";

/** Sign of the Net Profit figure, resolved once and reused for color and status text. */
type NetProfitSign = "positive" | "negative" | "breakeven";

type ProfitLossTabLabels = ProfitLossViewModel["labels"];

export function netProfitSign(netProfit: string | null): NetProfitSign {
  const value = netProfit === null ? 0 : Number(netProfit);
  if (Number.isNaN(value) || value === 0) return "breakeven";
  return value > 0 ? "positive" : "negative";
}

/** Palette token for each Net Profit sign: green when positive, red when negative, grey at zero. */
export function netProfitStatusColor(sign: NetProfitSign, theme: Theme): string {
  if (sign === "positive") return theme.palette.success.main;
  if (sign === "negative") return theme.palette.error.main;
  return theme.palette.text.disabled;
}

/** Localized sign caption ("Profit" / "Loss" / "Break-even") for the Net Profit row. */
export function netProfitStatusText(sign: NetProfitSign, labels: ProfitLossTabLabels): string {
  if (sign === "positive") return labels.status.positive;
  if (sign === "negative") return labels.status.negative;
  return labels.status.breakeven;
}
