import { Box, FormHelperText, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { labelSx, outlinedInputSx } from "@/frontend/components/ui/form";
import { PhoneFormField } from "@/frontend/components/ui/input";
import { GenderSelector } from "@/frontend/components/ui/input/genderSelector/GenderSelector";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export function FullNameField() {
  const t = useTranslations("dashboard.teacherProfile");
  const {
    control,
    formState: { errors },
  } = useFormContext<TeacherProfileFormData>();
  return (
    <Box>
      <Typography sx={labelSx}>
        {t("fields.fullName")}{" "}
        <Box
          component="span"
          sx={theme => ({
            color: theme.palette.error.main,
          })}
        >
          *
        </Box>
      </Typography>
      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            slotProps={{ input: { sx: outlinedInputSx } }}
          />
        )}
      />
    </Box>
  );
}

export function EmailField() {
  const t = useTranslations("dashboard.teacherProfile");
  const {
    control,
    formState: { errors },
  } = useFormContext<TeacherProfileFormData>();
  return (
    <Box>
      <Typography sx={labelSx}>
        {t("fields.email")}{" "}
        <Box
          component="span"
          sx={theme => ({
            color: theme.palette.error.main,
          })}
        >
          *
        </Box>
      </Typography>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{ input: { sx: outlinedInputSx } }}
          />
        )}
      />
    </Box>
  );
}

export function PhoneField() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();
  return (
    <Box>
      <Typography sx={labelSx}>{t("fields.phone")}</Typography>
      <PhoneFormField name="phone" control={control} hideLabel fullWidth />
    </Box>
  );
}

export function GenderField() {
  const t = useTranslations("dashboard.teacherProfile");
  const {
    control,
    formState: { errors },
  } = useFormContext<TeacherProfileFormData>();
  return (
    <Box>
      <Typography sx={labelSx}>{t("fields.gender")}</Typography>
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <GenderSelector
            gender={field.value ?? null}
            setGenderAction={field.onChange}
            fullWidth
            labels={{
              title: t("fields.gender"),
              male: t("fields.male"),
              female: t("fields.female"),
            }}
          />
        )}
      />
      {errors.gender ? (
        <FormHelperText sx={theme => ({ color: theme.palette.error.main })}>{errors.gender.message}</FormHelperText>
      ) : null}
    </Box>
  );
}

export function TimezoneField() {
  const t = useTranslations("dashboard.teacherProfile");
  const {
    control,
    formState: { errors },
  } = useFormContext<TeacherProfileFormData>();
  return (
    <Box sx={{ gridColumn: { md: "span 2" } }}>
      <Typography sx={labelSx}>
        {t("fields.timezone")}{" "}
        <Box
          component="span"
          sx={theme => ({
            color: theme.palette.error.main,
          })}
        >
          *
        </Box>
      </Typography>
      <Controller
        name="timezone"
        control={control}
        render={({ field }) => (
          <>
            <TimezoneSelect
              value={field.value ? toGraphqlIanaTimezone(field.value) : null}
              onChangeAction={value => {
                field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
              }}
              onBlurAction={field.onBlur}
              label={t("fields.timezone")}
              required
              fullWidth
            />
            {errors.timezone && (
              <FormHelperText sx={theme => ({ color: theme.palette.error.main })}>
                {errors.timezone.message}
              </FormHelperText>
            )}
          </>
        )}
      />
    </Box>
  );
}

export function AddressField() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();
  return (
    <Box sx={{ gridColumn: { md: "span 2" } }}>
      <Typography sx={labelSx}>{t("fields.address")}</Typography>
      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <TextField {...field} fullWidth multiline rows={3} slotProps={{ input: { sx: outlinedInputSx } }} />
        )}
      />
    </Box>
  );
}
