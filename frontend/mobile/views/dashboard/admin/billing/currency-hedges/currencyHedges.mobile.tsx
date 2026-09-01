"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { formatHedgeTimestamp } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import { MobileCardListItem, MobileCurrencyDisplay, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { BillingMobileListShellShared } from "@/frontend/mobile/views/dashboard/admin/billing/__shared__";
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
        <MobilePrimaryPageAction startIcon={<AddOutlined />} onClick={onAdd}>
          {actions.addHedge}
        </MobilePrimaryPageAction>
      }
      rows={rows}
      loading={loading}
      emptyMessage={shell.empty}
      getKey={row => row.id}
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <MobileCurrencyDisplay
                code={row.currency}
                parts={[CurrencyDisplayPart.Label]}
                typographyVariant="titleLg"
                sx={{ fontWeight: 700 }}
              />
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton size="small" aria-label={actions.editHedge} onClick={() => onEdit(row)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label={actions.deleteHedge} onClick={() => onDelete(row)}>
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <LabeledField label={columns.amount} value={row.amount} />
            <LabeledField label={columns.hedgeType} value={row.hedgeType} />
            <LabeledField label={columns.notes} value={row.notes ?? ""} />
            <LabeledField label={columns.updatedAt} value={formatHedgeTimestamp(row.updatedAt, locale)} />
          </Box>
        </MobileCardListItem>
      )}
    />
  );
}
