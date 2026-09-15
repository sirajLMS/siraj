import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system/styleFunctionSx";
import type { ComponentType } from "react";
import type { StudentHistoryLabels } from "@/shared/locale";

export type MonthNavigatorLabels = Pick<StudentHistoryLabels, "previousMonth" | "nextMonth">;

export interface MonthNavigatorMonthDisplayProps {
  readonly monthStr: string;
  readonly yearStr: number;
}

export interface MonthNavigatorTierOptions {
  readonly MonthDisplay: ComponentType<Readonly<MonthNavigatorMonthDisplayProps>>;
  readonly chevronSize: "small" | "medium";
  readonly stepperButtonSx?: (enabled: boolean) => (theme: Theme) => SystemStyleObject<Theme>;
  readonly containerSx: SystemStyleObject<Theme>;
}
