import type { ReactNode } from "react";
import { DashboardLayoutContainer } from "@/frontend/views/dashboard/components/DashboardLayoutContainer";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <DashboardLayoutContainer>{children}</DashboardLayoutContainer>;
}
