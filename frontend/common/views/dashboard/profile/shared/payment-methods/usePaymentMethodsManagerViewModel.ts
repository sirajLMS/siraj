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
import type { PaymentMethodTypeLabels } from "@/frontend/common/lib/payment-method";
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

function buildSlotDirection(slot: PaymentMethodsSlot): PaymentDirection.Payin | PaymentDirection.Payout {
  return slot === "payin" ? PaymentDirection.Payin : PaymentDirection.Payout;
}

function buildAllowedDirections(
  slot: PaymentMethodsSlot
): readonly (PaymentDirection.Payin | PaymentDirection.Payout | PaymentDirection.Both)[] {
  return slot === "payin"
    ? [PaymentDirection.Payin, PaymentDirection.Both]
    : [PaymentDirection.Payout, PaymentDirection.Both];
}

function filterMethodsBySlot(methods: readonly PaymentMethodRow[], slot: PaymentMethodsSlot): PaymentMethodRow[] {
  return methods.filter(row => matchesSlot(row.direction, slot));
}

function buildMethodMap(
  methods: readonly UserPaymentMethodFieldsFragment[] | undefined
): Map<string, UserPaymentMethodFieldsFragment> {
  const map = new Map<string, UserPaymentMethodFieldsFragment>();
  for (const method of methods ?? []) {
    if (method.id) map.set(method.id, method);
  }
  return map;
}

const PAYMENT_METHOD_TYPE_TO_LABEL_KEY: Readonly<Record<string, keyof PaymentMethodTypeLabels>> = {
  MOBILE_WALLET: "mobileWallet",
  PAYMENT_LINK: "paymentLink",
  ONLINE_ACCOUNT: "onlineAccount",
  BANK_TRANSFER: "bankTransfer",
  CASH: "cash",
};

function resolveTypeLabel(type: string, labels: PaymentMethodTypeLabels): string {
  const labelKey = PAYMENT_METHOD_TYPE_TO_LABEL_KEY[type];
  return labelKey ? labels[labelKey] : "";
}

function buildDeleteLabel(
  deleteId: string | null,
  methods: readonly PaymentMethodRow[],
  tType: ReturnType<typeof usePaymentMethodProfileLabels>["type"]
): string {
  if (!deleteId) return "";
  const row = methods.find(m => m.id === deleteId);
  if (!row) return "";
  return row.label?.trim() || resolveTypeLabel(row.type, tType.type);
}

function computeBusy(loading: boolean, deleting: boolean, settingDefault: boolean, verifying: boolean): boolean {
  return loading || deleting || settingDefault || verifying;
}

function usePaymentMethodsQuery(targetUserId: string) {
  return useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId, direction: null },
  });
}

function usePaymentMethodsMutations() {
  const [deleteMethod, { loading: deleting }] = useMutation(deleteUserPaymentMethodMutationDocument);
  const [setDefaultMut, { loading: settingDefault }] = useMutation(setDefaultUserPaymentMethodMutationDocument);
  const [verifyMethod, { loading: verifying }] = useMutation(verifyBankTransferPaymentMethodMutationDocument);
  return { deleteMethod, deleting, setDefaultMut, settingDefault, verifyMethod, verifying };
}

function useFormState() {
  const [formOpen, setFormOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<UserPaymentMethodFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  return { formOpen, setFormOpen, editMethod, setEditMethod, deleteId, setDeleteId };
}

function useComputedMethods(
  userPaymentMethods: readonly UserPaymentMethodFieldsFragment[] | undefined,
  slot: PaymentMethodsSlot
): readonly PaymentMethodRow[] {
  return useMemo(() => {
    const rows = (userPaymentMethods ?? []).map(toRow).filter((row): row is PaymentMethodRow => row != null);
    return filterMethodsBySlot(rows, slot);
  }, [userPaymentMethods, slot]);
}

function useMethodMap(
  userPaymentMethods: readonly UserPaymentMethodFieldsFragment[] | undefined
): Map<string, UserPaymentMethodFieldsFragment> {
  return useMemo(() => buildMethodMap(userPaymentMethods), [userPaymentMethods]);
}

function useDeleteLabel(
  deleteId: string | null,
  methods: readonly PaymentMethodRow[],
  tType: ReturnType<typeof usePaymentMethodProfileLabels>["type"]
): string {
  return useMemo(() => buildDeleteLabel(deleteId, methods, tType), [deleteId, methods, tType]);
}

function useActionCallbacks(
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

function useHandleConfirmDelete(
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

function useHandleEdit(
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

function useCanVerify(): boolean {
  const { hasPermission } = useUserStore();
  return hasPermission(AppPermission.PaymentMethodsVerifyBankTransfer);
}

export function usePaymentMethodsManagerViewModel(props: Readonly<UsePaymentMethodsManagerViewModelProps>) {
  const { targetUserId, slot, canManage } = props;
  const labels = usePaymentMethodProfileLabels();
  const t = labels.manager;
  const tType = labels.type;
  const canVerify = useCanVerify();

  const slotDirection = buildSlotDirection(slot);
  const allowedDirections = buildAllowedDirections(slot);

  const { data, loading, error, refetch } = usePaymentMethodsQuery(targetUserId);

  const { formOpen, setFormOpen, editMethod, setEditMethod, deleteId, setDeleteId } = useFormState();

  const userPaymentMethods = toPaymentMethodFragments(data?.userPaymentMethods);

  const methods = useComputedMethods(userPaymentMethods, slot);

  const methodById = useMethodMap(userPaymentMethods);

  const refetchData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { deleteMethod, deleting, setDefaultMut, settingDefault, verifyMethod, verifying } =
    usePaymentMethodsMutations();

  const { confirmDelete, setDefault, verify } = useActionCallbacks(deleteMethod, setDefaultMut, verifyMethod, refetch);

  const deleteLabel = useDeleteLabel(deleteId, methods, tType);

  const handleConfirmDelete = useHandleConfirmDelete(confirmDelete, deleteId, setDeleteId);

  const handleEdit = useHandleEdit(canManage, methodById, setEditMethod, setFormOpen);

  const busy = computeBusy(loading, deleting, settingDefault, verifying);

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
