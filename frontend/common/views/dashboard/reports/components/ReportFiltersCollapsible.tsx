"use client";

import { ExpandMoreOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/components/ReportFiltersForm";
import { ReportFiltersForm } from "@/frontend/common/views/dashboard/reports/components/ReportFiltersForm";
import type { ReportTeacherOption, ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

interface ReportFiltersCollapsibleProps {
  readonly title: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
  readonly labels: ReportFiltersFormLabels;
  readonly canGenerate: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (teacherId: string) => void;
  readonly onReportTypeChange: (reportType: ReportType) => void;
  readonly onSubmit: () => void;
}

export function ReportFiltersCollapsible({
  title,
  fromDate,
  toDate,
  teacherId,
  reportType,
  teachers,
  labels,
  canGenerate,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
}: Readonly<ReportFiltersCollapsibleProps>) {
  const [expanded, setExpanded] = useState(false);

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
        onClick={() => {
          setExpanded(current => !current);
        }}
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
          <ReportFiltersForm
            fromDate={fromDate}
            toDate={toDate}
            teacherId={teacherId}
            reportType={reportType}
            teachers={teachers}
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
