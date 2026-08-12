"use client";

import { ActivationPolicyPanelShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/activationPolicyPanelShared";
import type { ActivationPolicyPanelProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the activation policy panel.
 * Defaults to the full layout (non-compact): dashed border, long description,
 * inline handbook + coordinator action links.
 */
export function ActivationPolicyPanelDesktop(props: Readonly<ActivationPolicyPanelProps>) {
  return <ActivationPolicyPanelShared {...props} compact={props.compact ?? false} />;
}
