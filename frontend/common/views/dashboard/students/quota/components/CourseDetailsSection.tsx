import { useQuery } from "@apollo/client/react";
import {
  AutoStoriesOutlined,
  BookOutlined,
  EditNoteOutlined,
  InfoOutlined,
  SyncProblemOutlined,
} from "@mui/icons-material";
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
import { QuotaFormField } from "@/frontend/common/views/dashboard/students/quota/components/QuotaFormField";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import { SectionHeader } from "@/frontend/common/views/dashboard/students/quota/components/SectionHeader";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
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
    <QuotaFormField label={t.fields.teacher}>
      <Controller
        name="teacher"
        control={control}
        render={({ field }) => {
          const currentValue = field.value ?? "";
          const isInOptions = teachers.some(teacher => teacher?.name === currentValue);
          const showCurrentAsExtra = !loading && currentValue !== "" && !isInOptions;

          return (
            <FormControl fullWidth error={!!errors.teacher}>
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
    </QuotaFormField>
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
    <QuotaFormField label={t.fields.totalClasses}>
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
    <QuotaFormField
      label={t.fields.classesLeft}
      extraLabel={
        fieldDisabled ? null : (
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
              color: { xs: theme.palette.tertiaryContainer, md: theme.palette.onSurfaceVariant },
              fontStyle: "italic",
              display: "flex",
              alignItems: "flex-start",
              gap: 0.5,
              mt: { xs: 1, md: 0 },
            })}
          >
            <InfoOutlined sx={{ display: { xs: "block", md: "none" }, fontSize: 14, mt: 0.5 }} />
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
            error={!!errors.classesLeft}
            helperText={errors.classesLeft?.message}
            slotProps={{
              input: {
                endAdornment: fieldDisabled ? undefined : (
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
                      {t.fields.overrideActive}
                    </Typography>
                  </Box>
                ),
              },
            }}
            sx={theme => ({
              "& .MuiOutlinedInput-root": {
                borderRadius: "lg",
                backgroundColor: { xs: "transparent", md: theme.palette.background.paper },
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
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canViewTeacher, canViewQuota } = useQuotaFormAccess();

  if (!canViewQuota && !canViewTeacher) {
    return <ProfileRestrictedSection title={t.sections.courseDetails} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
      <SectionHeader title={t.sections.courseDetails} desktopIcon={AutoStoriesOutlined} mobileIcon={BookOutlined} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 2, md: 4 } }}>
        <TeacherField />
        <TotalClassesField />
        <ClassesLeftField />
      </Box>
    </Box>
  );
}
