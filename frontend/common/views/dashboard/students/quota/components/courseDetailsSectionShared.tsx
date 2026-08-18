"use client";

import { useQuery } from "@apollo/client/react";
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { CourseDetailsSectionSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.types";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

function TeacherField({ teacherLabelId }: Readonly<{ teacherLabelId: string }>) {
  const { labels: t, canViewTeacher } = useQuotaFormAccess();
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
    <Controller
      name="teacher"
      control={control}
      render={({ field }) => {
        const currentValue = field.value ?? "";
        const isInOptions = teachers.some(teacher => teacher?.name === currentValue);
        const showCurrentAsExtra = !loading && currentValue !== "" && !isInOptions;

        return (
          <FormControl fullWidth variant="outlined" error={Boolean(errors.teacher)} sx={quotaInputSx}>
            <InputLabel id={teacherLabelId} shrink>
              {t.fields.teacher}
            </InputLabel>
            <Select {...field} labelId={teacherLabelId} label={t.fields.teacher} displayEmpty disabled>
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
            {errors.teacher ? <FormHelperText>{errors.teacher.message}</FormHelperText> : null}
          </FormControl>
        );
      }}
    />
  );
}

function TotalClassesField() {
  const { labels: t, canViewTeacher } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();

  if (!canViewTeacher) {
    return null;
  }

  return (
    <Controller
      name="totalClasses"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={t.fields.totalClasses}
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
  );
}

function ClassesLeftField({
  overrideEndAdornment,
  overrideNotice,
  classesLeftInputSx,
}: Readonly<{
  overrideEndAdornment: CourseDetailsSectionSharedProps["slots"]["overrideEndAdornment"];
  overrideNotice: CourseDetailsSectionSharedProps["slots"]["overrideNotice"];
  classesLeftInputSx: CourseDetailsSectionSharedProps["slots"]["classesLeftInputSx"];
}>) {
  const { labels: t, readOnly, canEditQuota, canViewQuota } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  const fieldDisabled = readOnly || !canEditQuota;

  if (!canViewQuota) {
    return null;
  }

  const EndAdornmentIcon = overrideEndAdornment.icon;
  const OverrideNoticeIcon = overrideNotice.icon;

  return (
    <Box>
      <Controller
        name="classesLeft"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t.fields.classesLeft}
            type="number"
            variant="outlined"
            fullWidth
            disabled={fieldDisabled}
            error={Boolean(errors.classesLeft)}
            helperText={errors.classesLeft?.message}
            slotProps={{
              input: {
                endAdornment: fieldDisabled ? undefined : (
                  <Box sx={overrideEndAdornment.boxSx}>
                    <EndAdornmentIcon sx={{ fontSize: overrideEndAdornment.iconFontSize }} />
                    <Typography variant="labelSm" sx={overrideEndAdornment.typographySx}>
                      {t.fields.overrideActive}
                    </Typography>
                  </Box>
                ),
              },
            }}
            sx={classesLeftInputSx}
          />
        )}
      />
      {fieldDisabled ? null : (
        <Typography variant="bodyMd" sx={overrideNotice.sx}>
          {OverrideNoticeIcon ? <OverrideNoticeIcon sx={{ fontSize: overrideNotice.iconFontSize, mt: 0.5 }} /> : null}
          {t.fields.overrideNotice}
        </Typography>
      )}
    </Box>
  );
}

export function CourseDetailsSectionShared({ slots }: Readonly<CourseDetailsSectionSharedProps>) {
  const { labels: t, canViewTeacher, canViewQuota } = useQuotaFormAccess();
  const {
    renderHeader,
    teacherLabelId,
    rootGap,
    fieldsContainerSx,
    overrideEndAdornment,
    overrideNotice,
    classesLeftInputSx,
  } = slots;

  if (!canViewQuota && !canViewTeacher) {
    return <ProfileRestrictedSection title={t.sections.courseDetails} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: rootGap }}>
      {renderHeader(t.sections.courseDetails)}

      <Box sx={fieldsContainerSx}>
        <TeacherField teacherLabelId={teacherLabelId} />
        <TotalClassesField />
        <ClassesLeftField
          overrideEndAdornment={overrideEndAdornment}
          overrideNotice={overrideNotice}
          classesLeftInputSx={classesLeftInputSx}
        />
      </Box>
    </Box>
  );
}
