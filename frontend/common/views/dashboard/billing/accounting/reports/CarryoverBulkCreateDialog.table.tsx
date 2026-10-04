import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  formatHours,
  formatPayable,
  type TeacherGroup,
  type TotalsSummary,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.helpers";

export interface BreakdownCellLabels {
  readonly teacherLine: (teacherName: string, count: number) => string;
  readonly totalsLabel: (count: number) => string;
}

export interface BreakdownColumnLabels {
  readonly teacher: string;
  readonly students: string;
  readonly hours: string;
  readonly payable: string;
}

interface BreakdownTableProps {
  readonly groups: readonly TeacherGroup[];
  readonly totals: TotalsSummary;
  readonly locale: string;
  /** Localized per-row composer and selection totals caption. */
  readonly cellLabels: BreakdownCellLabels;
  /** Column headers (Teacher / Students / Duration (h) / Payable). */
  readonly columnLabels: BreakdownColumnLabels;
}

const TABLE_SX = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  "& th": { py: 0.5 },
  "& td": { py: 1 },
} as const;

const NUMERIC_CELL_SX = { textAlign: "end" } as const;

const HEADER_LABEL_SX = (theme: Theme) => ({ color: theme.palette.onSurfaceVariant });

const TOTALS_CELL_SX = (theme: Theme) => ({
  ...NUMERIC_CELL_SX,
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
});

const TOTALS_LABEL_CELL_SX = (theme: Theme) => ({ borderTop: `1px solid ${theme.palette.outlineVariant}` });

function HeaderCell({ label, numeric }: Readonly<{ label: string; numeric?: boolean }>) {
  return (
    <Box component="th" sx={numeric ? NUMERIC_CELL_SX : { textAlign: "start" }}>
      <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
        {label}
      </Typography>
    </Box>
  );
}

/** Per-teacher breakdown of the pending carryover balances with a totals footer row. */
export function BreakdownTable({ groups, totals, locale, cellLabels, columnLabels }: Readonly<BreakdownTableProps>) {
  return (
    <Box component="table" sx={TABLE_SX}>
      <Box component="colgroup">
        <Box component="col" style={{ width: "auto" }} />
        <Box component="col" style={{ width: "68px" }} />
        <Box component="col" style={{ width: "96px" }} />
        <Box component="col" style={{ width: "110px" }} />
      </Box>
      <Box component="thead">
        <Box component="tr">
          <HeaderCell label={columnLabels.teacher} />
          <HeaderCell label={columnLabels.students} numeric />
          <HeaderCell label={columnLabels.hours} numeric />
          <HeaderCell label={columnLabels.payable} numeric />
        </Box>
      </Box>
      <Box component="tbody">
        {groups.map(group => (
          <Box component="tr" key={group.teacherId}>
            <Box component="td" sx={{ minWidth: 0 }}>
              <Typography variant="bodyMd" noWrap>
                {cellLabels.teacherLine(group.teacherName, group.count)}
              </Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Typography variant="bodyMd">{group.students}</Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Typography variant="bodyMd">{formatHours(group.totalMinutes, locale)}</Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Box component="span" dir="ltr" sx={{ typography: "bodyMd", display: "block" }}>
                {formatPayable(group.totalPaid, group.currency, locale)}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box component="tfoot">
        <Box component="tr">
          <Box component="td" sx={TOTALS_LABEL_CELL_SX}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {cellLabels.totalsLabel(totals.sessions)}
            </Typography>
          </Box>
          <Box component="td" sx={TOTALS_CELL_SX}>
            <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
              {totals.students}
            </Typography>
          </Box>
          <Box component="td" sx={TOTALS_CELL_SX}>
            <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
              {formatHours(totals.totalMinutes, locale)}
            </Typography>
          </Box>
          <Box component="td" sx={TOTALS_CELL_SX}>
            <Box component="span" dir="ltr" sx={{ typography: "bodyMd", display: "block", fontWeight: 700 }}>
              {formatPayable(totals.totalPaid, totals.currency, locale)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
