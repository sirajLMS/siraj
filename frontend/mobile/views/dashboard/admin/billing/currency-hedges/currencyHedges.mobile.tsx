"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { formatHedgeTimestamp } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale";

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
        <MobileCardList
          rows={rows}
          loading={loading}
          emptyMessage={emptyMessage}
          getKey={(row: HedgeRow) => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={(row: HedgeRow) => (
            <MobileCardListItem variant="edge-to-edge">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                  <Typography sx={theme => ({ color: theme.palette.text.secondary })}>
                    {hedgeTypeColumnLabel}
                  </Typography>
                  <Typography>{row.hedgeType}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{notesColumnLabel}</Typography>
                  <Typography>{row.notes ?? ""}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={theme => ({ color: theme.palette.text.secondary })}>
                    {updatedAtColumnLabel}
                  </Typography>
                  <Typography>{formatHedgeTimestamp(row.updatedAt, locale)}</Typography>
                </Box>
              </Box>
            </MobileCardListItem>
          )}
        />
      </Box>
    </MobilePageContainer>
  );
}
