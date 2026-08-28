"use client";

import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import { MobileLoadingState, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ActivationPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/activationPolicyPanel.mobile";

/**
 * Mobile variant of the Teacher Rules view. Uses the compact layout
 * (`MobilePageContainer`/`MobilePageHeader` + compact activation-policy panel).
 */
export function TeacherRulesMobileView({
  handbookLoading,
  labelsBySection,
  onDownloadHandbook,
  onContactCoordinator,
}: Readonly<TeacherRulesViewModel>) {
  const { shell, policy, actions } = labelsBySection;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={shell.pageTitle} subtitle={shell.pageSubtitle} />
      {handbookLoading ? <MobileLoadingState /> : null}
      <ActivationPolicyPanelMobile
        labels={policy}
        actionLabels={actions}
        onDownloadHandbook={onDownloadHandbook}
        onContactCoordinator={onContactCoordinator}
      />
    </MobilePageContainer>
  );
}
