"use client";

import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  createBillingActionHandlers,
  createBillingCreditHandlers,
  createBillingDialogHandlers,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.handlers";
import { buildFxMessages } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.helpers";
import { useAdminBillingMutations } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.mutations";
import { useAdminBillingQueries } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.queries";
import { useAdminBillingStoreBindings } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.store";
import type {
  AdminBillingViewModel,
  UseAdminBillingViewModelProps,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.types";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export type {
  AdminBillingViewModel,
  UseAdminBillingViewModelProps,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.types";

export function useAdminBillingViewModel(_props: Readonly<UseAdminBillingViewModelProps>): AdminBillingViewModel {
  const t = useAppTranslation(Translation.Dashboard.Billing);
  const tProfile = useAppTranslation(Translation.Profile.Teacher);
  const tProfileRoot = useAppTranslation(Translation.Profile.Base);
  const tErrors = useAppTranslation(Translation.Errors);
  const tc = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const router = useRouter();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  const hasPermission = useUserStore(state => state.hasPermission);
  const canViewExchangeRates = hasPermission(AppPermission.BillingViewExchangeRates);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
  const canDelete = hasPermission(AppPermission.BillingDeleteInvoice);

  const fxMessages = useMemo(() => buildFxMessages(tProfile, tErrors, tProfileRoot), [tProfile, tErrors, tProfileRoot]);

  const store = useAdminBillingStoreBindings();
  const pollInterval = useBillingPollInterval(store.actions.billingDialogsOpen);
  const queries = useAdminBillingQueries({
    page: store.vmState.page,
    pageSize: store.vmState.pageSize,
    debouncedSearch: store.actions.debouncedSearch,
    pollInterval,
    locale,
    fxMessages,
    creditFilter: store.vmState.creditFilter,
  });
  const mutations = useAdminBillingMutations({ actions: store.actions, labels, tc, t, refetch: queries.refetch });

  useRefetchOnWindowFocus(queries.vm.refreshBillingData);

  const actionHandlers = createBillingActionHandlers({
    actions: store.actions,
    mutations,
    refetch: queries.refetch,
    labels,
    tErrors,
    billingActionsDisabled,
    router,
    deleteTargetId: store.vmState.deleteTargetId,
  });
  const creditHandlers = createBillingCreditHandlers({
    actions: store.actions,
    mutations,
    tErrors,
    billingActionsDisabled,
  });
  const dialogHandlers = createBillingDialogHandlers({
    actions: store.actions,
    refreshBillingData: queries.vm.refreshBillingData,
    refetchCredit: queries.refetch.credit,
  });

  return {
    labels,
    billingActionsDisabled,
    canManage,
    canCreate: canCreate && !billingActionsDisabled,
    canDelete: canDelete && !billingActionsDisabled,
    canViewExchangeRates: canViewExchangeRates && !billingActionsDisabled,
    ...store.vmState,
    ...queries.vm,
    ...mutations.vm,
    ...actionHandlers,
    ...creditHandlers,
    ...dialogHandlers,
  };
}
