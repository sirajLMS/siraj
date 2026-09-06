"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CarryoverDetailDrawer } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer";

/** List route the drill-down drawer returns to when closed. */
const CARRYOVER_LIST_HREF = "/accounting/carryover";

export interface CarryoverDetailDrawerRouteProps {
  readonly carryoverId: string;
}

/**
 * Deep-link surface for one carryover balance: the detail drawer is already
 * open on arrival and closing it navigates back to the list page.
 */
export function CarryoverDetailDrawerRoute({ carryoverId }: Readonly<CarryoverDetailDrawerRouteProps>) {
  const router = useRouter();
  const handleClose = useCallback(() => {
    router.push(CARRYOVER_LIST_HREF);
  }, [router]);

  return <CarryoverDetailDrawer carryoverId={carryoverId} open onClose={handleClose} />;
}
