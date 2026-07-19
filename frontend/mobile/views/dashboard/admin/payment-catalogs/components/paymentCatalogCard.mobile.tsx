"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import type {
  CatalogGridActionHandlers,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { resolvePaymentDirectionLabel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/utils/paymentCatalogLabels.utils";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

// VARIANT JUSTIFICATION: extra field none — desktop has no paired data-grid
// twin for this card; the desktop catalog uses typed `*CatalogGridDesktop`
// components instead. The `MobileProps` suffix is kept for symmetry with the
// other tier variants and the contract is local to the mobile card list.
export interface PaymentCatalogCardMobileProps extends CatalogGridActionHandlers {
  readonly row: PaymentCatalogRow;
}

export function PaymentCatalogCardMobile({ row, onEdit, onDelete }: Readonly<PaymentCatalogCardMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const dirLabel = resolvePaymentDirectionLabel(row.supportedDirections, t);

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Box>
            <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
              {row.slug}
            </Typography>
            <LocalizedStringDisplay value={row.name} />
          </Box>
          <MobileStatusBadge
            category="paymentMethod"
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? t.active : t.inactive}
          />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          <Chip size="small" label={dirLabel} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <IconButton size="small" aria-label={t.edit} onClick={() => onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={t.delete} onClick={() => onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </MobileCardListItem>
  );
}
