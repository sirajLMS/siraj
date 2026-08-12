"use client";

import {
  COMPLAINT_POLICY_PANEL_MOBILE_OPTIONS,
  ComplaintPolicyPanelShared,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintPolicyPanelShared";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintPolicyPanelMobileProps {
  readonly labels: ComplaintsParentLabels;
}

export function ComplaintPolicyPanelMobile({ labels }: Readonly<ComplaintPolicyPanelMobileProps>) {
  return <ComplaintPolicyPanelShared labels={labels} options={COMPLAINT_POLICY_PANEL_MOBILE_OPTIONS} />;
}
