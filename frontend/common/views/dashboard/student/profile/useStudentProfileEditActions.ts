"use client";

import { useMutation } from "@apollo/client/react";
import { useEffect, useRef } from "react";
import { recordStudentProfileEditMutationDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import {
  type StudentPortalProfileEditDraft,
  useStudentPortalProfileStore,
} from "@/frontend/common/stores/studentPortalProfileStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildStudentProfileEditVariables,
  profileToDraft,
} from "@/frontend/common/views/dashboard/student/profile/__shared__/studentProfileDraftHelpers";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentProfileViewLabels } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileLabels";
import { ProfileMode } from "@/shared/constants/profile.enum";
import { useRouter } from "@/shared/i18n/navigation";

interface UseStudentProfileEditActionsProps {
  readonly profile: StudentProfileRow | null;
  readonly mode: ProfileMode;
  readonly isOtherScope: boolean;
  readonly draft: StudentPortalProfileEditDraft;
  readonly labels: StudentProfileViewLabels;
  readonly refetch: () => Promise<unknown>;
}

export interface StudentProfileEditActions {
  readonly saving: boolean;
  readonly onStartEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onSave: () => Promise<void>;
}

export function useStudentProfileEditActions({
  profile,
  mode,
  isOtherScope,
  draft,
  labels,
  refetch,
}: UseStudentProfileEditActionsProps): StudentProfileEditActions {
  const router = useRouter();
  const setDraft = useStudentPortalProfileStore(s => s.setDraft);
  const setIsEditing = useStudentPortalProfileStore(s => s.setIsEditing);
  const resetEdit = useStudentPortalProfileStore(s => s.resetEdit);
  const showSnackbar = useStudentPortalProfileStore(s => s.showSnackbar);
  const [recordEdit, { loading: saving }] = useMutation(recordStudentProfileEditMutationDocument);

  const profileSyncKey = profile ? `${profile.id}:${profile.updatedAt ?? ""}:${profile.version}` : null;
  const syncedProfileKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== ProfileMode.EDIT || isOtherScope || !profileSyncKey || !profile) {
      return;
    }
    if (syncedProfileKeyRef.current === profileSyncKey) {
      return;
    }
    syncedProfileKeyRef.current = profileSyncKey;
    setDraft(profileToDraft(profile));
    setIsEditing(true);
  }, [mode, profileSyncKey, isOtherScope, profile, setDraft, setIsEditing]);

  const onStartEdit = () => {
    if (!profile) return;
    setDraft(profileToDraft(profile));
    setIsEditing(true);
  };

  const onCancelEdit = () => {
    resetEdit();
  };

  const onSave = async () => {
    try {
      await recordEdit({
        variables: buildStudentProfileEditVariables(null, draft),
      });
      await refetch();
      if (mode === ProfileMode.EDIT) {
        router.push("/profile");
        return;
      }
      resetEdit();
      showSnackbar(labels.saveSuccess, "success");
    } catch (error) {
      logger.error("Failed to save student profile", { error });
      showSnackbar(labels.saveError, "error");
    }
  };

  return {
    saving,
    onStartEdit,
    onCancelEdit,
    onSave,
  };
}
