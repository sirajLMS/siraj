import { Box, TextField } from "@mui/material";
import { type Control, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import {
  makeAlignedSectionSx,
  makeFieldBoxSx,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.helpers";
import { OptionSelectShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.parts";
import type { RecurringClassFormFieldsSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.types";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { CLASS_TYPE_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";

export function DurationAndClassTypeSectionShared({
  register,
  errors,
  labels,
  isSubmitting,
  classType,
  onClassTypeChange,
  options,
}: {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly classType: string;
  readonly onClassTypeChange: (value: string) => void;
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box sx={makeAlignedSectionSx(options)}>
      <Box sx={fieldBoxSx}>
        <options.DurationInput
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          labels={{
            duration: labels.duration,
            durationHours: labels.durationHours,
            durationMinutes: labels.durationMinutes,
            hours: labels.hours,
            minutes: labels.minutes,
          }}
        />
      </Box>
      <Box sx={fieldBoxSx}>
        <OptionSelectShared
          labelId="class-type-select-label"
          value={classType}
          label={labels.classType}
          placeholder={labels.classTypePlaceholder}
          isSubmitting={isSubmitting}
          onChange={onClassTypeChange}
          options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
        />
      </Box>
    </Box>
  );
}

export function RateSectionShared({
  register,
  control,
  labels,
  isSubmitting,
  options,
}: {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = rateCurrency ? getCurrencySymbol(rateCurrency) : "";
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box sx={makeAlignedSectionSx(options)}>
      <Box sx={fieldBoxSx}>
        <TextField
          label={labels.hourlyRateLabel}
          fullWidth
          size="small"
          disabled={isSubmitting}
          {...register("hourlyRate")}
          slotProps={{
            input: {
              startAdornment: <span aria-hidden>{currencySymbol}</span>,
            },
          }}
        />
      </Box>
      <Box sx={fieldBoxSx}>
        <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
      </Box>
    </Box>
  );
}
