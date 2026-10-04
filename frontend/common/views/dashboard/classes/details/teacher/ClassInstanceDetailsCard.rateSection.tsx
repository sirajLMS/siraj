"use client";

import { Grid, Stack, Typography } from "@mui/material";
import { DetailField } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.parts";
import type { ClassInstanceRateSectionProps } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";

export function ClassInstanceRateSection({
  rateAmount,
  rateCurrency,
  rateSourceLabel,
  labels,
}: ClassInstanceRateSectionProps) {
  return (
    <Stack sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: theme => theme.palette.outlineVariant }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 2 })}>
        {labels.rateSectionTitle}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.effectiveRateLabel}
            value={
              <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                {rateCurrency ?? ""} {rateAmount}
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.rateSourceLabel}
            value={<Typography variant="bodyLg">{rateSourceLabel}</Typography>}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
