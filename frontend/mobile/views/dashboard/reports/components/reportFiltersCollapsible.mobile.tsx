"use client";

import { ExpandMoreOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import type { ReportFiltersCollapsibleProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import {
  ReportFiltersFormMobile,
  type ReportFiltersFormMobileLabels,
} from "@/frontend/mobile/views/dashboard/reports/components/reportFiltersForm.mobile";

export type ReportFiltersCollapsibleMobileLabels = ReportFiltersFormLabels;

// VARIANT JUSTIFICATION: extra fields title, expanded, onToggleExpanded —
// the desktop twin of this component is a permanently-expanded panel that
// has no collapse chrome and hence no `title`/`expanded`/`onToggleExpanded`
// fields. The shared `ReportFiltersCollapsibleProps` extends
// `ReportFiltersFormProps` with only these three collapse-specific extras.
export function ReportFiltersCollapsibleMobile({
  title,
  fromDate,
  toDate,
  teacherId,
  reportType,
  labels,
  canGenerate,
  expanded,
  onToggleExpanded,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
}: Readonly<ReportFiltersCollapsibleProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.light}`,
        boxShadow: theme.palette.shadow.card,
        overflow: "hidden",
      })}
    >
      <Box
        component="button"
        type="button"
        onClick={onToggleExpanded}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            gap: 1,
          })}
        >
          <FilterListOutlined fontSize="small" />
          {title}
        </Typography>
        <IconButton
          size="small"
          aria-label={title}
          sx={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <ExpandMoreOutlined />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 3 }}>
          <ReportFiltersFormMobile
            fromDate={fromDate}
            toDate={toDate}
            teacherId={teacherId}
            reportType={reportType}
            labels={labels}
            canGenerate={canGenerate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            onTeacherChange={onTeacherChange}
            onReportTypeChange={onReportTypeChange}
            onSubmit={onSubmit}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export type _CollapsibleLabelsUnused = ReportFiltersFormMobileLabels;
export type _CollapsibleReportTypeUnused = ReportType;
