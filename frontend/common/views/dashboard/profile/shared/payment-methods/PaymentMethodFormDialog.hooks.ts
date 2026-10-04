"use client";

import { useMutation } from "@apollo/client/react";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  PaymentDirection,
  UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createUserPaymentMethodMutationDocument,
  updateUserPaymentMethodMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import {
  getPaymentMethodCatalogOptionById,
  type PaymentMethodCatalogOption,
} from "@/frontend/common/lib/payment-method";
import {
  formDetailsToInput,
  fragmentToFormValues,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";
import {
  createEmptyPaymentMethodFormValues,
  type PaymentMethodFormValues,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

type PaymentMethodSubmitProps = {
  readonly isEdit: boolean;
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly userId: string;
  readonly form: UseFormReturn<PaymentMethodFormValues>;
  readonly onSaved: () => void;
  readonly onClose: () => void;
};

/** Owns the create/update mutations behind the dialog's submit action and
 *  exposes the combined saving flag plus the validated submit handler. */
export function usePaymentMethodSubmit({
  isEdit,
  editMethod,
  userId,
  form,
  onSaved,
  onClose,
}: PaymentMethodSubmitProps) {
  const [createMethod, { loading: creating }] = useMutation(createUserPaymentMethodMutationDocument);
  const [updateMethod, { loading: updating }] = useMutation(updateUserPaymentMethodMutationDocument);
  const saving = creating || updating;

  const onSubmit = form.handleSubmit(async values => {
    const details = formDetailsToInput(values.details);
    if (isEdit && editMethod?.id) {
      await updateMethod({
        variables: {
          id: editMethod.id,
          input: {
            direction: values.direction,
            isDefault: values.isDefault,
            label: values.label?.trim() ?? null,
            details,
          },
        },
      });
    } else {
      await createMethod({
        variables: {
          input: {
            userId,
            type: values.type,
            direction: values.direction,
            isDefault: values.isDefault,
            label: values.label?.trim() ?? null,
            details,
          },
        },
      });
    }
    onSaved();
    onClose();
  });

  return { saving, onSubmit };
}

type PaymentMethodFormResetProps = {
  readonly open: boolean;
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly defaultDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  readonly form: UseFormReturn<PaymentMethodFormValues>;
  readonly walletOptions: readonly PaymentMethodCatalogOption[];
  readonly paymentLinkOptions: readonly PaymentMethodCatalogOption[];
  readonly onlineAccountOptions: readonly PaymentMethodCatalogOption[];
  readonly setSelectedWallet: (option: PaymentMethodCatalogOption | null) => void;
  readonly setSelectedPaymentLink: (option: PaymentMethodCatalogOption | null) => void;
  readonly setSelectedOnlineAccount: (option: PaymentMethodCatalogOption | null) => void;
};

/** Resets the form and catalog selections whenever the dialog opens: hydrates
 *  from the edited method's fragment, or starts from an empty form. */
export function usePaymentMethodFormReset({
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
}: PaymentMethodFormResetProps) {
  useEffect(() => {
    if (!open) return;
    if (editMethod) {
      const values = fragmentToFormValues(editMethod);
      form.reset(values);
      const details = editMethod.details;
      setSelectedWallet(
        details?.walletId ? (getPaymentMethodCatalogOptionById(walletOptions, details.walletId) ?? null) : null
      );
      setSelectedPaymentLink(
        details?.paymentLinkId
          ? (getPaymentMethodCatalogOptionById(paymentLinkOptions, details.paymentLinkId) ?? null)
          : null
      );
      setSelectedOnlineAccount(
        details?.onlineAccountId
          ? (getPaymentMethodCatalogOptionById(onlineAccountOptions, details.onlineAccountId) ?? null)
          : null
      );
      return;
    }
    form.reset(createEmptyPaymentMethodFormValues(defaultDirection));
    setSelectedWallet(null);
    setSelectedPaymentLink(null);
    setSelectedOnlineAccount(null);
  }, [
    defaultDirection,
    editMethod,
    form,
    onlineAccountOptions,
    open,
    paymentLinkOptions,
    walletOptions,
    setSelectedWallet,
    setSelectedPaymentLink,
    setSelectedOnlineAccount,
  ]);
}
