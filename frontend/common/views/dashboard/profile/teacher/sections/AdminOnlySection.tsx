"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { type Control, Controller, type UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { AccountStatus, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
import {
  type TeacherAdminData,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useAppTranslation } from "@/shared/locale";

type AdminOnlySectionProps =
  | {
      readonly mode: "view";
      readonly adminData: TeacherAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    };

function formatGender(
  gender: string | null | undefined,
  labels: { readonly male: string; readonly female: string }
): string {
  if (gender === Gender.Male) {
    return labels.male;
  }
  if (gender === Gender.Female) {
    return labels.female;
  }
  return "";
}

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = useAppTranslation().profileTranslations.teacher;
  const tc = useAppTranslation().profileTranslations.base;

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <TextField label={t.fields.nationalId} fullWidth size="small" {...props.register("nationalId")} />
          <TextField label={t.fields.dateOfBirth} fullWidth size="small" {...props.register("dateOfBirth")} />
          <Controller
            control={props.control}
            name="gender"
            render={({ field }) => (
              <GenderSelector
                gender={field.value ?? null}
                setGenderAction={field.onChange}
                fullWidth
                labels={{
                  title: t.fields.gender,
                  male: t.gender.male,
                  female: t.gender.female,
                }}
              />
            )}
          />
          <TextField
            label={t.fields.qualifications}
            fullWidth
            size="small"
            multiline
            rows={3}
            {...props.register("qualifications")}
          />
          <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
            <MenuItem value={AccountStatus.Activated}>{t.status.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.status.deactivated}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const { adminData } = props;

  return (
    <SectionPanel title={t.sections.adminOnly}>
      <Stack spacing={2}>
        <InfoField label={t.fields.nationalId} value={toDisplayValue(adminData.nationalId, tc.notSet)} />
        <InfoField label={t.fields.dateOfBirth} value={toDisplayValue(adminData.dateOfBirth, tc.notSet)} />
        <InfoField
          label={t.fields.gender}
          value={toDisplayValue(
            formatGender(adminData.gender, { male: t.gender.male, female: t.gender.female }),
            tc.notSet
          )}
        />
        <InfoField label={t.fields.qualifications} value={toDisplayValue(adminData.qualifications, tc.notSet)} />
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t.fields.status}
          </Typography>
          <StatusBadge
            category="staffAccount"
            status={adminData.status === AccountStatus.Activated ? "activated" : "deactivated"}
            label={adminData.status === AccountStatus.Activated ? t.status.activated : t.status.deactivated}
          />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
