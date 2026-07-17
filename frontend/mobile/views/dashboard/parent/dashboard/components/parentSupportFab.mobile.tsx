"use client";

import { SupportAgentOutlined } from "@mui/icons-material";
import { MobileFab } from "@/frontend/mobile/components/ui";

interface ParentSupportFabMobileProps {
  readonly label: string;
  readonly onClick: () => void;
}

export function ParentSupportFabMobile({ label, onClick }: Readonly<ParentSupportFabMobileProps>) {
  return <MobileFab icon={<SupportAgentOutlined />} label={label} onClick={onClick} />;
}
