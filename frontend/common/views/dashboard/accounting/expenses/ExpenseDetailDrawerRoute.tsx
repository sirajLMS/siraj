"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ExpenseDetailDrawer } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer";

/** List route the drill-down drawer returns to when closed. */
const EXPENSES_LIST_HREF = "/accounting/expenses";

export interface ExpenseDetailDrawerRouteProps {
  readonly expenseId: string;
}

/**
 * Deep-link surface for one expense: the detail drawer is already
 * open on arrival and closing it navigates back to the list page.
 */
export function ExpenseDetailDrawerRoute({ expenseId }: Readonly<ExpenseDetailDrawerRouteProps>) {
  const router = useRouter();
  const handleClose = useCallback(() => {
    router.push(EXPENSES_LIST_HREF);
  }, [router]);

  return <ExpenseDetailDrawer expenseId={expenseId} open onClose={handleClose} />;
}
