"use client";

import { Box, CircularProgress } from "@mui/material";
import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ActivationPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/activationPolicyPanel.mobile";

/**
 * Mobile variant of the Teacher Rules view. Uses the compact layout
 * (`MobilePageContainer`/`MobilePageHeader` + compact activation-policy panel).
 */
export function TeacherRulesMobileView({
  handbookLoading,
  labels,
  policyLabels,
  actionLabels,
  onDownloadHandbook,
  onContactCoordinator,
}: Readonly<TeacherRulesViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {handbookLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
      <ActivationPolicyPanelMobile
        labels={policyLabels}
        actionLabels={actionLabels}
        onDownloadHandbook={onDownloadHandbook}
        onContactCoordinator={onContactCoordinator}
      />
    </MobilePageContainer>
  );
}
