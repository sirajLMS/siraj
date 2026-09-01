export interface MonthOption {
  readonly value: string;
  readonly label: string;
}

function generateMonthOptions(monthFormat: "long" | "short" = "long"): readonly MonthOption[] {
  const now = new Date();
  const opts: MonthOption[] = [];
  for (let i = -6; i <= 6; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: d.toISOString(),
      label: d.toLocaleDateString("en", { month: monthFormat, year: "numeric" }),
    });
  }
  return opts;
}

export const DESKTOP_MONTH_OPTIONS: readonly MonthOption[] = generateMonthOptions("long");
export const MOBILE_MONTH_OPTIONS: readonly MonthOption[] = generateMonthOptions("short");
