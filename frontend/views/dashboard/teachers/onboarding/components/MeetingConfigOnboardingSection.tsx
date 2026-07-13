"use client";

import { Grid, Stack, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { MeetingProviderSelect } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

type MeetingConfigOnboardingSectionProps = {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly meetingProvider: string;
      readonly meetingUrl: string;
      readonly meetingLabel: string;
    };
    readonly placeholders: {
      readonly meetingUrl: string;
      readonly meetingLabel: string;
    };
    readonly optionalHint: string;
  };
};

export function MeetingConfigOnboardingSection({
  register,
  control,
  errors,
  labels,
}: Readonly<MeetingConfigOnboardingSectionProps>) {
  return (
    <Stack spacing={3} sx={theme => ({ p: theme.spacing(3) })}>
      <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.optionalHint}</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            control={control}
            name="meetingProvider"
            render={({ field }) => (
              <MeetingProviderSelect
                value={(field.value as MeetingProviderFieldsFragment | null | undefined) ?? null}
                onChangeAction={value => field.onChange(value)}
                label={labels.fields.meetingProvider}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register("meetingLabel")}
            label={labels.fields.meetingLabel}
            placeholder={labels.placeholders.meetingLabel}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            {...register("meetingUrl")}
            label={labels.fields.meetingUrl}
            placeholder={labels.placeholders.meetingUrl}
            error={!!errors.meetingUrl}
            helperText={errors.meetingUrl?.message}
            fullWidth
            dir="ltr"
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
