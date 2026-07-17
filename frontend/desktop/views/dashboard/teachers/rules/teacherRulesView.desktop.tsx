"use client";

import { Box, CircularProgress } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";

/**
 * Desktop variant of the Teacher Rules view. Renders the page header, an
 * inline handbook-loading indicator, and the full-layout (dashed border +
 * inline action links) activation-policy panel.
 */
export function TeacherRulesDesktopView({
  handbookLoading,
  labels,
  policyLabels,
  actionLabels,
  onDownloadHandbook,
  onContactCoordinator,
}: Readonly<TeacherRulesViewModel>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <ActivationPolicyPanelDesktop
        labels={policyLabels}
        actionLabels={actionLabels}
        onDownloadHandbook={onDownloadHandbook}
        onContactCoordinator={onContactCoordinator}
      />
    </PageContainer>
  );
}
