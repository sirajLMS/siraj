"use client";

import { AlternateEmailOutlined, GroupsOutlined } from "@mui/icons-material";
import { Grid, InputAdornment, TextField } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
}

export function SocialCommsSection({ register, control }: Props) {
  const t = useAppTranslation().dashboardTranslations.parentOnboarding;

  return (
    <SectionPanel title={t.sections.socialComms}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <PhoneFormField
            name="whatsapp"
            control={control}
            label={t.fields.whatsapp}
            placeholder={t.placeholders.whatsapp}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <TextField
            {...register("facebook")}
            label={t.fields.facebook}
            placeholder={t.placeholders.facebook}
            fullWidth
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupsOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <TextField
            {...register("twitter")}
            label={t.fields.twitter}
            placeholder={t.placeholders.twitter}
            fullWidth
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
