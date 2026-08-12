"use client";

import { ActivationPolicyPanelShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/activationPolicyPanelShared";
import type { ActivationPolicyPanelProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Mobile variant of the activation policy panel.
 * Defaults to the compact layout: solid border, shorter description, no
 * inline action links.
 */
export function ActivationPolicyPanelMobile(props: Readonly<ActivationPolicyPanelProps>) {
  return <ActivationPolicyPanelShared {...props} compact={props.compact ?? true} />;
}
