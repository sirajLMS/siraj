"use client";

import { Grid, Stack, TextField, Typography } from "@mui/material";
import type { FieldError } from "react-hook-form";
import { MeetingProviderSelectContainer } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelectContainer";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";

export interface MeetingConfigFieldsLabels {
  readonly sectionTitle?: string;
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
}

interface MeetingConfigFieldsProps {
  readonly labels: MeetingConfigFieldsLabels;
  readonly meetingProviderValue: MeetingProviderFieldsFragment | null;
  readonly onMeetingProviderChange: (value: MeetingProviderFieldsFragment | null) => void;
  readonly meetingLabelInputProps: Omit<React.ComponentProps<typeof TextField>, "label" | "placeholder" | "fullWidth">;
  readonly meetingUrlInputProps: Omit<
    React.ComponentProps<typeof TextField>,
    "label" | "placeholder" | "fullWidth" | "dir"
  >;
  readonly meetingUrlError?: FieldError;
}

export function MeetingConfigFields({
  labels,
  meetingProviderValue,
  onMeetingProviderChange,
  meetingLabelInputProps,
  meetingUrlInputProps,
  meetingUrlError,
}: Readonly<MeetingConfigFieldsProps>) {
  return (
    <Stack spacing={3} sx={theme => ({ p: theme.spacing(3) })}>
      {labels.sectionTitle !== undefined && (
        <Typography sx={{ typography: "titleLg" }}>{labels.sectionTitle}</Typography>
      )}
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {labels.optionalHint}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MeetingProviderSelectContainer
            value={meetingProviderValue}
            onChangeAction={onMeetingProviderChange}
            label={labels.fields.meetingProvider}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...meetingLabelInputProps}
            label={labels.fields.meetingLabel}
            placeholder={labels.placeholders.meetingLabel}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            {...meetingUrlInputProps}
            label={labels.fields.meetingUrl}
            placeholder={labels.placeholders.meetingUrl}
            error={meetingUrlError !== undefined}
            helperText={meetingUrlError?.message}
            fullWidth
            dir="ltr"
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
