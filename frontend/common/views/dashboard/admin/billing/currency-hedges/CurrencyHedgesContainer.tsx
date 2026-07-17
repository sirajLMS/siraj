"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createCurrencyHedgeMutationDocument,
  currencyHedgesQueryDocument,
  deleteCurrencyHedgeMutationDocument,
  updateCurrencyHedgeMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { logger } from "@/frontend/common/utils/logger";
import {
  CurrencyHedgesView,
  type HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/currencyHedgesView";
import { useAppTranslation } from "@/shared/locale";

const HEDGE_TYPE_LONG = "LONG";
const HEDGE_TYPE_SHORT = "SHORT";

export function CurrencyHedgesContainer() {
  const t = useAppTranslation().dashboardTranslations.billingCurrencyHedges;
  const tc = useAppTranslation().commonTranslations;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<HedgeRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<HedgeRow | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [amount, setAmount] = useState("");
  const [hedgeType, setHedgeType] = useState(HEDGE_TYPE_LONG);
  const [notes, setNotes] = useState("");

  const { data, loading, refetch } = useQuery(currencyHedgesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [createHedge, { loading: creating }] = useMutation(createCurrencyHedgeMutationDocument);
  const [updateHedge, { loading: updating }] = useMutation(updateCurrencyHedgeMutationDocument);
  const [deleteHedge, { loading: deleting }] = useMutation(deleteCurrencyHedgeMutationDocument);

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

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = useCallback((row: HedgeRow) => {
    setEditingRow(row);
    setCurrency(row.currency);
    setAmount(row.amount);
    setHedgeType(row.hedgeType);
    setNotes(row.notes ?? "");
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    try {
      if (editingRow) {
        await updateHedge({
          variables: {
            id: editingRow.id,
            currency,
            amount,
            hedgeType,
            notes: notes || null,
          },
        });
      } else {
        await createHedge({
          variables: {
            currency,
            amount,
            hedgeType,
            notes: notes || null,
          },
        });
      }
      setDialogOpen(false);
      resetForm();
      await refetch();
    } catch (error) {
      logger.error("Currency hedge save failed", { error });
    }
  };

  const handleDelete = async () => {
    if (!deletingRow?.id) {
      return;
    }
    try {
      await deleteHedge({ variables: { id: deletingRow.id } });
      setDeleteOpen(false);
      setDeletingRow(null);
      await refetch();
    } catch (error) {
      logger.error("Currency hedge delete failed", { error });
    }
  };

  return (
    <RequirePermission permissions={AppPermission.BillingManageCurrencyHedges}>
      <CurrencyHedgesView
        rows={rows}
        loading={loading}
        pageTitle={t.pageTitle}
        pageSubtitle={t.pageSubtitle}
        emptyMessage={t.empty}
        addHedgeLabel={t.addHedge}
        currencyColumnLabel={t.columns.currency}
        amountColumnLabel={t.columns.amount}
        hedgeTypeColumnLabel={t.columns.hedgeType}
        notesColumnLabel={t.columns.notes}
        updatedAtColumnLabel={t.columns.updatedAt}
        actionsColumnLabel={t.columns.actions}
        editHedgeLabel={t.editHedge}
        deleteHedgeLabel={t.deleteHedge}
        onEdit={openEdit}
        onDelete={row => {
          setDeletingRow(row);
          setDeleteOpen(true);
        }}
        onAdd={openCreate}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingRow ? t.editHedge : t.addHedge}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <CurrencySelect
              currency={getCurrencyByCode(currency) ?? null}
              setCurrencyAction={option => setCurrency(option.code)}
              label={t.fields.currency}
              fullWidth
            />
            <TextField
              label={t.fields.amount}
              value={amount}
              onChange={event => setAmount(event.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="hedge-type-label">{t.fields.hedgeType}</InputLabel>
              <Select
                labelId="hedge-type-label"
                label={t.fields.hedgeType}
                value={hedgeType}
                onChange={event => setHedgeType(event.target.value)}
              >
                <MenuItem value={HEDGE_TYPE_LONG}>{t.hedgeTypes.long}</MenuItem>
                <MenuItem value={HEDGE_TYPE_SHORT}>{t.hedgeTypes.short}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t.fields.notes}
              value={notes}
              onChange={event => setNotes(event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{tc.cancel}</Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={creating || updating}>
            {tc.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t.deleteHedge}</DialogTitle>
        <DialogContent>{t.deleteConfirm}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{tc.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()} disabled={deleting}>
            {t.deleteHedge}
          </Button>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
