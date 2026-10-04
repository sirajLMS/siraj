import { MenuItem, TextField } from "@mui/material";
import { type Control, Controller } from "react-hook-form";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { getPaymentDirectionOptions } from "@/frontend/common/lib/payment-method";
import type { PaymentMethodFormValues } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

type DirectionControllerProps = {
  readonly control: Control<PaymentMethodFormValues>;
  readonly label: string;
  readonly options: ReturnType<typeof getPaymentDirectionOptions>;
};

/** Direction select bound to the form's `direction` field. Selecting a menu
 *  option resolves the raw string back to the `PaymentDirection` enum value. */
export function DirectionControllerField({ control, label, options }: DirectionControllerProps) {
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
