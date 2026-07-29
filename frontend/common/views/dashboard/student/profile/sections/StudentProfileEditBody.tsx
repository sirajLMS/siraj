"use client";

import { Box, Button, Stack } from "@mui/material";
import { FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import { StudentExtensionProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentExtensionProfileSection";
import { StudentParentAssignmentProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentParentAssignmentProfileSection";
import { StudentUserDetailsProfileSection } from "@/frontend/common/views/dashboard/student/profile/sections/StudentUserDetailsProfileSection";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentProfileViewLabels } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

type StudentProfileEditBodyProps = {
  readonly profile: StudentProfileRow;
  readonly labels: StudentProfileViewLabels;
  readonly draft: StudentPortalProfileEditDraft;
  readonly saving: boolean;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly onDraftChange: (patch: Partial<StudentPortalProfileEditDraft>) => void;
  readonly onSave: () => Promise<void>;
  readonly onSnackbarClose: () => void;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
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
}: Readonly<StudentProfileEditBodyProps>) {
  const parentLabels = useAppTranslation(Translation.Profile.Parent);
  const baseLabels = useAppTranslation(Translation.Profile.Base);

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
      <StudentParentAssignmentProfileSection {...sectionBase} sectionTitle={labels.parentInfo} />

      <Button variant="contained" onClick={() => void onSave()} disabled={saving} sx={{ alignSelf: "flex-start" }}>
        {labels.saveChanges}
      </Button>

      {snackbarSeverity === "success" ? (
        <FormSuccessSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      ) : (
        <FormErrorSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      )}
    </Stack>
  );
}
