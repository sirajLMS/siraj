"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, Dialog, FormControlLabel, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { type Control, Controller, type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog";
import { PaymentMethodTypeFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import {
  PaymentDirection,
  type UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createUserPaymentMethodMutationDocument,
  updateUserPaymentMethodMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import {
  getPaymentDirectionOptions,
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
  paymentMethodFormSchema,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import { usePaymentMethodCatalogs } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";
import type { PaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/types/paymentMethodProfile.types";
import type { PaymentMethodDirectionLabels, PaymentMethodManagerLabels } from "@/shared/locale/types/ui";

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

type DirectionControllerProps = {
  readonly control: Control<PaymentMethodFormValues>;
  readonly label: string;
  readonly options: ReturnType<typeof getPaymentDirectionOptions>;
};

function DirectionControllerField({ control, label, options }: DirectionControllerProps) {
  return (
    <Controller
      name="direction"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          select
          label={label}
          value={field.value}
          onChange={event => {
            const value = event.target.value;
            for (const option of Object.values(PaymentDirection)) {
              if ((option as string) === value) {
                field.onChange(option);
                return;
              }
            }
          }}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          fullWidth
          size="small"
        >
          {options.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

type PaymentMethodFormFieldsProps = {
  readonly isEdit: boolean;
  readonly form: UseFormReturn<PaymentMethodFormValues>;
  readonly watchedType: PaymentMethodFormValues["type"];
  readonly directionOptions: ReturnType<typeof getPaymentDirectionOptions>;
  readonly slotDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  readonly walletOptions: readonly PaymentMethodCatalogOption[];
  readonly paymentLinkOptions: readonly PaymentMethodCatalogOption[];
  readonly onlineAccountOptions: readonly PaymentMethodCatalogOption[];
  readonly selectedWallet: PaymentMethodCatalogOption | null;
  readonly selectedPaymentLink: PaymentMethodCatalogOption | null;
  readonly selectedOnlineAccount: PaymentMethodCatalogOption | null;
  readonly setSelectedWallet: (option: PaymentMethodCatalogOption | null) => void;
  readonly setSelectedPaymentLink: (option: PaymentMethodCatalogOption | null) => void;
  readonly setSelectedOnlineAccount: (option: PaymentMethodCatalogOption | null) => void;
  readonly managerLabels: PaymentMethodManagerLabels;
};

function PaymentMethodFormFields({
  isEdit,
  form,
  watchedType,
  directionOptions,
  slotDirection,
  walletOptions,
  paymentLinkOptions,
  onlineAccountOptions,
  selectedWallet,
  selectedPaymentLink,
  selectedOnlineAccount,
  setSelectedWallet,
  setSelectedPaymentLink,
  setSelectedOnlineAccount,
  managerLabels,
}: PaymentMethodFormFieldsProps) {
  const t = managerLabels;

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      {isEdit ? null : (
        <PaymentMethodTypeSelector
          type={watchedType}
          setTypeAction={type => {
            if (type) form.setValue("type", type);
          }}
          required
          fullWidth
        />
      )}

      <DirectionControllerField control={form.control} label={t.direction} options={directionOptions} />

      <Controller
        name="label"
        control={form.control}
        render={({ field }) => (
          <TextField {...field} label={t.label} fullWidth size="small" value={field.value ?? ""} />
        )}
      />

      <Controller
        name="isDefault"
        control={form.control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox checked={field.value} onChange={event => field.onChange(event.target.checked)} />}
            label={slotDirection === PaymentDirection.Payin ? t.defaultPayin : t.defaultPayout}
          />
        )}
      />

      <PaymentMethodTypeFields
        type={watchedType}
        control={form.control}
        detailsPrefix="details"
        walletOptions={walletOptions}
        paymentLinkOptions={paymentLinkOptions}
        onlineAccountOptions={onlineAccountOptions}
        selectedWallet={selectedWallet}
        selectedPaymentLink={selectedPaymentLink}
        selectedOnlineAccount={selectedOnlineAccount}
        onWalletChangeAction={option => {
          setSelectedWallet(option);
          form.setValue("details.walletId", option.id);
        }}
        onPaymentLinkChangeAction={option => {
          setSelectedPaymentLink(option);
          form.setValue("details.paymentLinkId", option.id);
        }}
        onOnlineAccountChangeAction={option => {
          setSelectedOnlineAccount(option);
          form.setValue("details.onlineAccountId", option.id);
        }}
      />
    </Stack>
  );
}

type PaymentMethodSubmitProps = {
  readonly isEdit: boolean;
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly userId: string;
  readonly form: UseFormReturn<PaymentMethodFormValues>;
  readonly onSaved: () => void;
  readonly onClose: () => void;
};

function usePaymentMethodSubmit({ isEdit, editMethod, userId, form, onSaved, onClose }: PaymentMethodSubmitProps) {
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

function usePaymentMethodFormReset({
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
