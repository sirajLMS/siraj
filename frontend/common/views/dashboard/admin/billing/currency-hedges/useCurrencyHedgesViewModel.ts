"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
  const [, setDialogOpen] = useState(false);
  const [, setDeleteOpen] = useState(false);
  const [, setEditingRow] = useState<HedgeRow | null>(null);
  const [, setDeletingRow] = useState<HedgeRow | null>(null);
  const [, setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [, setAmount] = useState("");
  const [, setHedgeType] = useState(INITIAL_HEDGE_TYPE);
  const [, setNotes] = useState("");

  const { data, loading } = useQuery(currencyHedgesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

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
    setCurrency(CurrencyCode.Usd);
    setAmount("");
    setHedgeType(HEDGE_TYPE_LONG);
    setNotes("");
    setEditingRow(null);
  };

  const onAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const onEdit = useCallback((row: HedgeRow) => {
    setEditingRow(row);
    setCurrency(row.currency);
    setAmount(row.amount);
    setHedgeType(row.hedgeType);
    setNotes(row.notes ?? "");
    setDialogOpen(true);
  }, []);

  const onDelete = (row: HedgeRow) => {
    setDeletingRow(row);
    setDeleteOpen(true);
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
