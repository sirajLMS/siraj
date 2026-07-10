"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppDataGrid, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createCurrencyHedgeMutationDocument,
  currencyHedgesQueryDocument,
  deleteCurrencyHedgeMutationDocument,
  updateCurrencyHedgeMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { getCurrencyByCode, getCurrencyDisplayName } from "@/frontend/lib/currency";
import { logger } from "@/frontend/utils/logger";

type HedgeRow = {
  readonly id: string;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly hedgeType: string;
  readonly notes: string | null;
  readonly updatedAt: string | null;
};

function formatTimestamp(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString(locale);
}

export function CurrencyHedgesContainer() {
  const t = useTranslations("dashboard.billing.currencyHedges");
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<HedgeRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<HedgeRow | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [amount, setAmount] = useState("");
  const [hedgeType, setHedgeType] = useState("");
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
    setHedgeType("");
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

  const columns = useMemo<GridColDef<HedgeRow>[]>(
    () => [
      {
        field: "currency",
        headerName: t("columns.currency"),
        flex: 1,
        minWidth: 120,
        valueFormatter: value => getCurrencyDisplayName(String(value), locale),
      },
      { field: "amount", headerName: t("columns.amount"), flex: 1, minWidth: 120 },
      { field: "hedgeType", headerName: t("columns.hedgeType"), flex: 1, minWidth: 140 },
      { field: "notes", headerName: t("columns.notes"), flex: 1.5, minWidth: 180 },
      {
        field: "updatedAt",
        headerName: t("columns.updatedAt"),
        flex: 1,
        minWidth: 160,
        valueFormatter: value => formatTimestamp(String(value), locale),
      },
      {
        field: "actions",
        headerName: t("columns.actions"),
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={t("editHedge")} onClick={() => openEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label={t("deleteHedge")}
              onClick={() => {
                setDeletingRow(row);
                setDeleteOpen(true);
              }}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [locale, t, openEdit]
  );

  return (
    <RequirePermission permissions={AppPermission.BillingManageCurrencyHedges}>
      <PageContainer>
        <PageHeader
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
          actions={
            <PrimaryPageAction onClick={openCreate} startIcon={<AddOutlined />}>
              {t("addHedge")}
            </PrimaryPageAction>
          }
        />
        <Box sx={{ height: 560 }}>
          <AppDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            emptyMessage={t("empty")}
            getRowId={row => row.id}
          />
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editingRow ? t("editHedge") : t("addHedge")}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <CurrencySelect
                currency={getCurrencyByCode(currency) ?? null}
                setCurrencyAction={option => setCurrency(option.code)}
                label={t("fields.currency")}
                fullWidth
              />
              <TextField
                label={t("fields.amount")}
                value={amount}
                onChange={event => setAmount(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("fields.hedgeType")}
                value={hedgeType}
                onChange={event => setHedgeType(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("fields.notes")}
                value={notes}
                onChange={event => setNotes(event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button variant="contained" onClick={() => void handleSave()} disabled={creating || updating}>
              {t("save")}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>{t("deleteHedge")}</DialogTitle>
          <DialogContent>{t("deleteConfirm")}</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>{t("cancel")}</Button>
            <Button color="error" variant="contained" onClick={() => void handleDelete()} disabled={deleting}>
              {t("deleteHedge")}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </RequirePermission>
  );
}
