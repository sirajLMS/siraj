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
import { AppPermission, PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteUserPaymentMethodMutationDocument,
  setDefaultUserPaymentMethodMutationDocument,
  userPaymentMethodsQueryDocument,
  verifyBankTransferPaymentMethodMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { useUserStore } from "@/frontend/common/stores/userStore";
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

type VerifyButtonProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly verifying: boolean;
  readonly onVerify: (id: string) => Promise<void>;
  readonly t: TranslationManager;
  readonly tType: TranslationType;
};

function VerifyBankTransferButtons({ methods, verifying, onVerify, t, tType }: VerifyButtonProps) {
  const verifyTargets = methods.filter(row => row.type === PaymentMethodType.BankTransfer && !row.verifiedAt);
  if (verifyTargets.length === 0) return null;

  return verifyTargets.map(row => (
    <Button
      key={`verify-${row.id}`}
      variant="outlined"
      size="small"
      startIcon={<VerifiedOutlinedIcon />}
      disabled={verifying}
      onClick={async () => {
        await onVerify(row.id);
      }}
      sx={{ alignSelf: "flex-start" }}
    >
      {t("verify", { label: row.label ?? getPaymentMethodTypeLabel(row.type, key => tType(key as never)) })}
    </Button>
  ));
}

function PaymentMethodFormDialogWrapped({
  formOpen,
  targetUserId,
  slotDirection,
  allowedDirections,
  editMethod,
  setFormOpen,
  setEditMethod,
  onSaved,
}: {
  formOpen: boolean;
  targetUserId: string;
  slotDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  allowedDirections: readonly PaymentDirection[];
  editMethod: UserPaymentMethodFieldsFragment | null;
  setFormOpen: (open: boolean) => void;
  setEditMethod: (method: UserPaymentMethodFieldsFragment | null) => void;
  onSaved: () => Promise<void>;
}) {
  return (
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
      onSaved={onSaved}
    />
  );
}

type TranslationManager = ReturnType<typeof useTranslations<"ui.paymentMethod.manager">>;
type TranslationType = ReturnType<typeof useTranslations<"ui.paymentMethod">>;

type PaymentMethodsManagerData = {
  readonly userPaymentMethods?: readonly UserPaymentMethodFieldsFragment[] | null;
};

function usePaymentMethods(data: PaymentMethodsManagerData | undefined, slot: PaymentMethodsSlot): PaymentMethodRow[] {
  return useMemo(() => {
    const rows = (data?.userPaymentMethods ?? [])
      .map(toRow)
      .filter((row): row is PaymentMethodRow => row != null)
      .filter(row => matchesSlot(row.direction, slot));
    return rows;
  }, [data?.userPaymentMethods, slot]);
}

function useMethodById(data: PaymentMethodsManagerData | undefined) {
  return useMemo(() => {
    const map = new Map<string, UserPaymentMethodFieldsFragment>();
    for (const method of data?.userPaymentMethods ?? []) {
      if (method.id) map.set(method.id, method as UserPaymentMethodFieldsFragment);
    }
    return map;
  }, [data?.userPaymentMethods]);
}

function useDeleteLabel(deleteId: string | null, methods: readonly PaymentMethodRow[], tType: TranslationType): string {
  return useMemo(() => {
    if (!deleteId) return "";
    const row = methods.find(m => m.id === deleteId);
    if (!row) return "";
    return row.label?.trim() || getPaymentMethodTypeLabel(row.type, key => tType(key as never));
  }, [deleteId, methods, tType]);
}

type PaymentMethodMutations = {
  readonly deleting: boolean;
  readonly settingDefault: boolean;
  readonly verifying: boolean;
  readonly confirmDelete: (id: string) => Promise<void>;
  readonly setDefault: (id: string) => Promise<void>;
  readonly verify: (id: string) => Promise<void>;
};

function useMethodMutations(refetch: () => Promise<unknown>): PaymentMethodMutations {
  const [deleteMethod, { loading: deleting }] = useMutation(deleteUserPaymentMethodMutationDocument);
  const [setDefaultMut, { loading: settingDefault }] = useMutation(setDefaultUserPaymentMethodMutationDocument);
  const [verifyMethod, { loading: verifying }] = useMutation(verifyBankTransferPaymentMethodMutationDocument);

  return {
    deleting,
    settingDefault,
    verifying,
    confirmDelete: async (id: string) => {
      await deleteMethod({ variables: { id } });
      await refetch();
    },
    setDefault: async (id: string) => {
      await setDefaultMut({ variables: { id } });
      await refetch();
    },
    verify: async (id: string) => {
      await verifyMethod({ variables: { id } });
      await refetch();
    },
  };
}

export function PaymentMethodsManager({ targetUserId, slot, canManage }: PaymentMethodsManagerProps) {
  const t = useTranslations("ui.paymentMethod.manager");
  const tType = useTranslations("ui.paymentMethod");
  const { hasPermission } = useUserStore();
  const canVerify = hasPermission(AppPermission.PaymentMethodsVerifyBankTransfer);

  const slotDirection: PaymentDirection.Payin | PaymentDirection.Payout =
    slot === "payin" ? PaymentDirection.Payin : PaymentDirection.Payout;
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

  const methods = usePaymentMethods(data, slot);
  const methodById = useMethodById(data);
  const refetchData = async () => {
    await refetch();
  };
  const mutations = useMethodMutations(refetchData);
  const deleteLabel = useDeleteLabel(deleteId, methods, tType);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await mutations.confirmDelete(deleteId);
    setDeleteId(null);
  };

  const handleEdit = canManage
    ? (id: string) => {
        const method = methodById.get(id) ?? null;
        setEditMethod(method);
        setFormOpen(true);
      }
    : undefined;

  const busy = loading || mutations.deleting || mutations.settingDefault || mutations.verifying;

  if (error && methods.length === 0) {
    return (
      <ErrorState
        embedded
        message={t("loadError")}
        retryLabel={t("retry")}
        onRetry={async () => {
          await refetch();
        }}
      />
    );
  }

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
        onEditAction={handleEdit}
        onDeleteAction={canManage ? id => setDeleteId(id) : undefined}
        onSetDefaultAction={canManage ? mutations.setDefault : undefined}
      />

      {canVerify ? (
        <VerifyBankTransferButtons
          methods={methods}
          verifying={mutations.verifying}
          onVerify={mutations.verify}
          t={t}
          tType={tType}
        />
      ) : null}

      <PaymentMethodFormDialogWrapped
        formOpen={formOpen}
        targetUserId={targetUserId}
        slotDirection={slotDirection}
        allowedDirections={allowedDirections}
        editMethod={editMethod}
        setFormOpen={setFormOpen}
        setEditMethod={setEditMethod}
        onSaved={refetchData}
      />

      <PaymentMethodDeleteDialog
        open={deleteId != null}
        methodLabel={deleteLabel}
        isLoading={mutations.deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
}
