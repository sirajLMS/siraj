"use client";

import { useQuery } from "@apollo/client/react";
import { BookOutlined, InfoOutlined, SyncProblemOutlined } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { QuotaFormFieldMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/quotaFormField.mobile";
import { SectionHeaderMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/sectionHeader.mobile";
import { useAppTranslation } from "@/shared/locale";

function TeacherField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canViewTeacher } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();

  const { data, loading } = useQuery(teachersQueryDocument, {
    variables: { search: "", limit: 100 },
    skip: !canViewTeacher,
  });

  if (!canViewTeacher) {
    return null;
  }

  const teachers = data?.teachers ?? [];

  return (
    <QuotaFormFieldMobile label={t.fields.teacher}>
      <Controller
        name="teacher"
        control={control}
        render={({ field }) => {
          const currentValue = field.value ?? "";
          const isInOptions = teachers.some(teacher => teacher?.name === currentValue);
          const showCurrentAsExtra = !loading && currentValue !== "" && !isInOptions;

          return (
            <FormControl fullWidth error={Boolean(errors.teacher)}>
              <Select {...field} displayEmpty disabled sx={quotaInputSx}>
                {loading && (
                  <MenuItem disabled value="">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="bodyMd">{t.fields.loadingTeachers}</Typography>
                    </Box>
                  </MenuItem>
                )}
                {showCurrentAsExtra && <MenuItem value={currentValue}>{currentValue}</MenuItem>}
                {teachers.map(teacher =>
                  teacher?.name ? (
                    <MenuItem key={teacher.id ?? ""} value={teacher.name}>
                      {teacher.name}
                    </MenuItem>
                  ) : null
                )}
              </Select>
              {errors.teacher && <FormHelperText>{errors.teacher.message}</FormHelperText>}
            </FormControl>
          );
        }}
      />
    </QuotaFormFieldMobile>
  );
}

function TotalClassesField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canViewTeacher } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();

  if (!canViewTeacher) {
    return null;
  }

  return (
    <QuotaFormFieldMobile label={t.fields.totalClasses}>
      <Controller
        name="totalClasses"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            variant="outlined"
            fullWidth
            disabled
            error={Boolean(errors.totalClasses)}
            helperText={errors.totalClasses?.message}
            sx={quotaInputSx}
          />
        )}
      />
    </QuotaFormFieldMobile>
  );
}

function ClassesLeftField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { readOnly, canEditQuota, canViewQuota } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  const fieldDisabled = readOnly || !canEditQuota;

  if (!canViewQuota) {
    return null;
  }

  return (
    <QuotaFormFieldMobile
      label={t.fields.classesLeft}
      extraLabel={
        fieldDisabled ? null : (
          <Box
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: theme.palette.tertiary,
              mb: 0.5,
            })}
          >
            <SyncProblemOutlined sx={{ fontSize: 16 }} />
            <Typography variant="labelSm" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.fields.overrideActive}
            </Typography>
          </Box>
        )
      }
      helperText={
        fieldDisabled ? null : (
          <Typography
            variant="bodyMd"
            sx={theme => ({
              color: theme.palette.tertiaryContainer,
              fontStyle: "italic",
              display: "flex",
              alignItems: "flex-start",
              gap: 0.5,
              mt: 1,
            })}
          >
            <InfoOutlined sx={{ fontSize: 14, mt: 0.5 }} />
            {t.fields.overrideNotice}
          </Typography>
        )
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
            disabled={fieldDisabled}
            error={Boolean(errors.classesLeft)}
            helperText={errors.classesLeft?.message}
            sx={theme => ({
              "& .MuiOutlinedInput-root": {
                borderRadius: "lg",
                backgroundColor: "transparent",
                color: theme.palette.tertiary,
                fontWeight: 700,
                "& fieldset": {
                  borderWidth: "0 0 2px 0",
                  borderColor: theme.palette.tertiary,
                },
              },
            })}
          />
        )}
      />
    </QuotaFormFieldMobile>
  );
}

export function CourseDetailsSectionMobile() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canViewTeacher, canViewQuota } = useQuotaFormAccess();

  if (!canViewQuota && !canViewTeacher) {
    return <ProfileRestrictedSection title={t.sections.courseDetails} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SectionHeaderMobile title={t.sections.courseDetails} mobileIcon={BookOutlined} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TeacherField />
        <TotalClassesField />
        <ClassesLeftField />
      </Box>
    </Box>
  );
}
