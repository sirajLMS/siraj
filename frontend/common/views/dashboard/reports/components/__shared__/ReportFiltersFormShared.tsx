"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

/**
 * Shared scaffold for the report filters form.
 *
 * Desktop and mobile variants differ only in:
 *   - layout (grid vs flex-column)
 *   - date picker component (DesktopAppDatePicker vs MobileAppDatePicker)
 *   - teacher autocomplete (TeacherAutocompleteDesktop vs TeacherAutocompleteMobile)
 *   - submit button (DesktopPrimaryPageAction vs MobilePrimaryPageAction)
 *   - labelId for the Select (reports-type-label vs reports-mobile-type-label)
 *
 * This scaffold exports only React components (ReportTypeSelect, SubmitButtonWrapper)
 * to satisfy react-refresh/only-export-components. The shared hook and utility
 * functions live in reportFiltersFormShared.utils.ts.
 */

export function ReportTypeSelect({
  reportType,
  labels,
  labelId,
  onChange,
}: Readonly<{
  reportType: ReportType;
  labels: ReportFiltersFormLabels;
  labelId: string;
  onChange: (event: SelectChangeEvent) => void;
}>) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={labelId} shrink>
        {labels.reportType}
      </InputLabel>
      <Select labelId={labelId} value={reportType} label={labels.reportType} onChange={onChange}>
        <MenuItem value="by_teacher">{labels.reportTypes.byTeacher}</MenuItem>
        <MenuItem value="by_student">{labels.reportTypes.byStudent}</MenuItem>
        <MenuItem value="by_date">{labels.reportTypes.byDate}</MenuItem>
      </Select>
    </FormControl>
  );
}

export function SubmitButtonWrapper({
  children,
  layout = "grid",
}: Readonly<{ children: React.ReactNode; layout?: "grid" | "flex" }>) {
  if (layout === "flex") {
    return <Box sx={{ pt: 1 }}>{children}</Box>;
  }
  return <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" }, pt: 1 }}>{children}</Box>;
}
