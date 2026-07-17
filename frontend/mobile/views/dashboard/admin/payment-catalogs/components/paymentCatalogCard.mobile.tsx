"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { useAppTranslation } from "@/shared/locale";
import type {
  CatalogGridActionHandlers,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";

function actionLabelForDirection(dir: string | null | undefined, t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["paymentCatalogs"]): string {
  if (!dir) return t.notSet;
  if (dir === "PAYIN") return t.directions.payin;
  if (dir === "PAYOUT") return t.directions.payout;
  return t.directions.both;
}

export interface PaymentCatalogCardMobileProps extends CatalogGridActionHandlers {
  readonly row: PaymentCatalogRow;
}

export function PaymentCatalogCardMobile({ row, onEdit, onDelete }: Readonly<PaymentCatalogCardMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const dirLabel = actionLabelForDirection(row.supportedDirections, t);

  return (
    <Box
      sx={{
        py: 2,
        borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Box>
          <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
            {row.slug}
          </Typography>
          <LocalizedStringDisplay value={row.name} />
        </Box>
        <StatusBadge
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
  );
}
