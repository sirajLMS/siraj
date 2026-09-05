"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useClassAuditStore } from "@/frontend/common/stores/classAuditStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ClassAuditView } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditView";
import { useClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";

/** Query parameter that deep-links into the payroll override dialog. */
const OPEN_OVERRIDE_PARAM = "openOverride";

/**
 * Drops the consumed deep-link parameter from the address bar without a
 * client navigation, so a refresh or a copied URL never re-fires it.
 */
function stripOpenOverrideParam(): void {
  if (typeof window === "undefined") {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (!params.has(OPEN_OVERRIDE_PARAM)) {
    return;
  }
  params.delete(OPEN_OVERRIDE_PARAM);
  const query = params.toString();
  const cleanUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", cleanUrl);
}

/**
 * Honors the open-override deep link: operators with payroll-manage rights
 * land on the audit page with the payroll override dialog already open. The
 * flag lives on the audit store so it never leaks into the class details
 * page's rate-override dialog, and the instance snapshot fills the dialog
 * summary as soon as its query resolves. The parameter is consumed either
 * way so the link stays single-shot.
 */
function useOpenOverrideDeepLink(): void {
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);
  const setOverrideDialogOpen = useClassAuditStore(state => state.setOverrideDialogOpen);

  const isDeepLinkRequested = Boolean(searchParams?.get(OPEN_OVERRIDE_PARAM));
  const canManagePayroll = hasPermission(AppPermission.AccountingPayrollManage);

  useEffect(() => {
    if (!isDeepLinkRequested) {
      return;
    }
    if (canManagePayroll) {
      setOverrideDialogOpen(true);
    }
    stripOpenOverrideParam();
  }, [isDeepLinkRequested, canManagePayroll, setOverrideDialogOpen]);
}

export function ClassAuditContainer() {
  useOpenOverrideDeepLink();
  const viewModel = useClassAuditViewModel();

  return <ClassAuditView {...viewModel} />;
}
