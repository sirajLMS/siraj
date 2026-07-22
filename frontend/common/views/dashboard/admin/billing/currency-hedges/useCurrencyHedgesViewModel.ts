"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { currencyHedgesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppTranslation } from "@/shared/locale";

export type HedgeRow = {
  readonly id: string;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly hedgeType: string;
  readonly notes: string | null;
  readonly updatedAt: string | null;
};

const HEDGE_TYPE_LONG = "LONG";
const INITIAL_HEDGE_TYPE = "SHORT";

type CurrencyFormSetters = {
  readonly setCurrency: (code: CurrencyCode) => void;
  readonly setAmount: (amount: string) => void;
  readonly setHedgeType: (hedgeType: string) => void;
  readonly setNotes: (notes: string) => void;
  readonly setEditingRow: (row: HedgeRow | null) => void;
};

type DialogSetters = CurrencyFormSetters & {
  readonly setDialogOpen: (open: boolean) => void;
};

type DeleteSetters = {
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

function openAddDialog(setters: DialogSetters) {
  resetHedgeForm(setters);
  setters.setDialogOpen(true);
}

function openEditDialog(setters: DialogSetters, row: HedgeRow) {
  applyHedgeForm(setters, row);
  setters.setDialogOpen(true);
}

function openDeleteDialog(setters: DeleteSetters, row: HedgeRow) {
  setters.setDeletingRow(row);
  setters.setDeleteOpen(true);
}

function toHedgeRows(data: Operations.CurrencyHedgesQuery_Query | undefined): readonly HedgeRow[] {
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

function buildCurrencyHedgesViewModel(args: {
  readonly rows: readonly HedgeRow[];
  readonly loading: boolean;
  readonly t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["billingCurrencyHedges"];
  readonly onEdit: (row: HedgeRow) => void;
  readonly onDelete: (row: HedgeRow) => void;
  readonly onAdd: () => void;
}): CurrencyHedgesViewModel {
  const { rows, loading, t, onEdit, onDelete, onAdd } = args;
  return {
    rows,
    loading,
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    emptyMessage: t.empty,
    addHedgeLabel: t.addHedge,
    currencyColumnLabel: t.columns.currency,
    amountColumnLabel: t.columns.amount,
    hedgeTypeColumnLabel: t.columns.hedgeType,
    notesColumnLabel: t.columns.notes,
    updatedAtColumnLabel: t.columns.updatedAt,
    actionsColumnLabel: t.columns.actions,
    editHedgeLabel: t.editHedge,
    deleteHedgeLabel: t.deleteHedge,
    onEdit,
    onDelete,
    onAdd,
  };
}

export type UseCurrencyHedgesViewModelProps = Record<string, never>;

export interface CurrencyHedgesViewModel {
  readonly rows: readonly HedgeRow[];
  readonly loading: boolean;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly emptyMessage: string;
  readonly addHedgeLabel: string;
  readonly currencyColumnLabel: string;
  readonly amountColumnLabel: string;
  readonly hedgeTypeColumnLabel: string;
  readonly notesColumnLabel: string;
  readonly updatedAtColumnLabel: string;
  readonly actionsColumnLabel: string;
  readonly editHedgeLabel: string;
  readonly deleteHedgeLabel: string;
  readonly onEdit: (row: HedgeRow) => void;
  readonly onDelete: (row: HedgeRow) => void;
  readonly onAdd: () => void;
}

export function useCurrencyHedgesViewModel(_props: Readonly<UseCurrencyHedgesViewModelProps>): CurrencyHedgesViewModel {
  const t = useAppTranslation().dashboardTranslations.billingCurrencyHedges;
  const [_dialogOpen, setDialogOpen] = useState(false);
  const [_deleteOpen, setDeleteOpen] = useState(false);
  const [_editingRow, setEditingRow] = useState<HedgeRow | null>(null);
  const [_deletingRow, setDeletingRow] = useState<HedgeRow | null>(null);
  const [_currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [_amount, setAmount] = useState("");
  const [_hedgeType, setHedgeType] = useState<string>(INITIAL_HEDGE_TYPE);
  const [_notes, setNotes] = useState("");

  const { data, loading } = useQuery(currencyHedgesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo<readonly HedgeRow[]>(() => toHedgeRows(data), [data]);

  const dialogSetters = useMemo<DialogSetters>(
    () => ({
      setCurrency,
      setAmount,
      setHedgeType,
      setNotes,
      setEditingRow,
      setDialogOpen,
    }),
    []
  );
  const deleteSetters = useMemo<DeleteSetters>(() => ({ setDeletingRow, setDeleteOpen }), []);

  const onAdd = useCallback(() => {
    openAddDialog(dialogSetters);
  }, [dialogSetters]);

  const onEdit = useCallback(
    (row: HedgeRow) => {
      openEditDialog(dialogSetters, row);
    },
    [dialogSetters]
  );

  const onDelete = useCallback(
    (row: HedgeRow) => {
      openDeleteDialog(deleteSetters, row);
    },
    [deleteSetters]
  );

  return buildCurrencyHedgesViewModel({ rows, loading, t, onEdit, onDelete, onAdd });
}
