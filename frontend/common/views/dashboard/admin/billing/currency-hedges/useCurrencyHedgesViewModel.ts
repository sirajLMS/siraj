"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createCurrencyHedgeMutationDocument,
  currencyHedgesQueryDocument,
  deleteCurrencyHedgeMutationDocument,
  updateCurrencyHedgeMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
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
const _HEDGE_TYPE_SHORT = "SHORT";

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
  const [_dialogOpen, _setDialogOpen] = useState(false);
  const [_deleteOpen, _setDeleteOpen] = useState(false);
  const [_editingRow, _setEditingRow] = useState<HedgeRow | null>(null);
  const [_deletingRow, _setDeletingRow] = useState<HedgeRow | null>(null);
  const [_currency, _setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [_amount, _setAmount] = useState("");
  const [_hedgeType, _setHedgeType] = useState(_HEDGE_TYPE_SHORT);
  const [_notes, _setNotes] = useState("");

  const {
    data,
    loading,
    refetch: _refetch,
  } = useQuery(currencyHedgesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [_createHedge] = useMutation(createCurrencyHedgeMutationDocument);
  const [_updateHedge] = useMutation(updateCurrencyHedgeMutationDocument);
  const [_deleteHedge] = useMutation(deleteCurrencyHedgeMutationDocument);

  const rows = useMemo<HedgeRow[]>(
    () =>
      (data?.currencyHedges ?? [])
        .filter((row): row is NonNullable<typeof row> => row != null && row.id != null)
        .map(row => ({
          id: row.id ?? "",
          currency: row.currency ?? CurrencyCode.Usd,
          amount: row.amount ?? "0",
          hedgeType: row.hedgeType ?? "",
          notes: row.notes ?? null,
          updatedAt: row.updatedAt ?? null,
        })),
    [data?.currencyHedges]
  );

  const resetForm = () => {
    _setCurrency(CurrencyCode.Usd);
    _setAmount("");
    _setHedgeType(HEDGE_TYPE_LONG);
    _setNotes("");
    _setEditingRow(null);
  };

  const onAdd = () => {
    resetForm();
    _setDialogOpen(true);
  };

  const onEdit = useCallback((row: HedgeRow) => {
    _setEditingRow(row);
    _setCurrency(row.currency);
    _setAmount(row.amount);
    _setHedgeType(row.hedgeType);
    _setNotes(row.notes ?? "");
    _setDialogOpen(true);
  }, []);

  const onDelete = (row: HedgeRow) => {
    _setDeletingRow(row);
    _setDeleteOpen(true);
  };

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
