"use client";

import { Box, Stack } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { NationalIdFormField } from "@/frontend/common/components/ui/input";
import { PROFILE_SECTION_GRID_SX } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileFormConstantsShared";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import type { ProfilePersonalFieldLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import type { toTeacherSectionLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import type { TeacherOwnEditFormData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type TeacherProfileOwnEditFormBodyProps = {
  readonly canEdit: (groupKey: ProfileFieldGroupKey) => boolean;
  readonly control: Control<TeacherOwnEditFormData>;
  readonly register: UseFormRegister<TeacherOwnEditFormData>;
  readonly sectionLabels: ReturnType<typeof toTeacherSectionLabels>;
  readonly personalFieldLabels: ProfilePersonalFieldLabels;
  readonly teacherData: { name: string | null; email: string | null };
  readonly identitySectionTitle: string;
  readonly nationalIdLabel: string;
  readonly nationalIdError?: string;
  readonly avatarLabel: string;
  readonly editAvatarTitle: string;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
};

export function TeacherProfileOwnEditFormBody({
  canEdit,
  control,
  register,
  sectionLabels,
  personalFieldLabels,
  teacherData,
  identitySectionTitle,
  nationalIdLabel,
  nationalIdError,
  avatarLabel,
  editAvatarTitle,
  onUploadAvatar,
}: Readonly<TeacherProfileOwnEditFormBodyProps>) {
  const scope = ProfileScope.OWN;

  return (
    <Stack spacing={3}>
      {canEdit("core_identity") ? (
        <AvatarImageField
          control={control}
          name="avatarUrl"
          label={avatarLabel}
          title={editAvatarTitle}
          onUploadAvatar={onUploadAvatar}
        />
      ) : null}
      <Box sx={PROFILE_SECTION_GRID_SX}>
        {canEdit("core_identity") ? (
          <AccountSection
            labels={sectionLabels}
            mode="edit"
            scope={scope}
            teacherData={teacherData}
            register={register}
            control={control}
          />
        ) : null}
        {canEdit("core_contact") ? (
          <ContactSection
            labels={sectionLabels}
            scope={scope}
            isAdminScope={false}
            register={register}
            control={control}
          />
        ) : null}
        {canEdit("teacher_identity") || canEdit("teacher_professional") ? (
          <TeacherExtensionProfileSection
            mode="edit"
            scope={scope}
            labels={{
              teacher: sectionLabels.teacher,
              personalFieldLabels,
              baseLabels: sectionLabels.baseLabels,
            }}
            sectionTitle={identitySectionTitle}
            register={register}
            control={control}
          />
        ) : null}
        {canEdit("teacher_professional") ? (
          <NationalIdFormField
            name="nationalId"
            control={control}
            label={nationalIdLabel}
            required
            error={Boolean(nationalIdError)}
            helperText={nationalIdError}
            size="small"
          />
        ) : null}
      </Box>
    </Stack>
  );
}
