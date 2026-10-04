"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import { AppPermission, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  activateSupportedCurrencyMutationDocument,
  deactivateSupportedCurrencyMutationDocument,
  supportedCurrenciesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { SupportedCurrenciesLabelsBySection } from "@/frontend/common/views/dashboard/admin/billing/currencies/types/supportedCurrencies.types";
import {
  buildLabelsBySection,
  mapSupportedCurrencyRows,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

export type SupportedCurrencyRow = {
  readonly id: string;
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: string;
  readonly flagEmoji: string;
  readonly isActive: boolean;
};

export interface SupportedCurrenciesViewModel {
  readonly labelsBySection: SupportedCurrenciesLabelsBySection;
  readonly rows: readonly SupportedCurrencyRow[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly onActivate: () => void;
  readonly onEdit: (row: SupportedCurrencyRow) => void;
  readonly onDeactivate: (row: SupportedCurrencyRow) => void;
  readonly activateOpen: boolean;
  readonly editRow: SupportedCurrencyRow | null;
  readonly deactivateRow: SupportedCurrencyRow | null;
  readonly isSaving: boolean;
  readonly isDeactivating: boolean;
  readonly setActivateOpen: (open: boolean) => void;
  readonly setEditRow: (row: SupportedCurrencyRow | null) => void;
  readonly setDeactivateRow: (row: SupportedCurrencyRow | null) => void;
  readonly handleSaved: () => Promise<void>;
  readonly handleConfirmDeactivate: () => Promise<void>;
}

export type UseSupportedCurrenciesViewModelProps = Record<string, never>;

export function useSupportedCurrenciesViewModel(
  _props: Readonly<UseSupportedCurrenciesViewModelProps>
): SupportedCurrenciesViewModel {
  const labels = useAppTranslation(Translation.Dashboard.BillingSupportedCurrencies);
  const labelsBySection = useMemo(() => buildLabelsBySection(labels), [labels]);
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingManageCurrencies);

  const [activateOpen, setActivateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SupportedCurrencyRow | null>(null);
  const [deactivateRow, setDeactivateRow] = useState<SupportedCurrencyRow | null>(null);

  const { data, loading, refetch } = useQuery(supportedCurrenciesQueryDocument, {
    variables: { activeOnly: false },
    fetchPolicy: "cache-and-network",
  });

  const [_activateCurrency, { loading: activating }] = useMutation(activateSupportedCurrencyMutationDocument);
  const [deactivateCurrency, { loading: deactivating }] = useMutation(deactivateSupportedCurrencyMutationDocument);

  const rows = useMemo<readonly SupportedCurrencyRow[]>(
    () => mapSupportedCurrencyRows(data?.supportedCurrencies ?? []),
    [data?.supportedCurrencies]
  );

  const handleSaved = async (): Promise<void> => {
    setActivateOpen(false);
    setEditRow(null);
    notifications.show(labelsBySection.notifications.saveSuccess, { severity: "success" });
    await refetch();
  };

  const handleConfirmDeactivate = async (): Promise<void> => {
    if (!deactivateRow?.code) return;
    try {
      await deactivateCurrency({ variables: { code: deactivateRow.code } });
      notifications.show(labelsBySection.notifications.deactivateSuccess, { severity: "success" });
      setDeactivateRow(null);
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const { currencyInUse, deactivateError } = labelsBySection.notifications;
      const isInUse = message === currencyInUse || message.includes(currencyInUse);
      notifications.show(isInUse ? currencyInUse : deactivateError, { severity: "error" });
      if (!isInUse) {
        setDeactivateRow(null);
      }
      logger.error("Failed to deactivate supported currency", { error });
    }
  };

  return {
    labelsBySection,
    rows,
    loading,
    canManage,
    onActivate: () => {
      setEditRow(null);
      setActivateOpen(true);
    },
    onEdit: row => {
      setEditRow(row);
      setActivateOpen(true);
    },
    onDeactivate: row => setDeactivateRow(row),
    activateOpen,
    editRow,
    deactivateRow,
    isSaving: activating,
    isDeactivating: deactivating,
    setActivateOpen,
    setEditRow,
    setDeactivateRow,
    handleSaved,
    handleConfirmDeactivate,
  };
}
