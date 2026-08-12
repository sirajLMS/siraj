"use client";

import type { ReactNode } from "react";
import { AdminComplaintsShared } from "@/frontend/common/views/dashboard/complaints/components/__shared__/adminComplaintsShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/adminComplaintsShared.options";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export function AdminComplaintsMobileView({ ...vm }: Readonly<AdminComplaintsViewModel>): ReactNode {
  return <AdminComplaintsShared {...vm} options={MOBILE_OPTIONS} />;
}
