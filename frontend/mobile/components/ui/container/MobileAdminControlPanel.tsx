"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { ReactNode } from "react";
import { AdminControlPanelShared } from "@/frontend/common/components/ui/container/__shared__/adminControlPanelShared";
import { MOBILE_OPTIONS } from "@/frontend/common/components/ui/container/__shared__/adminControlPanelShared.options";

export interface MobileAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

export function MobileAdminControlPanel({ title, icon, children }: MobileAdminControlPanelProps) {
  return (
    <AdminControlPanelShared title={title} icon={icon} options={MOBILE_OPTIONS}>
      {children}
    </AdminControlPanelShared>
  );
}
