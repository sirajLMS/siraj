"use client";

import type { ReactNode } from "react";
import { AdminComplaintsShared } from "@/frontend/common/views/dashboard/complaints/components/__shared__/adminComplaintsShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/adminComplaintsShared.options";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export function AdminComplaintsDesktopView({ ...vm }: Readonly<AdminComplaintsViewModel>): ReactNode {
  return <AdminComplaintsShared {...vm} options={DESKTOP_OPTIONS} />;
}
