// cspell:disable

import {
  AutoStoriesOutlined,
  BookOutlined,
  EditNoteOutlined,
  InfoOutlined,
  SyncProblemOutlined,
} from "@mui/icons-material";
import { Box, FormControl, FormHelperText, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import type { StudentQuotaFormData } from "../schemas/studentQuotaSchema";
import { QuotaFormField } from "./QuotaFormField";
import { quotaInputSx } from "./quotaFieldStyles";
import { SectionHeader } from "./SectionHeader";

function TeacherField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.teacher")}>
      <Controller
        name="teacher"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.teacher}>
            <Select {...field} displayEmpty sx={quotaInputSx}>
              <MenuItem value="Ahmed Mansour">Ahmed Mansour</MenuItem>
              <MenuItem value="Sara Al-Hashimi">Sara Al-Hashimi</MenuItem>
              <MenuItem value="Omar Farooq">Omar Farooq</MenuItem>
              <MenuItem value="Sheikh Abdullah Al-Mansur">Sheikh Abdullah Al-Mansur</MenuItem>
              <MenuItem value="Dr. Sarah Ibrahim">Dr. Sarah Ibrahim</MenuItem>
              <MenuItem value="Ustaz Omar Farooq">Ustaz Omar Farooq</MenuItem>
            </Select>
            {errors.teacher && <FormHelperText>{errors.teacher.message}</FormHelperText>}
          </FormControl>
        )}
      />
    </QuotaFormField>
  );
}

function TotalClassesField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.totalClasses")}>
      <Controller
        name="totalClasses"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            variant="outlined"
            fullWidth
            error={!!errors.totalClasses}
            helperText={errors.totalClasses?.message}
            sx={quotaInputSx}
          />
        )}
      />
    </QuotaFormField>
  );
}

function ClassesLeftField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField
      label={t("fields.classesLeft")}
      extraLabel={
        <Box
          sx={theme => ({
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.tertiary,
            mb: 0.5,
          })}
        >
          <SyncProblemOutlined sx={{ fontSize: 16 }} />
          <Typography variant="labelSm" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t("fields.overrideActive")}
          </Typography>
        </Box>
      }
      helperText={
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: { xs: theme.palette.tertiaryContainer, md: theme.palette.onSurfaceVariant },
            fontStyle: "italic",
            display: "flex",
            alignItems: "flex-start",
            gap: 0.5,
            mt: { xs: 1, md: 0 },
          })}
        >
          <InfoOutlined sx={{ display: { xs: "block", md: "none" }, fontSize: 14, mt: 0.5 }} />
          {t("fields.overrideNotice")}
        </Typography>
      }
    >
      <Controller
        name="classesLeft"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            variant="outlined"
            fullWidth
            error={!!errors.classesLeft}
            helperText={errors.classesLeft?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <Box
                    sx={theme => ({
                      display: { xs: "none", md: "flex" },
                      alignItems: "center",
                      gap: 0.5,
                      color: theme.palette.primary.main,
                      mr: 1,
                    })}
                  >
                    <EditNoteOutlined sx={{ fontSize: 20 }} />
                    <Typography variant="labelSm" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                      {t("fields.overrideActive")}
                    </Typography>
                  </Box>
                ),
              },
            }}
            sx={theme => ({
              "& .MuiOutlinedInput-root": {
                borderRadius: "lg",
                bgcolor: { xs: "transparent", md: theme.palette.background.paper },
                color: { xs: theme.palette.tertiary, md: theme.palette.primary.main },
                fontWeight: 700,
                "& fieldset": {
                  borderWidth: { xs: "0 0 2px 0", md: "1px" },
                  borderColor: { xs: theme.palette.tertiary, md: theme.palette.border.light },
                },
              },
            })}
          />
        )}
      />
    </QuotaFormField>
  );
}

export function CourseDetailsSection() {
  const t = useTranslations("dashboard.studentQuota");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
      <SectionHeader title={t("sections.courseDetails")} desktopIcon={AutoStoriesOutlined} mobileIcon={BookOutlined} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 2, md: 4 } }}>
        <TeacherField />
        <TotalClassesField />
        <ClassesLeftField />
      </Box>
    </Box>
  );
}
