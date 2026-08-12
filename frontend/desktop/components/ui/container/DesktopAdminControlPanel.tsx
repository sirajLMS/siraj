"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { ReactNode } from "react";
import { AdminControlPanelShared } from "@/frontend/common/components/ui/container/__shared__/adminControlPanelShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/components/ui/container/__shared__/adminControlPanelShared.options";

export interface DesktopAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

export function DesktopAdminControlPanel({ title, icon, children }: DesktopAdminControlPanelProps) {
  return (
    <AdminControlPanelShared title={title} icon={icon} options={DESKTOP_OPTIONS}>
      {children}
    </AdminControlPanelShared>
  );
}
