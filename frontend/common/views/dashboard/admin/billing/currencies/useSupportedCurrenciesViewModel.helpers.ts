import type { SupportedCurrenciesQuery_supportedCurrencies } from "@/frontend/common/graphql/generated/gql/graphql";
import { countryCodeToEmoji } from "@/frontend/common/lib/locale";
import type { SupportedCurrenciesLabelsBySection } from "@/frontend/common/views/dashboard/admin/billing/currencies/types/supportedCurrencies.types";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies";

export function buildLabelsBySection(labels: SupportedCurrenciesLabels): SupportedCurrenciesLabelsBySection {
  return {
    shell: {
      pageTitle: labels.pageTitle,
      pageSubtitle: labels.pageSubtitle,
      empty: labels.empty,
      footerNote: labels.footerNote,
    },
    columns: {
      flag: labels.flag,
      code: labels.code,
      symbol: labels.symbol,
      name: labels.name,
      country: labels.country,
      active: labels.active,
      actions: labels.actions,
    },
    actions: {
      activateLabel: labels.activateLabel,
      editLabel: labels.editLabel,
      deactivateLabel: labels.deactivateLabel,
    },
    dialogs: {
      activateTitle: labels.activateTitle,
      editTitle: labels.editTitle,
      deactivateConfirmTitle: labels.deactivateConfirmTitle,
      deactivateConfirmBody: labels.deactivateConfirmBody,
      deactivateConfirmCancel: labels.deactivateConfirmCancel,
      deactivateConfirmConfirm: labels.deactivateConfirmConfirm,
    },
    notifications: {
      saveSuccess: labels.saveSuccess,
      saveError: labels.saveError,
      deactivateSuccess: labels.deactivateSuccess,
      deactivateError: labels.deactivateError,
      currencyInUse: labels.currencyInUse,
    },
  };
}

export function mapSupportedCurrencyRows(
  catalog: readonly SupportedCurrenciesQuery_supportedCurrencies[]
): readonly SupportedCurrencyRow[] {
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
}
