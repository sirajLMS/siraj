"use client";

import { SupportAgentOutlined } from "@mui/icons-material";
import type { ParentSupportFabProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";
import { MobileFab } from "@/frontend/mobile/components/ui";

export function ParentSupportFabMobile({ label, onClick }: Readonly<ParentSupportFabProps>) {
  return <MobileFab icon={<SupportAgentOutlined />} label={label} onClick={onClick} />;
}
