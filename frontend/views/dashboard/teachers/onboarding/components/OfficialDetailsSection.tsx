"use client";

import { ChatOutlined } from "@mui/icons-material";
import { Box, Grid, Input, InputAdornment, MenuItem, Select, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { labelSx, outlinedInputSx, standardInputSx } from "@/frontend/components/ui/form";
import type { TeacherOnboardingFormData } from "../schemas/teacherOnboardingSchema";

interface OfficialDetailsSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly skypeId: string;
      readonly zoomLink: string;
      readonly country: string;
      readonly zoomUsername: string;
      readonly zoomPassword: string;
      readonly timezone: string;
    };
    readonly placeholders: {
      readonly skypeId: string;
      readonly zoomLink: string;
      readonly zoomUsername: string;
      readonly zoomPassword: string;
    };
  };
}

export function OfficialDetailsSection({ register, errors, labels }: Readonly<OfficialDetailsSectionProps>) {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.skypeId}
        </Box>
        <Input
          {...register("skypeId")}
          placeholder={labels.placeholders.skypeId}
          fullWidth
          sx={standardInputSx}
          startAdornment={
            <InputAdornment position="start">
              <ChatOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onSurfaceVariant })} />
            </InputAdornment>
          }
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomLink}
        </Box>
        <Input
          {...register("zoomLink")}
          placeholder={labels.placeholders.zoomLink}
          error={!!errors.zoomLink}
          fullWidth
          sx={standardInputSx}
        />
        {errors.zoomLink ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.zoomLink.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.country}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Select {...register("country")} defaultValue="Egypt" fullWidth sx={outlinedInputSx}>
          <MenuItem value="Egypt">Egypt</MenuItem>
          <MenuItem value="United Arab Emirates">United Arab Emirates</MenuItem>
          <MenuItem value="Saudi Arabia">Saudi Arabia</MenuItem>
          <MenuItem value="United Kingdom">United Kingdom</MenuItem>
          <MenuItem value="United States">United States</MenuItem>
        </Select>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomUsername}
        </Box>
        <Input
          {...register("zoomUsername")}
          placeholder={labels.placeholders.zoomUsername}
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomPassword}
        </Box>
        <Input
          {...register("zoomPassword")}
          placeholder={labels.placeholders.zoomPassword}
          type="password"
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.timezone}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Select {...register("timezone")} defaultValue="(GMT+02:00) Cairo" fullWidth sx={outlinedInputSx}>
          <MenuItem value="(GMT+02:00) Cairo">(GMT+02:00) Cairo</MenuItem>
          <MenuItem value="(GMT+04:00) Abu Dhabi">(GMT+04:00) Abu Dhabi</MenuItem>
          <MenuItem value="(GMT+03:00) Riyadh">(GMT+03:00) Riyadh</MenuItem>
          <MenuItem value="(GMT+00:00) London">(GMT+00:00) London</MenuItem>
        </Select>
      </Grid>
    </Grid>
  );
}
