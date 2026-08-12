"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { BillingMobileListShellShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/billingMobileListShellShared";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { formatHedgeTimestamp } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale";

export function CurrencyHedgesMobileView({
  labelsBySection,
  rows,
  loading,
  onEdit,
  onDelete,
  onAdd,
}: Readonly<CurrencyHedgesViewModel>) {
  const locale = useAppLocale();
  const { shell, columns, actions } = labelsBySection;

  return (
    <BillingMobileListShellShared<HedgeRow>
      pageTitle={shell.pageTitle}
      pageSubtitle={shell.pageSubtitle}
      actions={
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onAdd}>
          {actions.addHedge}
        </Button>
      }
      rows={rows}
      loading={loading}
      emptyMessage={shell.empty}
      getKey={row => row.id}
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {getCurrencyDisplayName(row.currency, locale)}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton size="small" aria-label={actions.editHedge} onClick={() => onEdit(row)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label={actions.deleteHedge} onClick={() => onDelete(row)}>
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{columns.amount}</Typography>
              <Typography>{row.amount}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{columns.hedgeType}</Typography>
              <Typography>{row.hedgeType}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{columns.notes}</Typography>
              <Typography>{row.notes ?? ""}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{columns.updatedAt}</Typography>
              <Typography>{formatHedgeTimestamp(row.updatedAt, locale)}</Typography>
            </Box>
          </Box>
        </MobileCardListItem>
      )}
    />
  );
}
