"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import {
  createUserPaymentMethodMutationDocument,
  updateUserPaymentMethodMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import {
  getPaymentMethodCatalogOptionById,
  getPaymentMethodDirectionOptions,
  type PaymentMethodCatalogOption,
} from "@/frontend/lib/payment-method";
import {
  createEmptyPaymentMethodFormValues,
  type PaymentMethodFormValues,
  paymentMethodFormSchema,
} from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import {
  formDetailsToInput,
  fragmentToFormValues,
} from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormMappers";
import { usePaymentMethodCatalogs } from "@/frontend/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";

export type PaymentMethodFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly slotDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  readonly allowedDirections: readonly PaymentDirection[];
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export function PaymentMethodFormDialog({
  open,
  userId,
  slotDirection,
  allowedDirections,
  editMethod,
  onClose,
  onSaved,
}: PaymentMethodFormDialogProps) {
  const t = useTranslations("ui.paymentMethod.manager");
  const tDir = useTranslations("ui.paymentMethod");
  const isEdit = editMethod?.id != null;

  const defaultDirection = slotDirection;
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: createEmptyPaymentMethodFormValues(defaultDirection),
  });

  const watchedType = form.watch("type");
  const watchedDirection = form.watch("direction");

  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(
    watchedDirection ?? null
  );

  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  const directionOptions = useMemo(
    () =>
      getPaymentMethodDirectionOptions(key => tDir(key as never)).filter(option =>
        allowedDirections.includes(option.value)
      ),
    [allowedDirections, tDir]
  );

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
  ]);

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
            label: values.label?.trim() || null,
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
            label: values.label?.trim() || null,
            details,
          },
        },
      });
    }
    onSaved();
    onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!isEdit ? (
            <PaymentMethodTypeSelector
              type={watchedType}
              setTypeAction={type => {
                if (type) form.setValue("type", type);
              }}
              required
              fullWidth
            />
          ) : null}

          <Controller
            name="direction"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                select
                label={t("direction")}
                value={field.value}
                onChange={event => field.onChange(event.target.value as PaymentDirection)}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
                size="small"
              >
                {directionOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="label"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t("label")}
                fullWidth
                size="small"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            name="isDefault"
            control={form.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={event => field.onChange(event.target.checked)} />}
                label={slotDirection === PaymentDirection.Payin ? t("defaultPayin") : t("defaultPayout")}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={() => void onSubmit()} disabled={saving}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
