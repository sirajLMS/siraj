"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { ExportButton } from "@/frontend/common/components/ui/button";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}
interface SectionPanelProps {
  readonly title: string;
  readonly children: ReactNode;
}

export interface ParentRulesSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly SectionPanel: ComponentType<SectionPanelProps>;
}

export function ParentRulesShared({
  vm,
  options,
}: Readonly<{ vm: ParentRulesViewModel; options: ParentRulesSharedOptions }>) {
  const { labels, handbookLoading, onDownloadHandbook } = vm;
  const { PageContainer, PageHeader, SectionPanel } = options;
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <SectionPanel title={labels.sections.policies}>
        <Stack spacing={2}>
          <Typography sx={{ typography: "bodyLg", color: theme => theme.palette.text.secondary }}>
            {labels.policyIntro}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.policyLeave}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.policyBilling}
          </Typography>
          <ExportButton onClick={onDownloadHandbook}>{labels.downloadHandbook}</ExportButton>
        </Stack>
      </SectionPanel>
    </PageContainer>
  );
}
