"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@mui/material";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog";
import type {
  PaymentDirection,
  UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentDirectionOptions, type PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import {
  usePaymentMethodFormReset,
  usePaymentMethodSubmit,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog.hooks";
import { PaymentMethodFormFields } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog.parts";
import {
  createEmptyPaymentMethodFormValues,
  type PaymentMethodFormValues,
  paymentMethodFormSchema,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import { usePaymentMethodCatalogs } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";
import type { PaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/types/paymentMethodProfile.types";
import type { PaymentMethodDirectionLabels } from "@/shared/locale/types/ui";

export type PaymentMethodFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly slotDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  readonly allowedDirections: readonly PaymentDirection[];
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly labels: PaymentMethodProfileLabels;
  /** Full-screen dialog chrome; `true` from the mobile tier caller, `false` on desktop. */
  readonly fullScreen?: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export function PaymentMethodFormDialog({
  open,
  userId,
  slotDirection,
  allowedDirections,
  editMethod,
  labels,
  onClose,
  onSaved,
}: PaymentMethodFormDialogProps) {
  const t = labels.manager;
  const tDir = labels.type;
  const isEdit = editMethod?.id != null;

  const defaultDirection = slotDirection;
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: createEmptyPaymentMethodFormValues(defaultDirection),
  });

  const watchedType = useWatch({ control: form.control, name: "type" });
  const watchedDirection = useWatch({ control: form.control, name: "direction" });

  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(
    watchedDirection ?? null
  );

  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  const directionOptions = useMemo(
    () =>
      getPaymentDirectionOptions(key => {
        const directionLabels = tDir.direction;
        const directionKeys: ReadonlyArray<keyof PaymentMethodDirectionLabels> = ["in", "out", "both"];
        const matchedKey = directionKeys.find(k => k === key);
        return matchedKey ? directionLabels[matchedKey] : "";
      }).filter(option => allowedDirections.includes(option.value)),
    [allowedDirections, tDir]
  );

  usePaymentMethodFormReset({
    open,
    editMethod,
    defaultDirection,
    form,
    walletOptions,
    paymentLinkOptions,
    onlineAccountOptions,
    setSelectedWallet,
    setSelectedPaymentLink,
    setSelectedOnlineAccount,
  });

  const { saving, onSubmit } = usePaymentMethodSubmit({
    isEdit,
    editMethod,
    userId,
    form,
    onSaved,
    onClose,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <BaseFormDialogSection
        title={isEdit ? t.editTitle : t.addTitle}
        cancelLabel={t.cancel}
        confirmLabel={t.save}
        onClose={onClose}
        onConfirm={() => void onSubmit()}
        isLoading={saving}
      >
        <PaymentMethodFormFields
          isEdit={isEdit}
          form={form}
          watchedType={watchedType}
          directionOptions={directionOptions}
          slotDirection={slotDirection}
          walletOptions={walletOptions}
          paymentLinkOptions={paymentLinkOptions}
          onlineAccountOptions={onlineAccountOptions}
          selectedWallet={selectedWallet}
          selectedPaymentLink={selectedPaymentLink}
          selectedOnlineAccount={selectedOnlineAccount}
          setSelectedWallet={setSelectedWallet}
          setSelectedPaymentLink={setSelectedPaymentLink}
          setSelectedOnlineAccount={setSelectedOnlineAccount}
          managerLabels={t}
        />
      </BaseFormDialogSection>
    </Dialog>
  );
}
