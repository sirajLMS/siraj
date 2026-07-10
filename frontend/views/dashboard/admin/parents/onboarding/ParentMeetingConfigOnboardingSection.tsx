"use client";

import { Grid, Stack, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";

type ParentMeetingConfigOnboardingSectionProps = {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly labels: {
    readonly sectionTitle: string;
    readonly optionalHint: string;
    readonly fields: {
      readonly meetingProvider: string;
      readonly meetingUrl: string;
      readonly meetingLabel: string;
    };
    readonly placeholders: {
      readonly meetingUrl: string;
      readonly meetingLabel: string;
    };
  };
};

export function ParentMeetingConfigOnboardingSection({
  register,
  control,
  errors,
  labels,
}: Readonly<ParentMeetingConfigOnboardingSectionProps>) {
  return (
    <Stack spacing={3} sx={theme => ({ p: theme.spacing(3) })}>
      <Typography sx={{ typography: "titleMd" }}>{labels.sectionTitle}</Typography>
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
