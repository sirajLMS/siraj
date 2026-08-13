"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { IconButton, Stack, Typography } from "@mui/material";
import {
  isPaymentDirectionLabelKey,
  isPaymentMethodTypeLabelKey,
} from "@/frontend/common/components/ui/display/paymentMethod/paymentMethodLabelHelpers";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display";
import { MobilePaymentMethodDisplay } from "@/frontend/mobile/components/ui/display/paymentMethod/paymentMethodDisplay.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentMethodRow };

export type MobilePaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};

export function MobilePaymentMethodList({
  methods,
  loading = false,
  title,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
}: MobilePaymentMethodListProps) {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
  const tList = t.list;

  if (loading) {
    return (
      <MobileBaseCard edgeToEdge={false}>
        <Typography sx={{ typography: "bodyMd", p: 2 }}>{tList.empty}</Typography>
      </MobileBaseCard>
    );
  }

  if (methods.length === 0) {
    return (
      <MobileBaseCard edgeToEdge={false}>
        <Typography sx={{ typography: "bodyMd", p: 2 }}>{emptyMessage ?? tList.empty}</Typography>
      </MobileBaseCard>
    );
  }

  return (
    <Stack spacing={1.5}>
      {title ? <Typography sx={{ typography: "titleMd", px: 0.5 }}>{title}</Typography> : null}

      {methods.map(row => {
        const typeLabel = getPaymentMethodTypeLabel(row.type, key =>
          isPaymentMethodTypeLabelKey(key) ? t.type[key] : ""
        );
        const directionLabel = getPaymentMethodDirectionLabel(row.direction, key =>
          isPaymentDirectionLabelKey(key) ? t.direction[key] : ""
        );
        const verificationStatus: "verified" | "unverified" = row.verifiedAt ? "verified" : "unverified";
        const activityStatus: "active" | "inactive" = row.isActive === false ? "inactive" : "active";

        return (
          <MobileBaseCard key={row.id} edgeToEdge={false}>
            <Stack spacing={1.25}>
              <Stack
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Stack sx={{ flexDirection: "row", gap: 0.75, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                  {row.catalogName ? (
                    <MobileLocalizedStringDisplay value={row.catalogName} typographyVariant="titleLg" />
                  ) : (
                    <Typography sx={{ typography: "titleLg" }}>
                      {row.label?.trim() ?? typeLabel ?? row.catalogSlug}
                    </Typography>
                  )}
                  {row.isDefault ? (
                    <MobileStatusBadge
                      category="paymentMethod"
                      status="active"
                      label={t.display.defaultBadge}
                      size="small"
                    />
                  ) : null}
                </Stack>

                <Stack sx={{ flexDirection: "row", gap: 0.5 }}>
                  {!row.isDefault && onSetDefaultAction ? (
                    <IconButton aria-label={tList.setDefault} size="small" onClick={() => onSetDefaultAction(row.id)}>
                      <StarOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  {onEditAction ? (
                    <IconButton aria-label={tList.edit} size="small" onClick={() => onEditAction(row.id)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  {onDeleteAction ? (
                    <IconButton aria-label={tList.delete} size="small" onClick={() => onDeleteAction(row.id)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Stack>
              </Stack>

              <Stack sx={{ flexDirection: "row", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                <Typography sx={{ typography: "labelSm", color: "text.secondary" }}>{tList.columnType}</Typography>
                <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>
                {directionLabel ? (
                  <>
                    <Typography sx={{ typography: "labelSm", color: "text.secondary" }}>
                      {tList.columnDirection}
                    </Typography>
                    <Typography sx={{ typography: "bodyMd" }}>{directionLabel}</Typography>
                  </>
                ) : null}
              </Stack>

              <Stack sx={{ flexDirection: "row", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                {row.type === PaymentMethodType.BankTransfer ? (
                  <MobileStatusBadge
                    category="paymentMethod"
                    status={verificationStatus}
                    label={t.display[verificationStatus]}
                    size="small"
                  />
                ) : null}
                <MobileStatusBadge
                  category="paymentMethod"
                  status={activityStatus}
                  label={t.display[activityStatus]}
                  size="small"
                />
              </Stack>

              <MobilePaymentMethodDisplay method={row} showStatus={false} showDirection={false} compact />
            </Stack>
          </MobileBaseCard>
        );
      })}
    </Stack>
  );
}

export { MobilePaymentMethodDisplay };
