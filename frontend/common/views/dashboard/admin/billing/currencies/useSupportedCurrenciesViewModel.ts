"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import { AppPermission, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  activateSupportedCurrencyMutationDocument,
  deactivateSupportedCurrencyMutationDocument,
  supportedCurrenciesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents";
import { countryCodeToEmoji } from "@/frontend/common/lib/locale";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";

export type SupportedCurrencyRow = {
  readonly id: string;
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode: string;
  readonly flagEmoji: string;
  readonly isActive: boolean;
};

export interface SupportedCurrencyUpsertFormInput {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode?: string | null;
  readonly decimals?: number | null;
  readonly sortOrder?: number | null;
}

export interface SupportedCurrenciesViewModel {
  readonly rows: readonly SupportedCurrencyRow[];
  readonly loading: boolean;
  readonly emptyMessage: string;
  readonly footerNote: string;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly flagColumnLabel: string;
  readonly codeColumnLabel: string;
  readonly symbolColumnLabel: string;
  readonly nameColumnLabel: string;
  readonly countryColumnLabel: string;
  readonly activeColumnLabel: string;
  readonly actionsColumnLabel: string;
  readonly activateLabel: string;
  readonly editLabel: string;
  readonly deactivateLabel: string;
  readonly activateTitle: string;
  readonly editTitle: string;
  readonly deactivateConfirmTitle: string;
  readonly deactivateConfirmBody: (code: string) => string;
  readonly deactivateConfirmCancel: string;
  readonly deactivateConfirmConfirm: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly deactivateSuccess: string;
  readonly deactivateError: string;
  readonly currencyInUseMessage: string;
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
  const t = useAppTranslation().dashboardTranslations.billing;
  const labels = t.supportedCurrencies;
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingManageCurrencies);

  const [activateOpen, setActivateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SupportedCurrencyRow | null>(null);
  const [deactivateRow, setDeactivateRow] = useState<SupportedCurrencyRow | null>(null);

  // Admin view queries ALL currencies (active + inactive) directly from the
  // supported_currencies table — no static fallback. An empty table must render
  // the empty state, not the hardcoded frontend catalog.
  const { data, loading, refetch } = useQuery(supportedCurrenciesQueryDocument, {
    variables: { activeOnly: false },
    fetchPolicy: "cache-and-network",
  });

  const [_activateCurrency, { loading: activating }] = useMutation(activateSupportedCurrencyMutationDocument);
  const [deactivateCurrency, { loading: deactivating }] = useMutation(deactivateSupportedCurrencyMutationDocument);

  const rows = useMemo<readonly SupportedCurrencyRow[]>(() => {
    const catalog = data?.supportedCurrencies ?? [];
    return catalog
      .filter((row): row is typeof row & { code: NonNullable<typeof row.code> } => row.code != null)
      .map((row, index) => {
        const countryCode = row.countryCode ?? "US";
        return {
          id: `${row.code}-${index}`,
          code: row.code,
          symbol: row.symbol ?? row.code,
          countryCode,
          flagEmoji: countryCodeToEmoji(countryCode),
          isActive: row.isActive ?? true,
        };
      });
  }, [data?.supportedCurrencies]);

  const handleSaved = async (): Promise<void> => {
    setActivateOpen(false);
    setEditRow(null);
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetch();
  };

  const handleConfirmDeactivate = async (): Promise<void> => {
    if (!deactivateRow?.code) return;
    try {
      await deactivateCurrency({ variables: { code: deactivateRow.code } });
      notifications.show(labels.deactivateSuccess, { severity: "success" });
      setDeactivateRow(null);
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // The backend throws tErrors.currencyInUse when the currency is referenced.
      // Detect it heuristically (the localized message contains the in-use text)
      // and surface the dedicated currencyInUse label; otherwise show generic error.
      const isInUse = message === labels.currencyInUse || message.includes(labels.currencyInUse);
      notifications.show(isInUse ? labels.currencyInUse : labels.deactivateError, { severity: "error" });
      if (!isInUse) {
        setDeactivateRow(null);
      }
      logger.error("Failed to deactivate supported currency", { error });
    }
  };

  return {
    rows,
    loading,
    emptyMessage: labels.empty,
    footerNote: labels.footerNote,
    pageTitle: labels.pageTitle,
    pageSubtitle: labels.pageSubtitle,
    flagColumnLabel: labels.flag,
    codeColumnLabel: labels.code,
    symbolColumnLabel: labels.symbol,
    nameColumnLabel: labels.name,
    countryColumnLabel: labels.country,
    activeColumnLabel: labels.active,
    actionsColumnLabel: labels.actions,
    activateLabel: labels.activateLabel,
    editLabel: labels.editLabel,
    deactivateLabel: labels.deactivateLabel,
    activateTitle: labels.activateTitle,
    editTitle: labels.editTitle,
    deactivateConfirmTitle: labels.deactivateConfirmTitle,
    deactivateConfirmBody: labels.deactivateConfirmBody,
    deactivateConfirmCancel: labels.deactivateConfirmCancel,
    deactivateConfirmConfirm: labels.deactivateConfirmConfirm,
    saveSuccess: labels.saveSuccess,
    saveError: labels.saveError,
    deactivateSuccess: labels.deactivateSuccess,
    deactivateError: labels.deactivateError,
    currencyInUseMessage: labels.currencyInUse,
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

// Expose the activate mutation document for the dialog to use.
export { activateSupportedCurrencyMutationDocument };
