"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import type { CurrencyHedgesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { formatHedgeTimestamp } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
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
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        edgeToEdge={false}
        actions={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={onAdd}>
            {actions.addHedge}
          </Button>
        }
      />
      <Box sx={{ px: { xs: 2, md: 0 }, pb: 2 }}>
        <MobileCardList
          rows={rows}
          loading={loading}
          emptyMessage={shell.empty}
          getKey={row => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
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
      </Box>
    </MobilePageContainer>
  );
}
