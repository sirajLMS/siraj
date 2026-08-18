"use client";

import { Box, Button, Stack } from "@mui/material";
import { useRef } from "react";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import type { AdminResetPasswordSectionRef } from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentUserDetailsProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentUserDetailsProfileSection";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentProfileViewLabels } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { StudentAdminSection } from "@/frontend/common/views/dashboard/students/profile/sections/StudentAdminSection";
import { Translation, useAppTranslation } from "@/shared/locale";

type StudentProfileEditBodyProps = {
  readonly profile: StudentProfileRow;
  readonly labels: StudentProfileViewLabels;
  readonly draft: StudentPortalProfileEditDraft;
  readonly saving: boolean;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly onDraftChange: (patch: Partial<StudentPortalProfileEditDraft>) => void;
  readonly onSave: () => Promise<void>;
  readonly onSnackbarClose: () => void;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly onCancel?: () => void;
};

export function StudentProfileEditBody({
  profile,
  labels,
  draft,
  saving,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onDraftChange,
  onSave,
  onSnackbarClose,
  onUploadAvatar,
  onCancel,
}: Readonly<StudentProfileEditBodyProps>) {
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);
  const resetPasswordRef = useRef<AdminResetPasswordSectionRef>(null);
  const { resetPassword } = useAdminResetPassword(
    baseLabels.adminResetPassword.success,
    baseLabels.adminResetPassword.error
  );

  const targetUserId = profile.parentUserId ?? profile.id;

  const handleSave = async () => {
    const resetData = resetPasswordRef.current?.getResetPasswordData();
    if (resetData?.isValid && targetUserId) {
      const success = await resetPassword(targetUserId, resetData.newPassword, resetData.sendNotificationEmail);
      if (success) {
        resetPasswordRef.current?.reset();
      }
    }
    await onSave();
  };

  const sectionBase = {
    profile,
    labels,
    notSetLabel: baseLabels.notSet,
    timezoneLabel: parentLabels.fields.timezone,
    enforceFieldAccess: false,
    isEditing: true,
    draft,
    onDraftChange,
  };

  return (
    <Stack spacing={3}>
      <Box>
        <AvatarImageField
          label={labels.avatar}
          title={labels.editAvatarTitle}
          value={draft.avatarUrl}
          onChange={url => onDraftChange({ avatarUrl: url })}
          onUploadAvatar={onUploadAvatar}
          disabled={saving}
        />
      </Box>

      <StudentUserDetailsProfileSection
        {...sectionBase}
        sectionTitle={parentLabels.sections.contact}
        currencyLabel={parentLabels.fields.displayCurrency}
      />
      <StudentExtensionProfileSection {...sectionBase} sectionTitle={labels.personalInfo} />
      <StudentAdminSection
        mode="edit"
        studentData={profile}
        labels={{ baseLabels: { actions: { manageLifecycle: baseLabels.actions.manageLifecycle } } }}
        resetPasswordRef={resetPasswordRef}
      />

      <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-start" }}>
        {onCancel ? (
          <Button variant="outlined" onClick={onCancel} disabled={saving}>
            {labels.cancel}
          </Button>
        ) : null}
        <PrimaryPageAction onClick={() => void handleSave()} disabled={saving}>
          {labels.saveChanges}
        </PrimaryPageAction>
      </Stack>

      {snackbarSeverity === "success" ? (
        <FormSuccessSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      ) : (
        <FormErrorSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      )}
    </Stack>
  );
}
