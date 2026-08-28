"use client";

import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import { DesktopLoadingState, DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { ActivationPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/activationPolicyPanel.desktop";

/**
 * Desktop variant of the Teacher Rules view. Renders the page header, a
 * centered loading state while the handbook URL loads, and the full-layout
 * (dashed border + inline action links) activation-policy panel.
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
      {handbookLoading ? <DesktopLoadingState /> : null}
      <ActivationPolicyPanelDesktop
        labels={policy}
        actionLabels={actions}
        onDownloadHandbook={onDownloadHandbook}
        onContactCoordinator={onContactCoordinator}
      />
    </DesktopPageContainer>
  );
}
