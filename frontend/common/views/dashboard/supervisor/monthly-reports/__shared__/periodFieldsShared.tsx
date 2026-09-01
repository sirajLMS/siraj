"use client";

import { Grid, type GridProps, MenuItem, TextField } from "@mui/material";
import { YEARS } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/__shared__/monthlyReportsConstants";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale";

type PeriodGridSize = NonNullable<GridProps["size"]>;

export interface PeriodFieldsSharedProps {
  readonly year: number;
  readonly month: number;
  readonly labels: Pick<SupervisorMonthlyReportsLabels, "selectYear" | "selectMonth" | "monthNames">;
  readonly onYearChange: (year: number) => void;
  readonly onMonthChange: (month: number) => void;
  readonly gridSize: PeriodGridSize;
  readonly containerSpacing?: number;
  readonly wrapInContainer: boolean;
}

function YearField({
  year,
  labels,
  onYearChange,
  gridSize,
}: Readonly<{
  readonly year: number;
  readonly labels: PeriodFieldsSharedProps["labels"];
  readonly onYearChange: PeriodFieldsSharedProps["onYearChange"];
  readonly gridSize: PeriodGridSize;
}>) {
  return (
    <Grid size={gridSize}>
      <TextField
        select
        fullWidth
        label={labels.selectYear}
        value={year}
        onChange={e => onYearChange(Number(e.target.value))}
      >
        {YEARS.map(y => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  );
}

function MonthField({
  month,
  labels,
  onMonthChange,
  gridSize,
}: Readonly<{
  readonly month: number;
  readonly labels: PeriodFieldsSharedProps["labels"];
  readonly onMonthChange: PeriodFieldsSharedProps["onMonthChange"];
  readonly gridSize: PeriodGridSize;
}>) {
  return (
    <Grid size={gridSize}>
      <TextField
        select
        fullWidth
        label={labels.selectMonth}
        value={month}
        onChange={e => onMonthChange(Number(e.target.value))}
      >
        {labels.monthNames.map((name, index) => (
          <MenuItem key={name} value={index + 1}>
            {name}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  );
}

export function PeriodFieldsShared({
  year,
  month,
  labels,
  onYearChange,
  onMonthChange,
  gridSize,
  containerSpacing = 2,
  wrapInContainer,
}: Readonly<PeriodFieldsSharedProps>) {
  const yearEl = <YearField year={year} labels={labels} onYearChange={onYearChange} gridSize={gridSize} />;
  const monthEl = <MonthField month={month} labels={labels} onMonthChange={onMonthChange} gridSize={gridSize} />;

  if (wrapInContainer) {
    return (
      <Grid container spacing={containerSpacing}>
        {yearEl}
        {monthEl}
      </Grid>
    );
  }

  return (
    <>
      {yearEl}
      {monthEl}
    </>
  );
}
