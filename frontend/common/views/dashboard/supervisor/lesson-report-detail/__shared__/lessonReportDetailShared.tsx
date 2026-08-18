"use client";

import { Alert, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";

interface PageHeaderProps {
  readonly title: string;
}

export interface LessonReportDetailSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly DetailPanel: ComponentType<{
    report: LessonReportDetailViewModel["report"];
    labels: LessonReportDetailViewModel["labels"];
  }>;
}

export function LessonReportDetailShared({
  vm,
  options,
}: Readonly<{ vm: LessonReportDetailViewModel; options: LessonReportDetailSharedOptions }>) {
  const { report, labels, pageTitle, notFoundMessage, loading, error } = vm;
  const { PageContainer, PageHeader, DetailPanel } = options;
  return (
    <PageContainer>
      <PageHeader title={pageTitle} />
      {loading && !report ? <LoadingState /> : null}
      {error && !report ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {notFoundMessage}
        </Alert>
      ) : null}
      {!loading && !error && !report ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 2 })}>
          {notFoundMessage}
        </Typography>
      ) : null}
      {report ? <DetailPanel report={report} labels={labels} /> : null}
    </PageContainer>
  );
}
