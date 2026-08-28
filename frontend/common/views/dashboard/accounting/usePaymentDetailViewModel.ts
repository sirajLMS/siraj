"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { type AccountingPaymentQuery, AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  accountingPaymentQueryDocument,
  toggleAccountingPaymentPaidStatusMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

export type AccountingPaymentDetail = NonNullable<AccountingPaymentQuery["accountingPayment"]>;

export interface PaymentDetailViewModel {
  readonly t: PaymentsLabels;
  readonly payment: AccountingPaymentDetail | undefined;
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly toggling: boolean;
  readonly toggleError: string | null;
  readonly onTogglePaid: () => Promise<void>;
  readonly onDismissToggleError: () => void;
  /** True when the caller holds ACCOUNTING_PAYMENTS_MANAGE (toggle/edit actions). */
  readonly canManagePayments: boolean;
}

export function usePaymentDetailViewModel(paymentId: string): PaymentDetailViewModel {
  const t = useAppTranslation(DashboardAccountingPayments);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManagePayments = hasPermission(AppPermission.AccountingPaymentsManage);

  const { data, loading } = useQuery(accountingPaymentQueryDocument, {
    variables: { id: paymentId },
    skip: !paymentId,
    fetchPolicy: "cache-and-network",
  });

  const [togglePaidMutation, { loading: toggling }] = useMutation(toggleAccountingPaymentPaidStatusMutationDocument, {
    // The toggle payload selects fewer fields than accountingPaymentQuery
    // (no transactionId/history), so writing it straight into the detail
    // cache slot would poison the typed shape — refetch instead.
    refetchQueries: [{ query: accountingPaymentQueryDocument, variables: { id: paymentId } }],
    awaitRefetchQueries: true,
  });

  const [toggleError, setToggleError] = useState<string | null>(null);

  const payment = data?.accountingPayment ?? undefined;

  const onTogglePaid = useCallback(async () => {
    if (!payment) return;
    setToggleError(null);
    try {
      await togglePaidMutation({
        variables: {
          input: {
            id: paymentId,
            isPaidStatusOn: !payment.isPaidStatusOn,
            // Explicit null = skip the optimistic-lock check (service uses
            // `!= null`); see usePaymentFormViewModel for the rationale.
            expectedInvoiceVersion: null,
          },
        },
      });
    } catch (error) {
      logger.error("toggleAccountingPaymentPaidStatus failed", { error });
      setToggleError(error instanceof Error ? error.message : t.loadError);
    }
  }, [payment, paymentId, togglePaidMutation, t.loadError]);

  const onDismissToggleError = useCallback(() => setToggleError(null), []);

  return {
    t,
    payment,
    loading,
    notFound: !loading && !payment,
    toggling,
    toggleError,
    onTogglePaid,
    onDismissToggleError,
    canManagePayments,
  };
}
