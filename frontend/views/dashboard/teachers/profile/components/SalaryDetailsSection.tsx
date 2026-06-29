import { PaymentsOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import type { TeacherProfileFormData } from "../schemas/teacherProfileSchema";
import { SectionHeader } from "./SectionHeader";

export function SalaryDetailsSection() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();

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
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
              />
            )}
          />
        </Box>

        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ mb: 1, display: "block", color: theme.palette.onSurfaceVariant })}
          >
            {t("fields.currency")}
          </Typography>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <Select {...field} sx={theme => ({ borderRadius: theme.layout.radius.card })}>
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EGP">EGP - Egyptian Pound</MenuItem>
                  <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                </Select>
              </FormControl>
            )}
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
