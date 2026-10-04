import { CurrencyCode, type CurrencyHedgesQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyHedgesLabelsBySection } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/types/currencyHedges.types";
import type { HedgeRow } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";

const HEDGE_TYPE_LONG = "LONG";
export const INITIAL_HEDGE_TYPE = "SHORT";

type CurrencyFormSetters = {
  readonly setCurrency: (code: CurrencyCode) => void;
  readonly setAmount: (amount: string) => void;
  readonly setHedgeType: (hedgeType: string) => void;
  readonly setNotes: (notes: string) => void;
  readonly setEditingRow: (row: HedgeRow | null) => void;
};

export type DialogSetters = CurrencyFormSetters & {
  readonly setDialogOpen: (open: boolean) => void;
};

export type DeleteSetters = {
  readonly setDeletingRow: (row: HedgeRow | null) => void;
  readonly setDeleteOpen: (open: boolean) => void;
};

function applyHedgeForm(setters: CurrencyFormSetters, row: HedgeRow) {
  setters.setCurrency(row.currency);
  setters.setAmount(row.amount);
  setters.setHedgeType(row.hedgeType);
  setters.setNotes(row.notes ?? "");
  setters.setEditingRow(row);
}

function resetHedgeForm(setters: CurrencyFormSetters) {
  setters.setCurrency(CurrencyCode.Usd);
  setters.setAmount("");
  setters.setHedgeType(HEDGE_TYPE_LONG);
  setters.setNotes("");
  setters.setEditingRow(null);
}

export function openAddDialog(setters: DialogSetters) {
  resetHedgeForm(setters);
  setters.setDialogOpen(true);
}

export function openEditDialog(setters: DialogSetters, row: HedgeRow) {
  applyHedgeForm(setters, row);
  setters.setDialogOpen(true);
}

export function openDeleteDialog(setters: DeleteSetters, row: HedgeRow) {
  setters.setDeletingRow(row);
  setters.setDeleteOpen(true);
}

export function toHedgeRows(data: CurrencyHedgesQuery | undefined): readonly HedgeRow[] {
  const hedges = data?.currencyHedges ?? [];
  return hedges
    .filter((row): row is NonNullable<typeof row> => row?.id != null)
    .map(row => ({
      id: row.id ?? "",
      currency: row.currency ?? CurrencyCode.Usd,
      amount: row.amount ?? "0",
      hedgeType: row.hedgeType ?? "",
      notes: row.notes ?? null,
      updatedAt: row.updatedAt ?? null,
    }));
}

export function buildLabelsBySection(labels: CurrencyHedgesLabels): CurrencyHedgesLabelsBySection {
  return {
    shell: {
      pageTitle: labels.pageTitle,
      pageSubtitle: labels.pageSubtitle,
      empty: labels.empty,
    },
    columns: labels.columns,
    actions: {
      addHedge: labels.addHedge,
      editHedge: labels.editHedge,
      deleteHedge: labels.deleteHedge,
    },
  };
}
