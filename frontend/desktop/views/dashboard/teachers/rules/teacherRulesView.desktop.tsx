"use client";

import { Box, CircularProgress } from "@mui/material";
import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";

/**
 * Desktop variant of the Teacher Rules view. Renders the page header, an
 * inline handbook-loading indicator, and the full-layout (dashed border +
 * inline action links) activation-policy panel.
 */
export function TeacherRulesDesktopView({
  handbookLoading,
  labelsBySection,
  onDownloadHandbook,
  onContactCoordinator,
}: Readonly<TeacherRulesViewModel>) {
  const { shell, policy, actions } = labelsBySection;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={shell.pageTitle} subtitle={shell.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <ActivationPolicyPanelDesktop
        labels={policy}
        actionLabels={actions}
        onDownloadHandbook={onDownloadHandbook}
        onContactCoordinator={onContactCoordinator}
      />
    </DesktopPageContainer>
  );
}
