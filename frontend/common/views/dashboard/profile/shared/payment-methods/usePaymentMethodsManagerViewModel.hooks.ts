"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { AppPermission, type UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteUserPaymentMethodMutationDocument,
  setDefaultUserPaymentMethodMutationDocument,
  userPaymentMethodsQueryDocument,
  verifyBankTransferPaymentMethodMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { PaymentMethodsSlot } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager";
import {
  buildDeleteLabel,
  buildMethodMap,
  filterMethodsBySlot,
  toRow,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsManagerViewModel.helpers";
import type { PaymentMethodLabels } from "@/shared/locale/types/ui";

export function usePaymentMethodsQuery(targetUserId: string) {
  return useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId, direction: null },
  });
}

export function usePaymentMethodsMutations() {
  const [deleteMethod, { loading: deleting }] = useMutation(deleteUserPaymentMethodMutationDocument);
  const [setDefaultMut, { loading: settingDefault }] = useMutation(setDefaultUserPaymentMethodMutationDocument);
  const [verifyMethod, { loading: verifying }] = useMutation(verifyBankTransferPaymentMethodMutationDocument);
  return { deleteMethod, deleting, setDefaultMut, settingDefault, verifyMethod, verifying };
}

export function useFormState() {
  const [formOpen, setFormOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<UserPaymentMethodFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  return { formOpen, setFormOpen, editMethod, setEditMethod, deleteId, setDeleteId };
}

export function useComputedMethods(
  userPaymentMethods: readonly UserPaymentMethodFieldsFragment[] | undefined,
  slot: PaymentMethodsSlot
): readonly PaymentMethodRow[] {
  return useMemo(() => {
    const rows = (userPaymentMethods ?? []).map(toRow).filter((row): row is PaymentMethodRow => row != null);
    return filterMethodsBySlot(rows, slot);
  }, [userPaymentMethods, slot]);
}

export function useMethodMap(
  userPaymentMethods: readonly UserPaymentMethodFieldsFragment[] | undefined
): Map<string, UserPaymentMethodFieldsFragment> {
  return useMemo(() => buildMethodMap(userPaymentMethods), [userPaymentMethods]);
}

export function useDeleteLabel(
  deleteId: string | null,
  methods: readonly PaymentMethodRow[],
  tType: PaymentMethodLabels
): string {
  return useMemo(() => buildDeleteLabel(deleteId, methods, tType), [deleteId, methods, tType]);
}

export function useActionCallbacks(
  deleteMethod: (options: { variables: { id: string } }) => Promise<unknown>,
  setDefaultMut: (options: { variables: { id: string } }) => Promise<unknown>,
  verifyMethod: (options: { variables: { id: string } }) => Promise<unknown>,
  refetch: () => Promise<unknown>
) {
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

  return { confirmDelete, setDefault, verify };
}

export function useHandleConfirmDelete(
  confirmDelete: (id: string) => Promise<void>,
  deleteId: string | null,
  setDeleteId: (id: string | null) => void
) {
  return useCallback(async () => {
    if (!deleteId) return;
    await confirmDelete(deleteId);
    setDeleteId(null);
  }, [confirmDelete, deleteId, setDeleteId]);
}

export function useHandleEdit(
  canManage: boolean,
  methodById: Map<string, UserPaymentMethodFieldsFragment>,
  setEditMethod: (method: UserPaymentMethodFieldsFragment | null) => void,
  setFormOpen: (open: boolean) => void
) {
  return useCallback(
    (id: string) => {
      if (!canManage) return;
      const method = methodById.get(id) ?? null;
      setEditMethod(method);
      setFormOpen(true);
    },
    [canManage, methodById, setEditMethod, setFormOpen]
  );
}

export function useCanVerify(): boolean {
  const { hasPermission } = useUserStore();
  return hasPermission(AppPermission.PaymentMethodsVerifyBankTransfer);
}
