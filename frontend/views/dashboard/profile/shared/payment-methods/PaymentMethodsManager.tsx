"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Button, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ErrorState } from "@/frontend/components/ui";
import {
  PaymentMethodList,
  type PaymentMethodRow,
} from "@/frontend/components/ui/display/paymentMethod/PaymentMethodList";
import { AppPermission, PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import {
  deleteUserPaymentMethodMutationDocument,
  setDefaultUserPaymentMethodMutationDocument,
  userPaymentMethodsQueryDocument,
  verifyBankTransferPaymentMethodMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";
import { useUserStore } from "@/frontend/stores/userStore";
import { PaymentMethodDeleteDialog } from "@/frontend/views/dashboard/profile/shared/payment-methods/PaymentMethodDeleteDialog";
import { PaymentMethodFormDialog } from "@/frontend/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog";

export type PaymentMethodsSlot = "payin" | "payout";

export type PaymentMethodsManagerProps = {
  readonly targetUserId: string;
  readonly slot: PaymentMethodsSlot;
  readonly canManage: boolean;
};

function toRow(method: UserPaymentMethodFieldsFragment): PaymentMethodRow | null {
  if (!method.id || !method.type || !method.direction) return null;
  return {
    id: method.id,
    type: method.type,
    direction: method.direction,
    label: method.label,
    details: method.details,
    verifiedAt: method.verifiedAt,
    isDefault: method.isDefault ?? false,
  };
}

function matchesSlot(direction: PaymentDirection, slot: PaymentMethodsSlot): boolean {
  if (slot === "payin") {
    return direction === PaymentDirection.Payin || direction === PaymentDirection.Both;
  }
  return direction === PaymentDirection.Payout || direction === PaymentDirection.Both;
}

export function PaymentMethodsManager({ targetUserId, slot, canManage }: PaymentMethodsManagerProps) {
  const t = useTranslations("ui.paymentMethod.manager");
  const tType = useTranslations("ui.paymentMethod");
  const { hasPermission } = useUserStore();
  const canVerify = hasPermission(AppPermission.PaymentMethodsVerifyBankTransfer);

  const slotDirection = slot === "payin" ? PaymentDirection.Payin : PaymentDirection.Payout;
  const allowedDirections =
    slot === "payin"
      ? ([PaymentDirection.Payin, PaymentDirection.Both] as const)
      : ([PaymentDirection.Payout, PaymentDirection.Both] as const);

  const { data, loading, error, refetch } = useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId, direction: null },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<UserPaymentMethodFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const methods = useMemo(() => {
    const rows = (data?.userPaymentMethods ?? [])
      .map(toRow)
      .filter((row): row is PaymentMethodRow => row != null)
      .filter(row => matchesSlot(row.direction, slot));
    return rows;
  }, [data?.userPaymentMethods, slot]);

  const methodById = useMemo(() => {
    const map = new Map<string, UserPaymentMethodFieldsFragment>();
    for (const method of data?.userPaymentMethods ?? []) {
      if (method.id) map.set(method.id, method as UserPaymentMethodFieldsFragment);
    }
    return map;
  }, [data?.userPaymentMethods]);

  const [deleteMethod, { loading: deleting }] = useMutation(deleteUserPaymentMethodMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultUserPaymentMethodMutationDocument);
  const [verifyMethod, { loading: verifying }] = useMutation(verifyBankTransferPaymentMethodMutationDocument);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const row = methods.find(m => m.id === deleteId);
    if (!row) return "";
    return row.label?.trim() || getPaymentMethodTypeLabel(row.type, key => tType(key as never));
  }, [deleteId, methods, tType]);

  const handleSaved = async () => {
    await refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteMethod({ variables: { id: deleteId } });
    setDeleteId(null);
    await refetch();
  };

  if (error && methods.length === 0) {
    return (
      <ErrorState
        embedded
        message={t("loadError")}
        retryLabel={t("retry")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || deleting || settingDefault || verifying;

  return (
    <Stack spacing={2}>
      {canManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => {
              setEditMethod(null);
              setFormOpen(true);
            }}
          >
            {t("add")}
          </Button>
        </Stack>
      ) : null}

      <PaymentMethodList
        methods={methods}
        loading={busy}
        title={t("listTitle")}
        emptyMessage={t("empty")}
        onEditAction={
          canManage
            ? id => {
                const method = methodById.get(id) ?? null;
                setEditMethod(method);
                setFormOpen(true);
              }
            : undefined
        }
        onDeleteAction={canManage ? id => setDeleteId(id) : undefined}
        onSetDefaultAction={
          canManage
            ? async id => {
                await setDefault({ variables: { id } });
                await refetch();
              }
            : undefined
        }
      />

      {canVerify
        ? methods
            .filter(row => row.type === PaymentMethodType.BankTransfer && !row.verifiedAt)
            .map(row => (
              <Button
                key={`verify-${row.id}`}
                variant="outlined"
                size="small"
                startIcon={<VerifiedOutlinedIcon />}
                disabled={verifying}
                onClick={() => {
                  void verifyMethod({ variables: { id: row.id } }).then(() => refetch());
                }}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("verify", { label: row.label ?? getPaymentMethodTypeLabel(row.type, key => tType(key as never)) })}
              </Button>
            ))
        : null}

      <PaymentMethodFormDialog
        open={formOpen}
        userId={targetUserId}
        slotDirection={slotDirection}
        allowedDirections={allowedDirections}
        editMethod={editMethod}
        onClose={() => {
          setFormOpen(false);
          setEditMethod(null);
        }}
        onSaved={() => {
          void handleSaved();
        }}
      />

      <PaymentMethodDeleteDialog
        open={deleteId != null}
        methodLabel={deleteLabel}
        isLoading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </Stack>
  );
}
