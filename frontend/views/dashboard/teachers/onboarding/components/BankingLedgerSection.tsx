"use client";

import { Box, Grid, Input, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { labelSx, standardInputSx } from "@/frontend/components/ui/form";
import type { TeacherOnboardingFormData } from "../schemas/teacherOnboardingSchema";

interface BankingLedgerSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly beneficiaryName: string;
      readonly bankName: string;
      readonly accountNumber: string;
      readonly routingNumber: string;
      readonly swiftBic: string;
      readonly iban: string;
    };
    readonly placeholders: {
      readonly beneficiaryName: string;
      readonly bankName: string;
      readonly accountNumber: string;
      readonly routingNumber: string;
      readonly swiftBic: string;
      readonly iban: string;
    };
  };
}

export function BankingLedgerSection({ register, errors, labels }: Readonly<BankingLedgerSectionProps>) {
  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.spacing(3) })}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.beneficiaryName}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("beneficiaryName")}
          placeholder={labels.placeholders.beneficiaryName}
          error={!!errors.beneficiaryName}
          fullWidth
          sx={standardInputSx}
        />
        {errors.beneficiaryName ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.beneficiaryName.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.bankName}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("bankName")}
          placeholder={labels.placeholders.bankName}
          error={!!errors.bankName}
          fullWidth
          sx={standardInputSx}
        />
        {errors.bankName ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.bankName.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.accountNumber}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("accountNumber")}
          placeholder={labels.placeholders.accountNumber}
          error={!!errors.accountNumber}
          fullWidth
          sx={standardInputSx}
        />
        {errors.accountNumber ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.accountNumber.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.routingNumber}
        </Box>
        <Input
          {...register("routingNumber")}
          placeholder={labels.placeholders.routingNumber}
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.swiftBic}
        </Box>
        <Input {...register("swiftBic")} placeholder={labels.placeholders.swiftBic} fullWidth sx={standardInputSx} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.iban}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("iban")}
          placeholder={labels.placeholders.iban}
          error={!!errors.iban}
          fullWidth
          sx={standardInputSx}
        />
        {errors.iban ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.iban.message}
          </Typography>
        ) : null}
      </Grid>
    </Grid>
  );
}
