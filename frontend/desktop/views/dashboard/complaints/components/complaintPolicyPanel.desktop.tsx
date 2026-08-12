"use client";

import {
  COMPLAINT_POLICY_PANEL_DESKTOP_OPTIONS,
  ComplaintPolicyPanelShared,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintPolicyPanelShared";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintPolicyPanelDesktopProps {
  readonly labels: ComplaintsParentLabels;
}

export function ComplaintPolicyPanelDesktop({ labels }: Readonly<ComplaintPolicyPanelDesktopProps>) {
  return <ComplaintPolicyPanelShared labels={labels} options={COMPLAINT_POLICY_PANEL_DESKTOP_OPTIONS} />;
}
