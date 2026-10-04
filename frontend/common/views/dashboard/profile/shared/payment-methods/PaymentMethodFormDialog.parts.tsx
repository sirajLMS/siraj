import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { getPaymentDirectionOptions, PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { DirectionControllerField } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog.fields";
import type { PaymentMethodFormValues } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import type { PaymentMethodManagerLabels } from "@/shared/locale/types/ui";

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

/** The dialog's form body: type selector (create mode only), direction,
 *  label, default toggle, and the per-type catalog-driven detail fields. */
export function PaymentMethodFormFields({
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
