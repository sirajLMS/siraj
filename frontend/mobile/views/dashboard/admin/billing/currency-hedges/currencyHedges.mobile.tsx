"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/currencyHedgesView";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale";

function formatTimestamp(value: string | null, locale: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString(locale);
}

export function CurrencyHedgesMobileView({
  rows,
  loading,
  pageTitle,
  pageSubtitle,
  emptyMessage,
  addHedgeLabel,
  amountColumnLabel,
  hedgeTypeColumnLabel,
  notesColumnLabel,
  updatedAtColumnLabel,
  editHedgeLabel,
  deleteHedgeLabel,
  onEdit,
  onDelete,
  onAdd,
}: Readonly<CurrencyHedgesViewModel>) {
  const locale = useAppLocale();
  const showEmpty = rows.length === 0;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        edgeToEdge={false}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={onAdd}>
            {addHedgeLabel}
          </Button>
        }
      />
      <Box sx={{ px: { xs: 2, md: 0 }, pb: 2 }}>
        {loading && rows.length === 0 ? (
          <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 2 })}>{emptyMessage}</Typography>
        ) : showEmpty ? (
          <Typography sx={theme => ({ color: theme.palette.text.secondary, py: 2 })}>{emptyMessage}</Typography>
        ) : (
          rows.map((row: HedgeRow) => (
            <Box
              key={row.id}
              sx={{
                py: 2,
                borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                  {getCurrencyDisplayName(row.currency, locale)}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton size="small" aria-label={editHedgeLabel} onClick={() => onEdit(row)}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" aria-label={deleteHedgeLabel} onClick={() => onDelete(row)}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{amountColumnLabel}</Typography>
                <Typography>{row.amount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{hedgeTypeColumnLabel}</Typography>
                <Typography>{row.hedgeType}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{notesColumnLabel}</Typography>
                <Typography>{row.notes ?? ""}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{updatedAtColumnLabel}</Typography>
                <Typography>{formatTimestamp(row.updatedAt, locale)}</Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </MobilePageContainer>
  );
}
