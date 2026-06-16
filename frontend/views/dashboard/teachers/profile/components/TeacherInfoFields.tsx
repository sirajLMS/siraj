import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { labelSx, outlinedInputSx } from "@/frontend/components/ui/form";
import type { TeacherProfileFormData } from "../schemas/teacherProfileSchema";

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
      <Controller
        name="phone"
        control={control}
        render={({ field }) => <TextField {...field} fullWidth slotProps={{ input: { sx: outlinedInputSx } }} />}
      />
    </Box>
  );
}

export function GenderField() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();
  return (
    <Box>
      <Typography sx={labelSx}>{t("fields.gender")}</Typography>
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <RadioGroup {...field} row sx={{ height: 56, alignItems: "center" }}>
            <FormControlLabel
              value="male"
              control={
                <Radio
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                  })}
                />
              }
              label={t("fields.male")}
            />
            <FormControlLabel
              value="female"
              control={
                <Radio
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                  })}
                />
              }
              label={t("fields.female")}
            />
          </RadioGroup>
        )}
      />
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
          <FormControl fullWidth error={!!errors.timezone}>
            <Select {...field} sx={outlinedInputSx}>
              <MenuItem value="Africa/Cairo">Africa/Cairo (UTC +02:00)</MenuItem>
              <MenuItem value="Asia/Riyadh">Asia/Riyadh (UTC +03:00)</MenuItem>
              <MenuItem value="Asia/Dubai">Asia/Dubai (UTC +04:00)</MenuItem>
            </Select>
            {errors.timezone && (
              <FormHelperText sx={theme => ({ color: theme.palette.error.main })}>
                {errors.timezone.message}
              </FormHelperText>
            )}
          </FormControl>
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
