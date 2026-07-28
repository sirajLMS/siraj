"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { AppPermission, PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteUserPaymentMethodMutationDocument,
  setDefaultUserPaymentMethodMutationDocument,
  userPaymentMethodsQueryDocument,
  verifyBankTransferPaymentMethodMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { PaymentMethodsSlot } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager";
import { usePaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodProfileLabels";

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

export type UsePaymentMethodsManagerViewModelProps = {
  readonly targetUserId: string;
  readonly slot: PaymentMethodsSlot;
  readonly canManage: boolean;
};

export function usePaymentMethodsManagerViewModel(props: Readonly<UsePaymentMethodsManagerViewModelProps>) {
  const { targetUserId, slot, canManage } = props;
  const labels = usePaymentMethodProfileLabels();
  const t = labels.manager;
  const tType = labels.type;
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
      if (method.id) map.set(method.id, method);
    }
    return map;
  }, [data?.userPaymentMethods]);

  const refetchData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const [deleteMethod, { loading: deleting }] = useMutation(deleteUserPaymentMethodMutationDocument);
  const [setDefaultMut, { loading: settingDefault }] = useMutation(setDefaultUserPaymentMethodMutationDocument);
  const [verifyMethod, { loading: verifying }] = useMutation(verifyBankTransferPaymentMethodMutationDocument);

  const confirmDelete = useCallback(
    async (id: string) => {
      await deleteMethod({ variables: { id } });
      await refetch();
    },
    [deleteMethod, refetch]
  );

  const setDefault = useCallback(
    async (id: string) => {
      await setDefaultMut({ variables: { id } });
      await refetch();
    },
    [setDefaultMut, refetch]
  );

  const verify = useCallback(
    async (id: string) => {
      await verifyMethod({ variables: { id } });
      await refetch();
    },
    [verifyMethod, refetch]
  );

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const row = methods.find(m => m.id === deleteId);
    if (!row) return "";
    return (
      row.label?.trim() || getPaymentMethodTypeLabel(row.type, key => tType.type[key as keyof typeof tType.type] ?? "")
    );
  }, [deleteId, methods, tType]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    await confirmDelete(deleteId);
    setDeleteId(null);
  }, [confirmDelete, deleteId]);

  const handleEdit = useCallback(
    (id: string) => {
      if (!canManage) return;
      const method = methodById.get(id) ?? null;
      setEditMethod(method);
      setFormOpen(true);
    },
    [canManage, methodById]
  );

  const busy = loading || deleting || settingDefault || verifying;

  return {
    labels,
    t,
    tType,
    canVerify,
    slotDirection,
    allowedDirections,
    methods,
    loading,
    error,
    refetchData,
    formOpen,
    setFormOpen,
    editMethod,
    setEditMethod,
    deleteId,
    setDeleteId,
    deleting,
    settingDefault,
    verifying,
    confirmDelete,
    setDefault,
    verify,
    deleteLabel,
    handleConfirmDelete,
    handleEdit,
    busy,
  };
}

export type PaymentMethodsManagerViewModel = ReturnType<typeof usePaymentMethodsManagerViewModel>;
