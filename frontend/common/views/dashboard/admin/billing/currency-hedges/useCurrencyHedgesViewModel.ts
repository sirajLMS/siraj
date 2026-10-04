"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { currencyHedgesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { CurrencyHedgesLabelsBySection } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/types/currencyHedges.types";
import {
  buildLabelsBySection,
  type DeleteSetters,
  type DialogSetters,
  INITIAL_HEDGE_TYPE,
  openAddDialog,
  openDeleteDialog,
  openEditDialog,
  toHedgeRows,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

export type HedgeRow = {
  readonly id: string;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly hedgeType: string;
  readonly notes: string | null;
  readonly updatedAt: string | null;
};

export type UseCurrencyHedgesViewModelProps = Record<string, never>;

export interface CurrencyHedgesViewModel {
  readonly labelsBySection: CurrencyHedgesLabelsBySection;
  readonly rows: readonly HedgeRow[];
  readonly loading: boolean;
  readonly dialogOpen: boolean;
  readonly deleteOpen: boolean;
  readonly editingRow: HedgeRow | null;
  readonly deletingRow: HedgeRow | null;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly hedgeType: string;
  readonly notes: string;
  readonly setDialogOpen: (open: boolean) => void;
  readonly setDeleteOpen: (open: boolean) => void;
  readonly setEditingRow: (row: HedgeRow | null) => void;
  readonly setDeletingRow: (row: HedgeRow | null) => void;
  readonly setCurrency: (code: CurrencyCode) => void;
  readonly setAmount: (amount: string) => void;
  readonly setHedgeType: (hedgeType: string) => void;
  readonly setNotes: (notes: string) => void;
  readonly onEdit: (row: HedgeRow) => void;
  readonly onDelete: (row: HedgeRow) => void;
  readonly onAdd: () => void;
}

export function useCurrencyHedgesViewModel(_props: Readonly<UseCurrencyHedgesViewModelProps>): CurrencyHedgesViewModel {
  const labels = useAppTranslation(Translation.Dashboard.BillingCurrencyHedges);
  const labelsBySection = useMemo(() => buildLabelsBySection(labels), [labels]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<HedgeRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<HedgeRow | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [amount, setAmount] = useState("");
  const [hedgeType, setHedgeType] = useState<string>(INITIAL_HEDGE_TYPE);
  const [notes, setNotes] = useState("");

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

  return {
    labelsBySection,
    rows,
    loading,
    dialogOpen,
    deleteOpen,
    editingRow,
    deletingRow,
    currency,
    amount,
    hedgeType,
    notes,
    setDialogOpen,
    setDeleteOpen,
    setEditingRow,
    setDeletingRow,
    setCurrency,
    setAmount,
    setHedgeType,
    setNotes,
    onEdit,
    onDelete,
    onAdd,
  };
}
