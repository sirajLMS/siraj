import { PaymentsOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/lib/currency";
import { SectionHeader } from "@/frontend/views/dashboard/teachers/profile/components/SectionHeader";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export function SalaryDetailsSection() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();
  const currency = useWatch({ control, name: "currency" });
  const currencySymbol = getCurrencySymbol((currency as CurrencyCode | undefined) ?? CurrencyCode.Usd);

  return (
    <Box component="section">
      <SectionHeader title={t("sections.salaryDetails")} icon={PaymentsOutlined} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ mb: 1, display: "block", color: theme.palette.onSurfaceVariant })}
          >
            {t("fields.baseSalary")}
          </Typography>
          <Controller
            name="baseSalary"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                slotProps={{
                  input: {
                    sx: theme => ({ borderRadius: theme.layout.radius.card }),
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                  },
                }}
              />
            )}
          />
        </Box>

        <Box>
          <Controller
            name="currency"
            control={control}
            render={({ field, fieldState }) => {
              const option: CurrencyOption | null = field.value
                ? (getCurrencyByCode(field.value as CurrencyCode) ?? null)
                : null;
              return (
                <CurrencySelect
                  currency={option}
                  setCurrencyAction={selected => {
                    field.onChange(selected.code as string);
                  }}
                  onBlurAction={field.onBlur}
                  label={t("fields.currency")}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              );
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ mb: 1, display: "block", color: theme.palette.onSurfaceVariant })}
          >
            {t("fields.paymentMethod")}
          </Typography>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <Select {...field} sx={theme => ({ borderRadius: theme.layout.radius.card })}>
                  <MenuItem value="BANK_ACCOUNT">Bank Account</MenuItem>
                  <MenuItem value="PAYPAL">PayPal</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Box>
      </Box>
    </Box>
  );
}
