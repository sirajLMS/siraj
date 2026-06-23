### Task L — Frontend UI: Reporting Interface

**Objective:** Build the new Reports interface in the dashboard. This interface allows Academy Admins to define query parameters (Date range, Teacher ID, Group By mode) and view the dynamically generated attendance and financial metrics in a data grid.

**Dependencies:** Depends on Task I — requires `generateAttendanceReportQueryDocument` and generated frontend types.

**Layer-Specific Rules (Frontend Views - Flattened from frontend/views/AGENTS.md):**
- Composition Pattern: Build features using Container → Form → View composition.
- Use `useQuery` to fetch data.
- Conditionally render the financial columns (`totalHours`, `paidEGP`, `paidUSD`) based on the `report.view_financials` permission using `usePermission` hook.
- Ensure all interactive elements use MUI components.

**Target Files:**
- `frontend/views/dashboard/reports/ReportsContainer.tsx`
- `frontend/views/dashboard/reports/components/ReportForm.tsx`
- `frontend/views/dashboard/reports/components/ReportDataGrid.tsx`

**Detailed Implementation Steps:**

*Step 1: Create `ReportForm.tsx`*

```tsx
// frontend/views/dashboard/reports/components/ReportForm.tsx
import React, { useState } from "react";
import { Box, Button, TextField, MenuItem } from "@mui/material";
import { ReportGroupingMode } from "../../../../../graphql/generated/gql/graphql-types";
import { useTranslations } from "use-intl";

export interface ReportFilters {
  fromDate: string;
  toDate: string;
  teacherId?: string;
  groupBy: ReportGroupingMode;
}

interface ReportFormProps {
  onGenerate: (filters: ReportFilters) => void;
  loading: boolean;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onGenerate, loading }) => {
  const t = useTranslations("Dashboard.Reports");
  
  const [filters, setFilters] = useState<ReportFilters>({
    fromDate: new Date().toISOString().split('T')[0], // Today
    toDate: new Date().toISOString().split('T')[0],
    groupBy: ReportGroupingMode.Date
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(filters);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
      <TextField 
        type="date" 
        label={t("fromDate")} 
        value={filters.fromDate}
        onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
      <TextField 
        type="date" 
        label={t("toDate")} 
        value={filters.toDate}
        onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
      <TextField 
        select 
        label={t("groupBy")} 
        value={filters.groupBy}
        onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as ReportGroupingMode }))}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value={ReportGroupingMode.Date}>{t("groupByDate")}</MenuItem>
        <MenuItem value={ReportGroupingMode.Teacher}>{t("groupByTeacher")}</MenuItem>
      </TextField>
      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? t("generating") : t("generateReport")}
      </Button>
    </Box>
  );
};
```

*Step 2: Create `ReportDataGrid.tsx`*

Use an MUI Table or DataGrid to display the data. Conditionally include financial columns.

```tsx
// frontend/views/dashboard/reports/components/ReportDataGrid.tsx
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer } from "@mui/material";
import { useTranslations } from "use-intl";
import { usePermissions } from "../../../../hooks/usePermissions";
import { AppPermission } from "../../../../../shared/lib/enum";

interface ReportDataGridProps {
  data: any[]; // Use generated type for AttendanceReportRow
}

export const ReportDataGrid: React.FC<ReportDataGridProps> = ({ data }) => {
  const t = useTranslations("Dashboard.Reports");
  const { hasPermission } = usePermissions();
  const showFinancials = hasPermission(AppPermission.REPORT_VIEW_FINANCIALS);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("group")}</TableCell>
            <TableCell align="right">{t("taken")}</TableCell>
            <TableCell align="right">{t("absent")}</TableCell>
            <TableCell align="right">{t("leave")}</TableCell>
            {showFinancials && (
              <>
                <TableCell align="right">{t("totalHours")}</TableCell>
                <TableCell align="right">{t("paidEGP")}</TableCell>
                <TableCell align="right">{t("paidUSD")}</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.groupLabel}</TableCell>
              <TableCell align="right">{row.takenClasses}</TableCell>
              <TableCell align="right">{row.absentClasses}</TableCell>
              <TableCell align="right">{row.leaveClasses}</TableCell>
              {showFinancials && (
                <>
                  <TableCell align="right">{row.totalHours}</TableCell>
                  <TableCell align="right">{row.paidEGP}</TableCell>
                  <TableCell align="right">{row.paidUSD}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

*Step 3: Create `ReportsContainer.tsx`*

Combine the Form and DataGrid and execute the GraphQL query via `useLazyQuery` or conditional `useQuery`.

```tsx
// frontend/views/dashboard/reports/ReportsContainer.tsx
import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { generateAttendanceReportQueryDocument } from "../../../../graphql/sharedDocuments/report.documents";
import { ReportForm, ReportFilters } from "./components/ReportForm";
import { ReportDataGrid } from "./components/ReportDataGrid";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "use-intl";
import { RequirePermission } from "../../../components/auth/RequirePermission";
import { AppPermission } from "../../../../shared/lib/enum";

export const ReportsContainer: React.FC = () => {
  const t = useTranslations("Dashboard.Reports");
  const [activeFilters, setActiveFilters] = useState<ReportFilters | null>(null);

  const { data, loading, error } = useQuery(generateAttendanceReportQueryDocument, {
    variables: { filters: activeFilters! },
    skip: !activeFilters,
    fetchPolicy: "network-only" // Ensure fresh data for reports
  });

  return (
    <RequirePermission permission={AppPermission.REPORT_GENERATE_CUSTOM}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>{t("title")}</Typography>
        <ReportForm onGenerate={setActiveFilters} loading={loading} />
        {error && <Typography color="error">{t("errorGenerating")}</Typography>}
        {data?.generateAttendanceReport && (
          <ReportDataGrid data={data.generateAttendanceReport} />
        )}
      </Box>
    </RequirePermission>
  );
};
```

**Test Execution Requirements:**
- Typescript verification:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] Interface is correctly isolated behind `REPORT_GENERATE_CUSTOM` using `<RequirePermission>`.
- [ ] Financial columns are successfully gated behind `REPORT_VIEW_FINANCIALS` using `usePermissions`.
- [ ] Form submission correctly updates query variables and fetches fresh data.
- [ ] The composition pattern (Container -> Form -> View) is maintained.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
