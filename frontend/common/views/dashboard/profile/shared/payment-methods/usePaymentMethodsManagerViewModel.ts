"use client";

import { useCallback } from "react";
import type { PaymentMethodsSlot } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager";
import { usePaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodProfileLabels";
import {
  buildAllowedDirections,
  buildSlotDirection,
  computeBusy,
  toPaymentMethodFragments,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsManagerViewModel.helpers";
import {
  useActionCallbacks,
  useCanVerify,
  useComputedMethods,
  useDeleteLabel,
  useFormState,
  useHandleConfirmDelete,
  useHandleEdit,
  useMethodMap,
  usePaymentMethodsMutations,
  usePaymentMethodsQuery,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsManagerViewModel.hooks";

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
